import { NextResponse } from 'next/server';
import {
  createAuctionEvent,
  getAuction,
  getBoughtCount,
  getCurrentPlayer,
  getTeamForCaptain,
  jsonError,
  requireAdminRequest,
  saveAdminHistory,
} from '@/lib/auction-server';
import { isBidLockStale, releaseBidLock } from '@/lib/season-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { response, supabase } = requireAdminRequest(request);
  if (response || !supabase) return response;

  let auction = await getAuction(supabase);
  const player = await getCurrentPlayer(supabase, auction);

  if (!auction || !player) return jsonError('No current player selected.');

  if (auction.bid_processing && !isBidLockStale(auction.bid_lock_started_at)) {
    return jsonError('A captain is bidding, please wait...', 409);
  }

  if (auction.bid_processing && isBidLockStale(auction.bid_lock_started_at)) {
    await releaseBidLock(supabase);
    auction = await getAuction(supabase);
  }

  const { data: latestBids, error: bidError } = await supabase
    .from('bids')
    .select('*')
    .eq('player_id', player.id)
    .order('bid_amount', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1);

  if (bidError) return jsonError(bidError.message, 500);

  const latestBid = latestBids?.[0];

  if (!latestBid?.captain_id) return jsonError('No confirmed captain has bid yet.');

  if (
    latestBid.captain_id !== auction?.highest_bidder_id ||
    Number(latestBid.bid_amount || 0) !== Number(auction?.highest_bid || 0)
  ) {
    await supabase
      .from('auction')
      .update({
        highest_bid: Number(latestBid.bid_amount || 0),
        highest_bidder_id: latestBid.captain_id,
        highest_bidder_team_id: latestBid.team_id || null,
        highest_bidder_captain_name: latestBid.captain_name || null,
        highest_team_name: latestBid.team_name || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    auction = await getAuction(supabase);
  }

  if (!auction?.highest_bidder_id || !auction.highest_team_name) return jsonError('No captain has bid yet.');

  const team = await getTeamForCaptain(supabase, auction.highest_bidder_id);
  if (!team) return jsonError('Highest bidder team not found.');

  const boughtCount = await getBoughtCount(supabase, team);
  if (boughtCount >= (team.max_players || 4)) return jsonError('This team is already full.');

  const soldPrice = Math.max(Number(auction.highest_bid || 0), Number(player.base_price || 0));
  if (soldPrice > team.remaining_budget) return jsonError('Team budget is not enough.');

  await saveAdminHistory(supabase, {
    season_id: auction.season_id || player.season_id || null,
    action_type: 'sold',
    player,
    auction,
    team,
    message: `${player.name} sold to ${team.team_name}.`,
  });

  const remaining = Number(team.remaining_budget) - soldPrice;

  await supabase
    .from('players')
    .update({
      status: 'Sold',
      auction_status: 'SOLD',
      sold_to_team: team.team_name,
      sold_to_team_id: team.id,
      sold_to_captain_id: auction.highest_bidder_id,
      sold_price: soldPrice,
      current_bid: soldPrice,
      updated_at: new Date().toISOString(),
    })
    .eq('id', player.id);

  await Promise.all([
    supabase.from('teams').update({ remaining_budget: remaining, updated_at: new Date().toISOString() }).eq('id', team.id),
    supabase.from('captains').update({ remaining_budget: remaining }).eq('id', auction.highest_bidder_id),
  ]);

  await supabase
    .from('auction')
    .update({
      current_player_id: null,
      highest_bid: 0,
      highest_bidder_id: null,
      highest_bidder_team_id: null,
      highest_bidder_captain_name: null,
      highest_team_name: null,
      bid_processing: false,
      bid_lock_started_at: null,
      bid_lock_player_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);

  await createAuctionEvent(supabase, {
    season_id: auction.season_id || player.season_id || null,
    event_type: 'SOLD',
    message: `${player.name} sold to ${team.team_name} for ${soldPrice} points.`,
    player_id: player.id,
    team_id: team.id,
    captain_id: auction.highest_bidder_id,
    amount: soldPrice,
  });

  const newCount = boughtCount + 1;
  if (newCount >= (team.max_players || 4)) {
    await createAuctionEvent(supabase, {
      season_id: auction.season_id || player.season_id || null,
      event_type: 'TEAM_FULL',
      message: `Team ${team.team_name} is full with ${newCount} players.`,
      team_id: team.id,
    });
  }

  return NextResponse.json({ ok: true });
}
