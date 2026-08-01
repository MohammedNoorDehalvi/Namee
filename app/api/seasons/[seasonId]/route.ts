import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

async function safeSelect(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  table: string,
  season: { id: string; season_number?: number | null; name?: string | null },
  orderField = 'created_at',
) {
  const matchValues = Array.from(
    new Set(
      [
        season.id,
        season.season_number !== undefined && season.season_number !== null ? String(season.season_number) : null,
        season.name ? String(season.name) : null,
      ].filter((v): v is string => Boolean(v)),
    ),
  );

  let query = supabase.from(table).select('*').in('season_id', matchValues);

  if (orderField) {
    query = query.order(orderField, { ascending: false });
  }

  const { data, error } = await query;

  if (!error && data) return data;

  const { data: noOrderData, error: noOrderError } = await supabase.from(table).select('*').in('season_id', matchValues);
  if (!noOrderError && noOrderData) return noOrderData;

  const { data: eqData, error: eqError } = await supabase.from(table).select('*').eq('season_id', season.id);
  if (!eqError && eqData) return eqData;

  return [];
}

export async function GET(_request: Request, { params }: { params: { seasonId: string } }) {
  const supabase = createSupabaseAdmin();
  const seasonId = params.seasonId;

  let season: any = null;
  const { data: seasonById, error: idError } = await supabase.from('seasons').select('*').eq('id', seasonId).maybeSingle();

  if (seasonById) {
    season = seasonById;
  } else {
    const num = Number(seasonId);
    if (Number.isFinite(num)) {
      const { data: seasonByNum } = await supabase.from('seasons').select('*').eq('season_number', num).maybeSingle();
      if (seasonByNum) season = seasonByNum;
    }
  }

  if (idError && !season) return NextResponse.json({ error: idError.message }, { status: 500 });
  if (!season) return NextResponse.json({ error: 'Season not found.' }, { status: 404 });

  const [teams, captains, players, bids, events, matches, pointsTable] = await Promise.all([
    safeSelect(supabase, 'teams', season, 'team_name'),
    safeSelect(supabase, 'captains', season, 'team_name'),
    safeSelect(supabase, 'players', season, 'created_at'),
    safeSelect(supabase, 'bids', season, 'created_at'),
    safeSelect(supabase, 'auction_events', season, 'created_at'),
    safeSelect(supabase, 'matches', season, 'created_at'),
    safeSelect(supabase, 'points_table', season, 'points'),
  ]);

  return NextResponse.json({
    season,
    teams,
    captains,
    players,
    bids,
    events,
    matches,
    pointsTable,
  });
}

