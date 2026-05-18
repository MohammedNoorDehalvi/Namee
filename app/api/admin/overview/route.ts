import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  if (!requireRole(request, 'admin')) return NextResponse.json({ error: 'Admin access required.' }, { status: 401 });
  const supabase = createSupabaseAdmin();
  const [players, captains, bids] = await Promise.all([
    supabase.from('players').select('*').order('created_at', { ascending: false }),
    supabase.from('captains').select('id,captain_name,team_name,budget,remaining_budget,created_at').order('team_name'),
    supabase.from('bids').select('*').order('created_at', { ascending: false }).limit(50)
  ]);
  return NextResponse.json({ players: players.data || [], captains: captains.data || [], bids: bids.data || [] });
}
