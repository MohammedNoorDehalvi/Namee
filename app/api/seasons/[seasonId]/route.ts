import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

async function safeSelect(supabase: ReturnType<typeof createSupabaseAdmin>, table: string, seasonId: string, order = 'created_at') {
  const { data, error } = await supabase.from(table).select('*').eq('season_id', seasonId).order(order, { ascending: false });

  if (error) return [];

  return data || [];
}

export async function GET(_request: Request, { params }: { params: { seasonId: string } }) {
  const supabase = createSupabaseAdmin();
  const seasonId = params.seasonId;

  const { data: season, error } = await supabase.from('seasons').select('*').eq('id', seasonId).maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!season) return NextResponse.json({ error: 'Season not found.' }, { status: 404 });

  const [teams, captains, players, bids, events, matches, pointsTable] = await Promise.all([
    safeSelect(supabase, 'teams', seasonId, 'team_name'),
    safeSelect(supabase, 'captains', seasonId, 'team_name'),
    safeSelect(supabase, 'players', seasonId, 'created_at'),
    safeSelect(supabase, 'bids', seasonId, 'created_at'),
    safeSelect(supabase, 'auction_events', seasonId, 'created_at'),
    safeSelect(supabase, 'matches', seasonId, 'created_at'),
    safeSelect(supabase, 'points_table', seasonId, 'points'),
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
