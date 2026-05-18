import { jsonError, pickRandomPlayer, requireAdminRequest, selectCurrentPlayer } from '@/lib/auction-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { response, supabase } = requireAdminRequest(request);
  if (response || !supabase) return response;
  const player = await pickRandomPlayer(supabase);
  if (!player) return jsonError('No approved unsold players are available.');
  return (await selectCurrentPlayer(supabase, player.id, true)).response;
}
