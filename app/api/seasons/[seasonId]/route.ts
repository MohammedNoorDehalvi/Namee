import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
};

type SeasonRow = {
  id: string;
  season_number?: number | null;
  name?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  status?: string | null;
};

type AnyRow = Record<string, unknown> & {
  id?: string;
  season_id?: string | null;
  team_name?: string | null;
  captain_id?: string | null;
  sold_to_team_id?: string | null;
  sold_to_team?: string | null;
  sold_to_captain_id?: string | null;
  sold_price?: number | null;
  auction_status?: string | null;
  status?: string | null;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isSoldRow(row: AnyRow) {
  const auction = String(row.auction_status || '').toUpperCase();
  const status = String(row.status || '').toUpperCase();
  return (
    auction === 'SOLD' ||
    status === 'SOLD' ||
    Boolean(row.sold_to_team_id || row.sold_to_team || row.sold_to_captain_id) ||
    Number(row.sold_price || 0) > 0
  );
}

function mergeById(rows: AnyRow[]) {
  const map = new Map<string, AnyRow>();
  for (const row of rows) {
    const id = String(row.id || '');
    if (!id) continue;
    const prev = map.get(id);
    if (!prev) {
      map.set(id, row);
      continue;
    }
    // Prefer the sold / higher-price snapshot
    const prefer =
      isSoldRow(row) && (!isSoldRow(prev) || Number(row.sold_price || 0) >= Number(prev.sold_price || 0));
    map.set(id, prefer ? { ...prev, ...row } : { ...row, ...prev });
  }
  return Array.from(map.values());
}

async function loadSeason(supabase: ReturnType<typeof createSupabaseAdmin>, seasonId: string) {
  if (isUuid(seasonId)) {
    const { data, error } = await supabase.from('seasons').select('*').eq('id', seasonId).maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return data as SeasonRow;
  }

  const asNum = Number(seasonId);
  if (Number.isFinite(asNum)) {
    const { data } = await supabase.from('seasons').select('*').eq('season_number', asNum).maybeSingle();
    if (data) return data as SeasonRow;
  }

  const { data } = await supabase.from('seasons').select('*').ilike('name', seasonId.trim()).maybeSingle();
  return (data as SeasonRow | null) || null;
}

/**
 * Archive contract:
 * 1) teams  WHERE season_id = season.id
 * 2) sold players for those teams:
 *      sold_to_team_id IN (team ids)
 *      AND (season_id = season.id OR season_id IS NULL)  -- never steal another season's tagged sales
 * 3) pool players WHERE season_id = season.id
 * 4) sold players WHERE season_id = season.id (covers correct stamps even if team_id missing)
 */
export async function GET(_request: Request, { params }: { params: { seasonId: string } }) {
  const supabase = createSupabaseAdmin();

  let season: SeasonRow | null;
  try {
    season = await loadSeason(supabase, params.seasonId);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Season lookup failed' },
      { status: 500, headers: NO_STORE },
    );
  }

  if (!season) {
    return NextResponse.json({ error: 'Season not found.' }, { status: 404, headers: NO_STORE });
  }

  const seasonId = season.id;

  // 1) Franchises for this season only
  const { data: teamsRaw, error: teamsError } = await supabase
    .from('teams')
    .select('*')
    .eq('season_id', seasonId)
    .order('team_name', { ascending: true });

  if (teamsError) {
    return NextResponse.json({ error: teamsError.message }, { status: 500, headers: NO_STORE });
  }

  const teams = (teamsRaw || []) as AnyRow[];
  const teamIds = teams.map((t) => String(t.id)).filter(Boolean);
  const teamNameById = new Map(teams.map((t) => [String(t.id), String(t.team_name || '')]));

  const { data: captainsRaw } = await supabase
    .from('captains')
    .select('*')
    .eq('season_id', seasonId)
    .order('captain_name', { ascending: true });
  const captains = (captainsRaw || []) as AnyRow[];

  // 2) Sold by season_id + team_id (primary archive path)
  const soldByTeamId: AnyRow[] = [];
  if (teamIds.length > 0) {
    // PostgREST: sold_to_team_id in teamIds
    const { data, error } = await supabase.from('players').select('*').in('sold_to_team_id', teamIds);

    if (error) {
      console.error('[seasons] sold_to_team_id query failed', error);
    } else {
      for (const row of (data || []) as AnyRow[]) {
        const rowSeason = row.season_id == null || row.season_id === '' ? null : String(row.season_id);
        // Keep: tagged to this season, or legacy null season_id
        // Drop: tagged to a different season (prevents APL8 sales showing under APL6 same-named teams)
        if (rowSeason && rowSeason !== seasonId) continue;
        if (!isSoldRow(row)) continue;
        soldByTeamId.push(row);
      }
    }
  }

  // 3) Sold stamped with this season_id (even if sold_to_team_id missing)
  const { data: soldBySeasonId } = await supabase
    .from('players')
    .select('*')
    .eq('season_id', seasonId)
    .or('auction_status.eq.SOLD,status.eq.Sold');

  // 4) Full player pool for this season (available / unsold / sold)
  const { data: poolPlayers, error: poolError } = await supabase
    .from('players')
    .select('*')
    .eq('season_id', seasonId)
    .order('name', { ascending: true });

  if (poolError) {
    console.error('[seasons] pool players failed', poolError);
  }

  // 5) Captain-link recovery for this season's captains (null season_id only)
  const captainIds = captains.map((c) => String(c.id)).filter(Boolean);
  const soldByCaptain: AnyRow[] = [];
  if (captainIds.length > 0) {
    const { data } = await supabase.from('players').select('*').in('sold_to_captain_id', captainIds);
    for (const row of (data || []) as AnyRow[]) {
      const rowSeason = row.season_id == null || row.season_id === '' ? null : String(row.season_id);
      if (rowSeason && rowSeason !== seasonId) continue;
      if (!isSoldRow(row)) continue;
      soldByCaptain.push(row);
    }
  }

  // 6) Name match only for null-season solds → this season's team names
  const soldByName: AnyRow[] = [];
  for (const team of teams) {
    const name = String(team.team_name || '').trim();
    if (!name) continue;
    const { data } = await supabase.from('players').select('*').eq('sold_to_team', name).is('season_id', null);
    if (data?.length) soldByName.push(...(data as AnyRow[]).filter(isSoldRow));
  }

  const soldPlayers = mergeById([
    ...soldByTeamId,
    ...((soldBySeasonId || []) as AnyRow[]).filter(isSoldRow),
    ...soldByCaptain,
    ...soldByName,
  ]);

  const players = mergeById([...(poolPlayers || []), ...soldPlayers] as AnyRow[]);

  // Bids: season_id first, then team_id for this season's franchises
  const { data: bidsBySeason } = await supabase
    .from('bids')
    .select('*')
    .eq('season_id', seasonId)
    .order('created_at', { ascending: false });

  let bidsByTeam: AnyRow[] = [];
  if (teamIds.length > 0) {
    const { data } = await supabase.from('bids').select('*').in('team_id', teamIds);
    bidsByTeam = ((data || []) as AnyRow[]).filter((b) => {
      const sid = b.season_id == null || b.season_id === '' ? null : String(b.season_id);
      return !sid || sid === seasonId;
    });
  }
  const bids = mergeById([...(bidsBySeason || []), ...bidsByTeam] as AnyRow[]);

  const { data: events } = await supabase
    .from('auction_events')
    .select('*')
    .eq('season_id', seasonId)
    .order('created_at', { ascending: false });

  const { data: matches } = await supabase.from('matches').select('*').eq('season_id', seasonId);
  const { data: pointsTable } = await supabase.from('points_table').select('*').eq('season_id', seasonId);

  // Squad breakdown: season team → sold players by team id (then name)
  const squads = teams.map((team) => {
    const tid = String(team.id);
    const tname = String(team.team_name || '').trim().toLowerCase();
    const sold = soldPlayers
      .filter((p) => {
        if (p.sold_to_team_id && String(p.sold_to_team_id) === tid) return true;
        if (
          p.sold_to_team &&
          tname &&
          String(p.sold_to_team).trim().toLowerCase() === tname
        ) {
          // Only if not claimed by another team id in this season
          return true;
        }
        if (p.sold_to_captain_id && team.captain_id && String(p.sold_to_captain_id) === String(team.captain_id)) {
          return true;
        }
        return false;
      })
      .sort((a, b) => Number(b.sold_price || 0) - Number(a.sold_price || 0));

    const spent = sold.reduce((sum, p) => sum + Number(p.sold_price || 0), 0);
    return {
      team,
      soldPlayers: sold,
      soldCount: sold.length,
      spent,
    };
  });

  return NextResponse.json(
    {
      season,
      teams,
      captains,
      players,
      soldPlayers,
      squads,
      bids,
      events: events || [],
      matches: matches || [],
      pointsTable: pointsTable || [],
      meta: {
        seasonId,
        teamCount: teams.length,
        playerCount: players.length,
        soldCount: soldPlayers.length,
        bidCount: bids.length,
        // Debug helpers for admins
        soldViaTeamId: soldByTeamId.length,
        soldViaSeasonId: (soldBySeasonId || []).filter(isSoldRow).length,
        soldViaCaptain: soldByCaptain.length,
        soldViaNameNullSeason: soldByName.length,
        teamIds,
        teamNames: teams.map((t) => teamNameById.get(String(t.id))),
      },
    },
    { headers: NO_STORE },
  );
}
