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

type AnyRow = Record<string, unknown> & { id?: string };

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/** Only UUID season_ids — never pass "8" / "APL 8" into a uuid column `.in()`. */
function seasonIdKeys(season: SeasonRow) {
  const keys = [season.id];
  if (season.season_number != null && isUuid(String(season.season_number))) {
    keys.push(String(season.season_number));
  }
  return Array.from(new Set(keys.filter(Boolean)));
}

async function selectBySeasonId(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  table: string,
  season: SeasonRow,
  orderField?: string | null,
) {
  const keys = seasonIdKeys(season);

  let query = supabase.from(table).select('*').in('season_id', keys);
  if (orderField) {
    query = query.order(orderField, { ascending: true });
  }

  const { data, error } = await query;
  if (!error && data) return data as AnyRow[];

  // Retry without order (some tables lack created_at / team_name indexes)
  const { data: plain, error: plainError } = await supabase.from(table).select('*').eq('season_id', season.id);
  if (!plainError && plain) return plain as AnyRow[];

  console.error(`[seasons/${season.id}] select ${table} failed`, error || plainError);
  return [] as AnyRow[];
}

function mergeById<T extends AnyRow>(...lists: T[][]): T[] {
  const map = new Map<string, T>();
  for (const list of lists) {
    for (const row of list) {
      const id = String(row.id || '');
      if (!id) continue;
      const existing = map.get(id);
      if (!existing) {
        map.set(id, row);
        continue;
      }
      // Prefer sold / richer auction outcome rows when merging duplicates
      const preferNew =
        String(row.auction_status || '').toUpperCase() === 'SOLD' ||
        String(row.status || '').toLowerCase() === 'sold' ||
        (Number(row.sold_price || 0) > Number(existing.sold_price || 0));
      map.set(id, preferNew ? { ...existing, ...row } : { ...row, ...existing });
    }
  }
  return Array.from(map.values());
}

function isSoldPlayer(row: AnyRow) {
  const auction = String(row.auction_status || '').toUpperCase();
  const status = String(row.status || '').toUpperCase();
  const hasTeam = Boolean(row.sold_to_team_id || row.sold_to_team || row.sold_to_captain_id);
  const hasPrice = Number(row.sold_price || 0) > 0;
  return auction === 'SOLD' || status === 'SOLD' || hasTeam || hasPrice;
}

/**
 * Load sold players that belong to this season's franchises even when
 * season_id on the player row is null or was never set (common after re-imports).
 */
async function loadSoldPlayersForSeasonTeams(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  teams: AnyRow[],
  captains: AnyRow[],
  season: SeasonRow,
) {
  const teamIds = teams.map((t) => String(t.id)).filter(Boolean);
  const teamNames = teams.map((t) => String(t.team_name || '').trim()).filter(Boolean);
  const captainIds = captains.map((c) => String(c.id)).filter(Boolean);

  const results: AnyRow[] = [];

  // By sold_to_team_id (most reliable)
  if (teamIds.length > 0) {
    const { data, error } = await supabase.from('players').select('*').in('sold_to_team_id', teamIds);
    if (!error && data) results.push(...(data as AnyRow[]));
    else if (error) console.error('[seasons] sold by team_id', error);
  }

  // By sold_to_captain_id
  if (captainIds.length > 0) {
    const { data, error } = await supabase.from('players').select('*').in('sold_to_captain_id', captainIds);
    if (!error && data) results.push(...(data as AnyRow[]));
    else if (error) console.error('[seasons] sold by captain_id', error);
  }

  // By sold_to_team name (exact match per team)
  for (const name of teamNames) {
    const { data, error } = await supabase.from('players').select('*').eq('sold_to_team', name);
    if (!error && data) {
      // If season_id is set and points at a *different* season, skip (avoid cross-season bleed)
      for (const row of data as AnyRow[]) {
        const rowSeason = row.season_id == null || row.season_id === '' ? null : String(row.season_id);
        if (rowSeason && rowSeason !== season.id) continue;
        results.push(row);
      }
    }
  }

  // Date-window fallback: null season_id solds updated while this season was active
  if (season.started_at) {
    const from = season.started_at;
    const to = season.ended_at || new Date().toISOString();
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .is('season_id', null)
      .or('auction_status.eq.SOLD,status.eq.Sold')
      .gte('updated_at', from)
      .lte('updated_at', to);

    if (!error && data) {
      const nameSet = new Set(teamNames.map((n) => n.toLowerCase()));
      for (const row of data as AnyRow[]) {
        const soldName = String(row.sold_to_team || '').trim().toLowerCase();
        if (soldName && nameSet.has(soldName)) results.push(row);
        else if (row.sold_to_team_id && teamIds.includes(String(row.sold_to_team_id))) results.push(row);
      }
    }
  }

  return results.filter(isSoldPlayer);
}

