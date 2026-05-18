import { NextResponse } from 'next/server';
import { computeNextBidState, createAuctionEvent, jsonError, requireCaptainRequest } from '@/lib/auction-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { response, session, supabase } = requireCaptainRequest(request);
  if (response || !session || !supabase) return response;

  const { player_id } = await request.json().catch(() => ({})) as { player_id?: string };
  const state = await computeNextBidState(supabase, session, player_id || null);
  if ('error' in state) return jsonError(state.error || 'Bid failed.');

  const { auction, captain, team, player, nextAmount } = state;

  const { error: bidError } = await supabase.from('bids').insert({
    player_id: player.id,
    captain_id: captain.id,
    captain_name: captain.captain_name,
    team_id: team.id,
    team_name: team.team_name,
    bid_amount: nextAmount,
  });
  if (bidError) return jsonError(bidError.message, 500);

  await Promise.all([
    supabase.from('players').update({ current_bid: nextAmount }).eq('id', player.id),
    supabase.from('auction').update({
      highest_bid: nextAmount,
      highest_bidder_id: captain.id,
      highest_bidder_team_id: team.id,
      highest_bidder_captain_name: captain.captain_name,
      highest_team_name: team.team_name,
      updated_at: new Date().toISOString(),
    }).eq('id', auction.id),
  ]);

  await createAuctionEvent(supabase, {
    event_type: 'BID',
    message: `${team.team_name} / ${captain.captain_name} bid ${nextAmount} for ${player.name}.`,
    player_id: player.id,
    team_id: team.id,
    captain_id: captain.id,
    amount: nextAmount,
  });

  return NextResponse.json({ ok: true, bid_amount: nextAmount });
}
