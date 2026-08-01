import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createAuctionEvent, requireAdminRequest } from '@/lib/auction-server';
import { getActiveSeason, seasonName } from '@/lib/season-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

const schema = z.object({
  season_number: z.coerce.number().int().min(1).max(100),
});

export async function POST(request: Request) {
  const { response, supabase } = requireAdminRequest(request);

  if (response || !supabase) return response;

  const parsed = schema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a valid season number.' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const active = await getActiveSeason(supabase);

  if (active) {
    return NextResponse.json(
      { error: `${active.name} is still active. End it before starting a new season.` },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const name = seasonName(parsed.data.season_number);

  const { data: existingEndedSeason } = await supabase
    .from('seasons')
    .select('*')
    .eq('season_number', parsed.data.season_number)
    .maybeSingle();

  if (existingEndedSeason?.status === 'ended') {
    return NextResponse.json(
      { error: `${name} already exists as an old season. Use a new season number.` },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const { data: season, error } = await supabase
    .from('seasons')
    .insert({
      season_number: parsed.data.season_number,
      name,
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE_HEADERS });
  }

  await supabase.from('auction').upsert(
    {
      id: 1,
      season_id: season.id,
      auction_status: 'NOT_STARTED',
      current_player_id: null,
      highest_bid: 0,
      highest_bidder_id: null,
      highest_bidder_team_id: null,
      highest_bidder_captain_name: null,
      highest_team_name: null,
      manual_picker_hidden: false,
      bid_processing: false,
      bid_lock_started_at: null,
      bid_lock_player_id: null,
      started_at: null,
      ended_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );

  await createAuctionEvent(supabase, {
    season_id: season.id,
    event_type: 'SEASON',
    message: `${name} started. Add or import teams, captains, and players.`,
  }).catch(() => undefined);

  return NextResponse.json({ ok: true, season }, { headers: NO_STORE_HEADERS });
}
