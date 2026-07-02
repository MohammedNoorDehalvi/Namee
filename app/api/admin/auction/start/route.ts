import { NextResponse } from 'next/server';
import { requireAdminRequest, selectCurrentPlayer, validateAuctionStart, jsonError } from '@/lib/auction-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { response, supabase } = requireAdminRequest(request);
  if (response || !supabase) return response;

  const body = await request.json().catch(() => ({})) as { player_id?: string };
  const warning = await validateAuctionStart(supabase);
  if (warning) return jsonError(warning);

  await supabase.from('auction').update({ auction_status: 'LIVE', started_at: new Date().toISOString(), ended_at: null, updated_at: new Date().toISOString() }).eq('id', 1);
  if (body.player_id) return (await selectCurrentPlayer(supabase, body.player_id, true)).response;
  return NextResponse.json({ ok: true });
}
