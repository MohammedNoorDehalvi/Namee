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

type PlayerRow = {
  id: string;
  name?: string | null;
  role?: string | null;
  season_id?: string | null;
  status?: string | null;
  auction_status?: string | null;
  sold_to_team?: string | null;
  sold_to_team_id?: string | null;
  sold_to_captain_id?: string | null;
  sold_price?: number | null;
  [key: string]: unknown;
};

type TeamRow = {
  id: string;
  team_name?: string | null;
  captain_name?: string | null;
  captain_id?: string | null;
  logo_url?: string | null;
  season_id?: string | null;
  [key: string]: unknown;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Archive algorithm (explicit):
 * 1. Detect which season the user opened (id / number / name)
 * 2. Load teams for that season_id
 * 3. Load ALL players for that season_id from Supabase `players`
 * 4. Keep sold ones (auction_status SOLD | status Sold | has sold_to_* / price)
 * 5. Divide sold players by sold_to_team_id (fallback: team name / captain)
 */
export async function GET(_request: Request, { params }: { params: { seasonId: string } }) {
  const supabase = createSupabaseAdmin();
  const rawId = String(params.seasonId || '').trim();

  // ── 1) Detect season ──────────────────────────────────────────────
  let season: SeasonRow | null = null;

  if (isUuid(rawId)) {
    const { data, error } = await supabase.from('seasons').select('*').eq('id', rawId).maybeSingle();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE });
    }
    season = data as SeasonRow | null;
  }

  if (!season) {
    const num = Number(rawId);
    if (Number.isFinite(num) && num > 0) {
      const { data } = await supabase.from('seasons').select('*').eq('season_number', num).maybeSingle();
      season = data as SeasonRow | null;
    }
  }

  if (!season && rawId) {
    const { data } = await supabase.from('seasons').select('*').ilike('name', rawId).maybeSingle();
    season = data as SeasonRow | null;
  }

  // e.g. "APL 7" / "apl7"
  if (!season && rawId) {
    const m = rawId.match(/(\d+)/);
    if (m) {
      const { data } = await supabase
        .from('seasons')
        .select('*')
        .eq('season_number', Number(m[1]))
        .maybeSingle();
      season = data as SeasonRow | null;
    }
  }

  if (!season?.id) {
    return NextResponse.json({ error: 'Season not found.' }, { status: 404, headers: NO_STORE });
  }

  const seasonId = season.id;

  // ── 2) Teams for this season ──────────────────────────────────────
  const { data: teamsData, error: teamsError } = await supabase
    .from('teams')
    .select('*')
    .eq('season_id', seasonId)
    .order('team_name', { ascending: true });

  if (teamsError) {
    return NextResponse.json({ error: teamsError.message }, { status: 500, headers: NO_STORE });
  }

  const teams = (teamsData || []) as TeamRow[];

  const { data: captainsData } = await supabase
    .from('captains')
    .select('*')
    .eq('season_id', seasonId)
    .order('captain_name', { ascending: true });

  const captains = captainsData || [];

  // ── 3) ALL players for this season_id from players table ──────────
  const { data: seasonPlayersData, error: playersError } = await supabase
    .from('players')
    .select('*')
    .eq('season_id', seasonId)
    .order('name', { ascending: true });

  if (playersError) {
    return NextResponse.json({ error: playersError.message }, { status: 500, headers: NO_STORE });
  }

  const seasonPlayers = (seasonPlayersData || []) as PlayerRow[];

  // ── 4) Sold subset (status / auction_status / sold fields) ────────
  const soldFromSeason = seasonPlayers.filter((p) => {
    const auction = String(p.auction_status || '').toUpperCase();
    const status = String(p.status || '').toUpperCase();
    const hasTeam = Boolean(p.sold_to_team_id || p.sold_to_team || p.sold_to_captain_id);
    const hasPrice = Number(p.sold_price || 0) > 0;
    return auction === 'SOLD' || status === 'SOLD' || hasTeam || hasPrice;
  });

  // Extra safety: also query sold flags directly (in case filter above misses)
  const { data: soldQueryA } = await supabase
    .from('players')
    .select('*')
    .eq('season_id', seasonId)
    .eq('auction_status', 'SOLD');

  const { data: soldQueryB } = await supabase
    .from('players')
    .select('*')
    .eq('season_id', seasonId)
    .eq('status', 'Sold');

  const soldMap = new Map<string, PlayerRow>();
  for (const p of [...soldFromSeason, ...(soldQueryA || []), ...(soldQueryB || [])] as PlayerRow[]) {
    if (p?.id) soldMap.set(p.id, p);
  }
  const soldPlayers = Array.from(soldMap.values()).sort(
    (a, b) => Number(b.sold_price || 0) - Number(a.sold_price || 0),
  );

  // ── 5) Divide by team id ──────────────────────────────────────────
  const squads = teams.map((team) => {
    const teamId = team.id;
    const teamName = String(team.team_name || '').trim().toLowerCase();

    const teamSold = soldPlayers
      .filter((p) => {
        // Primary: sold_to_team_id === team.id
        if (p.sold_to_team_id && p.sold_to_team_id === teamId) return true;
        // Fallback: team name (same season only — already filtered)
        if (p.sold_to_team && teamName && p.sold_to_team.trim().toLowerCase() === teamName) return true;
        // Fallback: captain id
        if (p.sold_to_captain_id && team.captain_id && p.sold_to_captain_id === team.captain_id) return true;
        return false;
      })
      .sort((a, b) => Number(b.sold_price || 0) - Number(a.sold_price || 0));

    const spent = teamSold.reduce((sum, p) => sum + Number(p.sold_price || 0), 0);

    return {
      team,
      soldPlayers: teamSold,
      soldCount: teamSold.length,
      spent,
    };
  });

  // Unsold from same season pool
  const soldIds = new Set(soldPlayers.map((p) => p.id));
  const unsoldPlayers = seasonPlayers.filter((p) => {
    if (soldIds.has(p.id)) return false;
    const auction = String(p.auction_status || '').toUpperCase();
    const status = String(p.status || '').toUpperCase();
    return auction === 'UNSOLD' || status === 'UNSOLD';
  });

  // Bids / events for this season only
  const { data: bids } = await supabase
    .from('bids')
    .select('*')
    .eq('season_id', seasonId)
    .order('created_at', { ascending: false });

  const { data: events } = await supabase
    .from('auction_events')
    .select('*')
    .eq('season_id', seasonId)
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: matches } = await supabase.from('matches').select('*').eq('season_id', seasonId);
  const { data: pointsTable } = await supabase.from('points_table').select('*').eq('season_id', seasonId);

  // Status breakdown for debugging empty sold lists
  const statusBreakdown: Record<string, number> = {};
  for (const p of seasonPlayers) {
    const key = `${p.status || '?'}|${p.auction_status || '?'}`;
    statusBreakdown[key] = (statusBreakdown[key] || 0) + 1;
  }

  return NextResponse.json(
    {
      season,
      teams,
      captains,
      /** Full pool for this season_id */
      players: seasonPlayers,
      /** Sold only for this season_id */
      soldPlayers,
      unsoldPlayers,
      /** Grouped by team id */
      squads,
      bids: bids || [],
      events: events || [],
      matches: matches || [],
      pointsTable: pointsTable || [],
      meta: {
        query: {
          step1: 'resolve season from URL',
          step2: `teams.eq(season_id, ${seasonId})`,
          step3: `players.eq(season_id, ${seasonId})`,
          step4: 'filter sold',
          step5: 'group by sold_to_team_id',
        },
        seasonId,
        seasonName: season.name,
        seasonNumber: season.season_number,
        teamCount: teams.length,
        playerCount: seasonPlayers.length,
        soldCount: soldPlayers.length,
        unsoldCount: unsoldPlayers.length,
        bidCount: (bids || []).length,
        statusBreakdown,
        teamIds: teams.map((t) => t.id),
      },
    },
    { headers: NO_STORE },
  );
}
