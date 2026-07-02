import { randomInt } from 'crypto';

import { jsonError, requireAdminRequest, selectCurrentPlayer } from '@/lib/auction-server';
import { getActiveSeason } from '@/lib/season-server';
import type { Player } from '@/lib/types';

export const runtime = 'nodejs';

function pickRandomPlayer(players: Player[]) {
  if (players.length === 0) return null;
  return players[randomInt(players.length)] ?? null;
}

export async function POST(request: Request) {
  const { response, supabase } = requireAdminRequest(request);
  if (response || !supabase) return response;

  const season = await getActiveSeason(supabase);
  if (!season) {
    return jsonError('No current season going. Start a season first.');
  }

  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('season_id', season.id)
    .eq('approval_status', 'Approved')
    .eq('status', 'Available')
    .eq('auction_status', 'PENDING');

  if (error) {
    return jsonError(error.message, 500);
  }

  const players = (data || []) as Player[];
  if (players.length === 0) {
    return jsonError('No approved unsold players are available.');
  }

  const player = pickRandomPlayer(players);
  if (!player) {
    return jsonError('No approved unsold players are available.');
  }

  return (await selectCurrentPlayer(supabase, player.id, true)).response;
}
