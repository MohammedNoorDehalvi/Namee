import { NextResponse } from 'next/server';
import { createAuctionEvent, getAuction, getCurrentPlayer, jsonError, requireAdminRequest, saveAdminHistory } from '@/lib/auction-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { response, supabase } = requireAdminRequest(request);
  if (response || !supabase) return response;

  const auction = await getAuction(supabase);
  const player = await getCurrentPlayer(supabase, auction);
  if (!auction || !player) return jsonError('No current player selected.');
  if (auction.highest_bidder_id) return jsonError('Someone already bid. You cannot mark this player unsold.');

  await saveAdminHistory(supabase, { action_type: 'unsold', player, auction, message: `${player.name} marked unsold.` });
  await supabase.from('players').update({ status: 'Unsold', auction_status: 'UNSOLD', current_bid: Number(player.base_price || 0) }).eq('id', player.id);
  await supabase.from('auction').update({ current_player_id: null, highest_bid: 0, highest_bidder_id: null, highest_bidder_team_id: null, highest_bidder_captain_name: null, highest_team_name: null, updated_at: new Date().toISOString() }).eq('id', 1);
  await createAuctionEvent(supabase, { event_type: 'UNSOLD', message: `${player.name} went unsold.`, player_id: player.id });
  return NextResponse.json({ ok: true });
}
