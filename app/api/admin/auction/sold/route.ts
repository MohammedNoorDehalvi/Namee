import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!requireRole(request, 'admin')) return NextResponse.json({ error: 'Admin access required.' }, { status: 401 });
  const supabase = createSupabaseAdmin();

  const { data: auction } = await supabase.from('auction').select('*').eq('id', 1).maybeSingle();
  if (!auction?.current_player_id) return NextResponse.json({ error: 'No current player.' }, { status: 400 });
  if (!auction.highest_bidder_id) return NextResponse.json({ error: 'Cannot mark sold without a highest bidder.' }, { status: 400 });

  const { data: captain } = await supabase.from('captains').select('*').eq('id', auction.highest_bidder_id).single();
  if (!captain) return NextResponse.json({ error: 'Highest captain not found.' }, { status: 404 });
  if (captain.remaining_budget < auction.highest_bid) return NextResponse.json({ error: 'Captain does not have enough remaining budget.' }, { status: 400 });

  const remaining = captain.remaining_budget - auction.highest_bid;
  await supabase.from('players').update({
    status: 'Sold',
    sold_to_team: captain.team_name,
    sold_to_captain_id: captain.id,
    sold_price: auction.highest_bid,
    current_bid: auction.highest_bid
  }).eq('id', auction.current_player_id);
  await supabase.from('captains').update({ remaining_budget: remaining }).eq('id', captain.id);
  await supabase.from('teams').update({ remaining_budget: remaining }).eq('captain_id', captain.id);
  await supabase.from('auction').update({ auction_status: 'Sold', updated_at: new Date().toISOString() }).eq('id', 1);
  return NextResponse.json({ ok: true });
}
