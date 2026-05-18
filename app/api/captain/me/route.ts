import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = requireRole(request, 'captain');
  if (!session) return NextResponse.json({ error: 'Captain access required.' }, { status: 401 });
  const supabase = createSupabaseAdmin();
  const [{ data: captain }, { data: players }] = await Promise.all([
    supabase.from('captains').select('id,captain_name,team_name,budget,remaining_budget,created_at').eq('id', session.id).maybeSingle(),
    supabase.from('players').select('*').eq('sold_to_captain_id', session.id).order('created_at', { ascending: false })
  ]);
  return NextResponse.json({ captain, players: players || [] });
}
