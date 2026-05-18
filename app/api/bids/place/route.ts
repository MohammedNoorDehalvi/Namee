import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const captainSession = requireRole(request, 'captain');
  if (!captainSession) return NextResponse.json({ error: 'Captain login required.' }, { status: 401 });

  const { player_id, bid_amount } = await request.json();
  const amount = Number(bid_amount);
  if (!player_id || !amount) return NextResponse.json({ error: 'Player and bid amount are required.' }, { status: 400 });

  const supabase = createSupabaseAdmin();
  const [{ data: auction }, { data: player }, { data: captain }] = await Promise.all([
    supabase.from('auction').select('*').eq('id', 1).maybeSingle(),
    supabase.from('players').select('*').eq('id', player_id).maybeSingle(),
    supabase.from('captains').select('*').eq('id', captainSession.id).maybeSingle()
  ]);

  if (!auction || auction.auction_status !== 'Live') return NextResponse.json({ error: 'Auction is not live.' }, { status: 400 });
  if (!player || auction.current_player_id !== player.id) return NextResponse.json({ error: 'This player is not currently being auctioned.' }, { status: 400 });
  if (player.status !== 'Available') return NextResponse.json({ error: 'Cannot bid on sold or unsold player.' }, { status: 400 });
  if (!captain) return NextResponse.json({ error: 'Captain not found.' }, { status: 404 });

  const current = Number(auction.highest_bid || player.current_bid || player.base_price || 0);
  if (amount <= current) return NextResponse.json({ error: 'Bid must be higher than current bid.' }, { status: 400 });
  if (amount > captain.remaining_budget) return NextResponse.json({ error: 'Bid is more than remaining team budget.' }, { status: 400 });

  const { error: bidError } = await supabase.from('bids').insert({
    player_id: player.id,
    captain_id: captain.id,
    team_name: captain.team_name,
    bid_amount: amount
  });
  if (bidError) return NextResponse.json({ error: bidError.message }, { status: 500 });

  await supabase.from('players').update({ current_bid: amount }).eq('id', player.id);
  await supabase.from('auction').update({
    highest_bid: amount,
    highest_bidder_id: captain.id,
    highest_team_name: captain.team_name,
    updated_at: new Date().toISOString()
  }).eq('id', 1);

  return NextResponse.json({ ok: true });
}
