import { NextResponse } from 'next/server';
import { createAuctionEvent, getAuction, getCurrentPlayer, getTeamForCaptain, jsonError, requireAdminRequest, saveAdminHistory } from '@/lib/auction-server';
import { getBoughtCount } from '@/lib/auction-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { response, supabase } = requireAdminRequest(request);
  if (response || !supabase) return response;

  const auction = await getAuction(supabase);
  const player = await getCurrentPlayer(supabase, auction);
  if (!auction || !player) return jsonError('No current player selected.');
  if (!auction.highest_bidder_id || !auction.highest_team_name) return jsonError('No captain has bid yet.');

  const team = await getTeamForCaptain(supabase, auction.highest_bidder_id);
  if (!team) return jsonError('Highest bidder team not found.');
  const boughtCount = await getBoughtCount(supabase, team);
  if (boughtCount >= (team.max_players || 4)) return jsonError('This team is already full.');

  const soldPrice = Math.max(Number(auction.highest_bid || 0), Number(player.base_price || 0));
  if (soldPrice > team.remaining_budget) return jsonError('Team budget is not enough.');

  await saveAdminHistory(supabase, { action_type: 'sold', player, auction, team, message: `${player.name} sold to ${team.team_name}.` });

  const remaining = Number(team.remaining_budget) - soldPrice;
  await supabase.from('players').update({
    status: 'Sold',
    auction_status: 'SOLD',
    sold_to_team: team.team_name,
    sold_to_team_id: team.id,
    sold_to_captain_id: auction.highest_bidder_id,
    sold_price: soldPrice,
    current_bid: soldPrice,
  }).eq('id', player.id);

  await Promise.all([
    supabase.from('teams').update({ remaining_budget: remaining }).eq('id', team.id),
    supabase.from('captains').update({ remaining_budget: remaining }).eq('id', auction.highest_bidder_id),
  ]);

  await supabase.from('auction').update({
    current_player_id: null,
    highest_bid: 0,
    highest_bidder_id: null,
    highest_bidder_team_id: null,
    highest_bidder_captain_name: null,
    highest_team_name: null,
    updated_at: new Date().toISOString(),
  }).eq('id', 1);

  await createAuctionEvent(supabase, { event_type: 'SOLD', message: `${player.name} sold to ${team.team_name} for ${soldPrice} points.`, player_id: player.id, team_id: team.id, captain_id: auction.highest_bidder_id, amount: soldPrice });

  const newCount = boughtCount + 1;
  if (newCount >= (team.max_players || 4)) {
    await createAuctionEvent(supabase, { event_type: 'TEAM_FULL', message: `Team ${team.team_name} is full with ${newCount} players.`, team_id: team.id });
  }

  return NextResponse.json({ ok: true });
}
