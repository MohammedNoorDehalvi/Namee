import { NextResponse } from 'next/server';

import { createAuctionEvent, requireAdminRequest } from '@/lib/auction-server';
import { freezeSeasonAuctionResults, getActiveSeason } from '@/lib/season-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

/**
 * End the active season and FREEZE sold/unsold results so they stay in the
 * players table forever for archive (season_id + sold_to_team_id + price).
 * Never clears sold data when starting the next season later.
 */
export async function POST(request: Request) {
  const { response, supabase } = requireAdminRequest(request);

  if (response || !supabase) return response;

  const season = await getActiveSeason(supabase);

  if (!season) {
    return NextResponse.json({ ok: true, alreadyEnded: true, season: null }, { headers: NO_STORE_HEADERS });
  }

  const now = new Date().toISOString();

  // 1) Freeze sold / unsold for THIS season before marking ended
  try {
    await freezeSeasonAuctionResults(supabase, season.id);
  } catch (e) {
    console.error('[seasons/end] freeze failed', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not freeze season results.' },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }

  // 2) Mark season ended (read-only archive)
  const { error } = await supabase
    .from('seasons')
    .update({ status: 'ended', ended_at: now })
    .eq('id', season.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE_HEADERS });
  }

  // 3) Clear live auction board only (single row) — does NOT touch players sold fields
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
    message: `${season.name} ended. Sold/unsold results frozen for archive.`,
  }).catch(() => undefined);

  return NextResponse.json(
    { ok: true, alreadyEnded: false, season: { ...season, status: 'ended', ended_at: now }, frozen: true },
    { headers: NO_STORE_HEADERS },
  );
}
