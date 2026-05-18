import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!requireRole(request, 'admin')) return NextResponse.json({ error: 'Admin access required.' }, { status: 401 });
  const supabase = createSupabaseAdmin();
  const { data: nextPlayer } = await supabase
    .from('players')
    .select('*')
    .eq('approval_status', 'Approved')
    .eq('status', 'Available')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!nextPlayer) {
    await supabase.from('auction').update({
      current_player_id: null,
      auction_status: 'Not Started',
      highest_bid: 0,
      highest_bidder_id: null,
      highest_team_name: null,
      updated_at: new Date().toISOString()
    }).eq('id', 1);
    return NextResponse.json({ ok: true, message: 'No available player left.' });
  }

  const base = Number(nextPlayer.base_price || 0);
  await supabase.from('players').update({ current_bid: base }).eq('id', nextPlayer.id);
  await supabase.from('auction').upsert({
    id: 1,
    current_player_id: nextPlayer.id,
    auction_status: 'Live',
    highest_bid: base,
    highest_bidder_id: null,
    highest_team_name: null,
    updated_at: new Date().toISOString()
  });
  return NextResponse.json({ ok: true, player: nextPlayer });
}
