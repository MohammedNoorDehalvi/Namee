import { NextResponse } from 'next/server';
import { createAuctionEvent, getAuction, jsonError, requireAdminRequest, saveAdminHistory, validateAuctionStart } from '@/lib/auction-server';

export const runtime = 'nodejs';

type Action = 'start' | 'pause' | 'resume' | 'end' | 'reset';

export async function POST(request: Request) {
  const { response, supabase } = requireAdminRequest(request);
  if (response || !supabase) return response;

  const { action } = await request.json().catch(() => ({ action: '' })) as { action: Action };
  const auction = await getAuction(supabase);

  if (action === 'start') {
    const warning = await validateAuctionStart(supabase);
    if (warning) return jsonError(warning);
    await saveAdminHistory(supabase, { action_type: 'start_auction', auction, message: 'Auction started.' });
    await supabase.from('auction').update({ auction_status: 'LIVE', started_at: new Date().toISOString(), ended_at: null, updated_at: new Date().toISOString() }).eq('id', 1);
    await createAuctionEvent(supabase, { event_type: 'STATUS', message: 'APL auction is now LIVE.' });
    return NextResponse.json({ ok: true });
  }

  if (action === 'pause') {
    await saveAdminHistory(supabase, { action_type: 'pause_auction', auction, message: 'Auction paused.' });
    await supabase.from('auction').update({ auction_status: 'PAUSED', updated_at: new Date().toISOString() }).eq('id', 1);
    await createAuctionEvent(supabase, { event_type: 'STATUS', message: 'Auction paused by admin.' });
    return NextResponse.json({ ok: true });
  }

  if (action === 'resume') {
    await saveAdminHistory(supabase, { action_type: 'resume_auction', auction, message: 'Auction resumed.' });
    await supabase.from('auction').update({ auction_status: 'LIVE', updated_at: new Date().toISOString() }).eq('id', 1);
    await createAuctionEvent(supabase, { event_type: 'STATUS', message: 'Auction resumed by admin.' });
    return NextResponse.json({ ok: true });
  }

  if (action === 'end') {
    await saveAdminHistory(supabase, { action_type: 'end_auction', auction, message: 'Auction ended.' });
    await supabase.from('auction').update({ auction_status: 'ENDED', current_player_id: null, highest_bid: 0, highest_bidder_id: null, highest_bidder_team_id: null, highest_bidder_captain_name: null, highest_team_name: null, ended_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', 1);
    await supabase.from('players').update({ auction_status: 'PENDING' }).eq('auction_status', 'CURRENT');
    await createAuctionEvent(supabase, { event_type: 'STATUS', message: 'Auction ended. Final reports are ready.' });
    return NextResponse.json({ ok: true });
  }

  if (action === 'reset') {
    await saveAdminHistory(supabase, { action_type: 'reset_auction', auction, message: 'Auction reset.' });
    await supabase.from('bids').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('auction_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('players').update({ status: 'Available', auction_status: 'PENDING', current_bid: 0, sold_to_team: null, sold_to_team_id: null, sold_to_captain_id: null, sold_price: null, assigned_by_admin: false }).eq('approval_status', 'Approved');
    const { data: captains } = await supabase.from('captains').select('id,budget');
    await Promise.all((captains || []).map((captain) => supabase.from('captains').update({ remaining_budget: captain.budget }).eq('id', captain.id)));
    const { data: teams } = await supabase.from('teams').select('id,budget');
    await Promise.all((teams || []).map((team) => supabase.from('teams').update({ remaining_budget: team.budget }).eq('id', team.id)));
    await supabase.from('auction').update({ auction_status: 'NOT_STARTED', current_player_id: null, highest_bid: 0, highest_bidder_id: null, highest_bidder_team_id: null, highest_bidder_captain_name: null, highest_team_name: null, manual_picker_hidden: false, started_at: null, ended_at: null, updated_at: new Date().toISOString() }).eq('id', 1);
    await createAuctionEvent(supabase, { event_type: 'RESET', message: 'Auction reset by admin.' });
    return NextResponse.json({ ok: true });
  }

  return jsonError('Unknown auction status action.');
}
