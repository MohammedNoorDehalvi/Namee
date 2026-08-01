import { requireAdminRequest, selectCurrentPlayer } from '@/lib/auction-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { response, supabase } = requireAdminRequest(request);
  if (response || !supabase) return response;
  const { player_id } = await request.json().catch(() => ({ player_id: '' })) as { player_id: string };
  return (await selectCurrentPlayer(supabase, player_id, true)).response;
}
