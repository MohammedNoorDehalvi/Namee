import { NextResponse } from 'next/server';
import { requireCaptainRequest } from '@/lib/auction-server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { response, session, supabase } = requireCaptainRequest(request);
  if (response || !session || !supabase) return response;

  const [{ data: captain }, { data: team }, { data: players }] = await Promise.all([
    supabase.from('captains').select('id,captain_name,team_name,team_id,budget,remaining_budget,photo_url,created_at').eq('id', session.id).maybeSingle(),
    supabase.from('teams').select('*').eq('captain_id', session.id).maybeSingle(),
    supabase.from('players').select('*').eq('sold_to_captain_id', session.id).order('sold_price', { ascending: false }),
  ]);

  return NextResponse.json({ captain, team, players: players || [] });
}
