import { NextResponse } from 'next/server';
import { createAuctionEvent, jsonError, requireAdminRequest } from '@/lib/auction-server';
import type { Auction, Player, Team } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { response, supabase } = requireAdminRequest(request);
  if (response || !supabase) return response;

  const { data: history } = await supabase
    .from('auction_action_history')
    .select('*')
    .in('action_type', ['sold', 'unsold', 'manual_assign', 'remove_player', 'edit_price'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!history) return jsonError('No admin action to undo.');

  const previousPlayer = history.previous_player as Player | null;
  const previousAuction = history.previous_auction as Auction | null;
  const previousTeam = history.previous_team as Team | null;

  if (previousPlayer?.id) {
    await supabase.from('players').update({
      name: previousPlayer.name,
      phone: previousPlayer.phone,
      normalized_phone: previousPlayer.normalized_phone || null,
      role: previousPlayer.role,
      batting_style: previousPlayer.batting_style,
      bowling_style: previousPlayer.bowling_style,
      base_price: previousPlayer.base_price,
      photo_url: previousPlayer.photo_url,
      status: previousPlayer.status,
      auction_status: previousPlayer.auction_status || 'PENDING',
      approval_status: previousPlayer.approval_status,
      current_bid: previousPlayer.current_bid,
      sold_to_team: previousPlayer.sold_to_team,
      sold_to_team_id: previousPlayer.sold_to_team_id || null,
      sold_to_captain_id: previousPlayer.sold_to_captain_id,
      sold_price: previousPlayer.sold_price,
      assigned_by_admin: previousPlayer.assigned_by_admin || false,
    }).eq('id', previousPlayer.id);
  }

  if (previousTeam?.id) {
    await Promise.all([
      supabase.from('teams').update({ remaining_budget: previousTeam.remaining_budget }).eq('id', previousTeam.id),
      supabase.from('captains').update({ remaining_budget: previousTeam.remaining_budget }).eq('id', previousTeam.captain_id),
    ]);
  }

  if (previousAuction?.id) {
    await supabase.from('auction').update({
      current_player_id: previousAuction.current_player_id,
      auction_status: previousAuction.auction_status,
      highest_bid: previousAuction.highest_bid,
      highest_bidder_id: previousAuction.highest_bidder_id,
      highest_bidder_team_id: previousAuction.highest_bidder_team_id || null,
      highest_bidder_captain_name: previousAuction.highest_bidder_captain_name || null,
      highest_team_name: previousAuction.highest_team_name,
      manual_picker_hidden: previousAuction.manual_picker_hidden || false,
      updated_at: new Date().toISOString(),
    }).eq('id', 1);
  }

  await supabase.from('auction_action_history').delete().eq('id', history.id);
  await createAuctionEvent(supabase, { event_type: 'UNDO', message: 'Admin undid the last auction decision.' });
  return NextResponse.json({ ok: true });
}
