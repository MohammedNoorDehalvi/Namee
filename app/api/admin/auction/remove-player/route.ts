import { NextResponse } from 'next/server';
import { createAuctionEvent, jsonError, requireAdminRequest, saveAdminHistory } from '@/lib/auction-server';
import type { Player, Team } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { response, supabase } = requireAdminRequest(request);
  if (response || !supabase) return response;

  const { player_id } = await request.json().catch(() => ({})) as { player_id?: string };
  if (!player_id) return jsonError('Player is required.');

  const { data: player } = await supabase.from('players').select('*').eq('id', player_id).maybeSingle();
  if (!player) return jsonError('Player not found.', 404);
  const safePlayer = player as Player;
  const { data: team } = safePlayer.sold_to_team_id
    ? await supabase.from('teams').select('*').eq('id', safePlayer.sold_to_team_id).maybeSingle()
    : await supabase.from('teams').select('*').eq('team_name', safePlayer.sold_to_team || '').maybeSingle();

  await saveAdminHistory(supabase, { action_type: 'remove_player', player: safePlayer, team: (team || null) as Team | null, message: `Admin removed ${safePlayer.name} from team.` });

  if (team && safePlayer.sold_price) {
    const safeTeam = team as Team;
    const restored = Number(safeTeam.remaining_budget || 0) + Number(safePlayer.sold_price || 0);
    await Promise.all([
      supabase.from('teams').update({ remaining_budget: restored }).eq('id', safeTeam.id),
      supabase.from('captains').update({ remaining_budget: restored }).eq('id', safeTeam.captain_id),
    ]);
  }

  await supabase.from('players').update({
    status: 'Available',
    auction_status: 'PENDING',
    sold_to_team: null,
    sold_to_team_id: null,
    sold_to_captain_id: null,
    sold_price: null,
    current_bid: 0,
    assigned_by_admin: false,
  }).eq('id', safePlayer.id);

  await createAuctionEvent(supabase, { event_type: 'STATUS', message: `Admin removed ${safePlayer.name} from team and returned player to auction pool.`, player_id: safePlayer.id });
  return NextResponse.json({ ok: true });
}
