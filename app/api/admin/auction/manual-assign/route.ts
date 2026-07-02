import { NextResponse } from 'next/server';
import { createAuctionEvent, getBoughtCount, jsonError, requireAdminRequest, saveAdminHistory } from '@/lib/auction-server';
import type { Player, Team } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { response, supabase } = requireAdminRequest(request);
  if (response || !supabase) return response;

  const { player_id, team_id, price } = await request.json().catch(() => ({})) as { player_id?: string; team_id?: string; price?: number };
  if (!player_id || !team_id) return jsonError('Player and team are required.');

  const [{ data: player }, { data: team }] = await Promise.all([
    supabase.from('players').select('*').eq('id', player_id).maybeSingle(),
    supabase.from('teams').select('*').eq('id', team_id).maybeSingle(),
  ]);
  if (!player) return jsonError('Player not found.', 404);
  if (!team) return jsonError('Team not found.', 404);

  const safePlayer = player as Player;
  const safeTeam = team as Team;
  const assignPrice = Math.max(0, Number(price ?? safePlayer.base_price ?? 0));
  const boughtCount = await getBoughtCount(supabase, safeTeam);
  const allowedByBudgetEndRule = safeTeam.remaining_budget <= 0 && boughtCount === 3;
  if (boughtCount >= (safeTeam.max_players || 4)) return jsonError('Team is already full.');
  if (!allowedByBudgetEndRule && assignPrice > safeTeam.remaining_budget) return jsonError('Team budget is not enough for this manual assignment.');

  await saveAdminHistory(supabase, { action_type: 'manual_assign', player: safePlayer, team: safeTeam, message: `Admin assigned ${safePlayer.name} to ${safeTeam.team_name}.` });

  const remaining = Math.max(0, Number(safeTeam.remaining_budget || 0) - assignPrice);
  await supabase.from('players').update({
    status: 'Sold',
    auction_status: 'SOLD',
    sold_to_team: safeTeam.team_name,
    sold_to_team_id: safeTeam.id,
    sold_to_captain_id: safeTeam.captain_id,
    sold_price: assignPrice,
    current_bid: assignPrice,
    assigned_by_admin: true,
  }).eq('id', safePlayer.id);

  await Promise.all([
    supabase.from('teams').update({ remaining_budget: remaining }).eq('id', safeTeam.id),
    supabase.from('captains').update({ remaining_budget: remaining }).eq('id', safeTeam.captain_id),
  ]);

  await createAuctionEvent(supabase, {
    event_type: 'ADMIN_ASSIGNED',
    message: `Team ${safeTeam.team_name} budget ended. Admin assigned ${safePlayer.name} to this team.`,
    player_id: safePlayer.id,
    team_id: safeTeam.id,
    captain_id: safeTeam.captain_id,
    amount: assignPrice,
  });

  return NextResponse.json({ ok: true });
}
