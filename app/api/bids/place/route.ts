import { NextResponse } from 'next/server';
import { requireCaptainRequest, computeNextBidState, createAuctionEvent } from '@/lib/auction-server';
import { releaseBidLock } from '@/lib/season-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { response, session, supabase } = requireCaptainRequest(request);
  if (response || !session || !supabase) return response;

  const { player_id } = await request.json().catch(() => ({}));

  if (!player_id) return NextResponse.json({ error: 'Player is required.' }, { status: 400 });

  const lock = await supabase.rpc('acquire_auction_bid_lock', {
    p_player_id: player_id,
    p_captain_id: session.id,
  });

  if (lock.error) {
    return NextResponse.json({ error: `Bid lock setup missing: ${lock.error.message}` }, { status: 500 });
  }

  if (!lock.data) {
    return NextResponse.json({ error: 'Another bid is processing. Try again in a second.' }, { status: 409 });
  }

  try {
    const state = await computeNextBidState(supabase, session, player_id);

    if ('error' in state) {
      await releaseBidLock(supabase);
      return NextResponse.json({ error: state.error }, { status: 400 });
    }

    const bidAmount = state.nextAmount;

    const { error: bidError } = await supabase.from('bids').insert({
      season_id: state.season.id,
      player_id: state.player.id,
      captain_id: state.captain.id,
      captain_name: state.captain.captain_name,
      team_id: state.team.id,
      team_name: state.team.team_name,
      bid_amount: bidAmount,
    });

    if (bidError) {
      await releaseBidLock(supabase);
      return NextResponse.json({ error: bidError.message }, { status: 500 });
    }

    await supabase
      .from('players')
      .update({ current_bid: bidAmount, updated_at: new Date().toISOString() })
      .eq('id', state.player.id);

    await supabase
      .from('auction')
      .update({
        highest_bid: bidAmount,
        highest_bidder_id: state.captain.id,
        highest_bidder_team_id: state.team.id,
        highest_bidder_captain_name: state.captain.captain_name,
        highest_team_name: state.team.team_name,
        bid_processing: false,
        bid_lock_started_at: null,
        bid_lock_player_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    await createAuctionEvent(supabase, {
      season_id: state.season.id,
      event_type: 'BID',
      message: `${state.team.team_name} / ${state.captain.captain_name} bid ${bidAmount} for ${state.player.name}.`,
      player_id: state.player.id,
      team_id: state.team.id,
      captain_id: state.captain.id,
      amount: bidAmount,
    }).catch(() => undefined);

    return NextResponse.json({ ok: true, bid_amount: bidAmount });
  } catch (error) {
    await releaseBidLock(supabase);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Bid failed, try again.' }, { status: 500 });
  }
}