async function loadBidsForSeason(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  season: SeasonRow,
  teams: AnyRow[],
) {
  const bySeason = await selectBySeasonId(supabase, 'bids', season, 'created_at');
  const teamIds = teams.map((t) => String(t.id)).filter(Boolean);
  let byTeam: AnyRow[] = [];

  if (teamIds.length > 0) {
    const { data, error } = await supabase.from('bids').select('*').in('team_id', teamIds);
    if (!error && data) {
      // Prefer bids whose season_id matches or is null (legacy)
      byTeam = (data as AnyRow[]).filter((b) => {
        const sid = b.season_id == null || b.season_id === '' ? null : String(b.season_id);
        return !sid || sid === season.id;
      });
    }
  }

  return mergeById(bySeason, byTeam);
}

export async function GET(_request: Request, { params }: { params: { seasonId: string } }) {
  const supabase = createSupabaseAdmin();
  const seasonId = params.seasonId;

  let season: SeasonRow | null = null;

  if (isUuid(seasonId)) {
    const { data, error } = await supabase.from('seasons').select('*').eq('id', seasonId).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE });
    season = data as SeasonRow | null;
  }

  if (!season) {
    const num = Number(seasonId);
    if (Number.isFinite(num)) {
      const { data } = await supabase.from('seasons').select('*').eq('season_number', num).maybeSingle();
      season = data as SeasonRow | null;
    }
  }

  // Also allow lookup by name e.g. "APL 8"
  if (!season && seasonId.trim()) {
    const { data } = await supabase.from('seasons').select('*').ilike('name', seasonId.trim()).maybeSingle();
    season = data as SeasonRow | null;
  }

  if (!season) {
    return NextResponse.json({ error: 'Season not found.' }, { status: 404, headers: NO_STORE });
  }

  const [teams, captains, seasonPlayers, events, matches, pointsTable] = await Promise.all([
    selectBySeasonId(supabase, 'teams', season, 'team_name'),
    selectBySeasonId(supabase, 'captains', season, 'captain_name'),
    selectBySeasonId(supabase, 'players', season, 'created_at'),
    selectBySeasonId(supabase, 'auction_events', season, 'created_at'),
    selectBySeasonId(supabase, 'matches', season, 'created_at'),
    selectBySeasonId(supabase, 'points_table', season, null),
  ]);

  const recoveredSold = await loadSoldPlayersForSeasonTeams(supabase, teams, captains, season);
  const players = mergeById(seasonPlayers, recoveredSold);
  const bids = await loadBidsForSeason(supabase, season, teams);

  const soldCount = players.filter(isSoldPlayer).length;

  return NextResponse.json(
    {
      season,
      teams,
      captains,
      players,
      bids,
      events,
      matches,
      pointsTable,
      meta: {
        playerCount: players.length,
        soldCount,
        teamCount: teams.length,
        bidCount: bids.length,
        recoveredSoldCount: recoveredSold.length,
      },
    },
    { headers: NO_STORE },
  );
}
