import { NextResponse } from 'next/server';

import { createAuctionEvent, requireAdminRequest } from '@/lib/auction-server';
import { getActiveSeason } from '@/lib/season-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function POST(request: Request) {
  const { response, supabase } = requireAdminRequest(request);

  if (response || !supabase) return response;

  const season = await getActiveSeason(supabase);

  if (!season) {
    return NextResponse.json({ ok: true, alreadyEnded: true, season: null }, { headers: NO_STORE_HEADERS });
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from('seasons')
    .update({ status: 'ended', ended_at: now })
    .eq('id', season.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE_HEADERS });
  }

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

  return NextResponse.json(
    { ok: true, alreadyEnded: false, season: { ...season, status: 'ended', ended_at: now } },
    { headers: NO_STORE_HEADERS },
  );
}
