import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { getActiveSeason } from '@/lib/season-server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = requireRole(request, 'captain');
  if (!session) return NextResponse.json({ error: 'Captain access required.' }, { status: 401 });

  const supabase = createSupabaseAdmin();
  const season = await getActiveSeason(supabase);

  if (!season) {
    return NextResponse.json({ captain: null, team: null, players: [], season: null });
  }

  const [{ data: captain }, { data: team }, { data: players }] = await Promise.all([
    supabase
      .from('captains')
      .select('id,season_id,captain_name,team_name,team_id,budget,remaining_budget,photo_url,created_at')
      .eq('id', session.id)
      .eq('season_id', season.id)
      .maybeSingle(),
    supabase.from('teams').select('*').eq('captain_id', session.id).eq('season_id', season.id).maybeSingle(),
    supabase
      .from('players')
      .select('*')
      .eq('season_id', season.id)
      .eq('sold_to_captain_id', session.id)
      .order('created_at', { ascending: false }),
  ]);

  return NextResponse.json({ season, captain, team, players: players || [] });
}
