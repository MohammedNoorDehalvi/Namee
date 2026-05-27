import { NextResponse } from 'next/server';
import { requireAdminRequest, createAuctionEvent } from '@/lib/auction-server';
import { getActiveSeason } from '@/lib/season-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { response, supabase } = requireAdminRequest(request);
  if (response || !supabase) return response;

  const season = await getActiveSeason(supabase);

  if (!season) return NextResponse.json({ error: 'No active season to end.' }, { status: 400 });

  const now = new Date().toISOString();

  const { error } = await supabase
    .from('seasons')
    .update({ status: 'ended', ended_at: now })
    .eq('id', season.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase
    .from('auction')
    .update({
      auction_status: 'ENDED',
      current_player_id: null,
      highest_bid: 0,
      highest_bidder_id: null,
      highest_bidder_team_id: null,
      highest_bidder_captain_name: null,
      highest_team_name: null,
      bid_processing: false,
      bid_lock_started_at: null,
      bid_lock_player_id: null,
      ended_at: now,
      updated_at: now,
    })
    .eq('id', 1);

  await createAuctionEvent(supabase, {
    season_id: season.id,
    event_type: 'SEASON',
    message: `${season.name} ended. Old data is saved read-only.`,
  }).catch(() => undefined);

  return NextResponse.json({ ok: true, season: { ...season, status: 'ended', ended_at: now } });
}
