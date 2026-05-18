import { NextResponse } from 'next/server';
import { createAuctionEvent, jsonError, requireAdminRequest, saveAdminHistory } from '@/lib/auction-server';
import type { Player, Team } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { response, supabase } = requireAdminRequest(request);
  if (response || !supabase) return response;

  const { player_id, price } = await request.json().catch(() => ({})) as { player_id?: string; price?: number };
  const newPrice = Number(price);
  if (!player_id || Number.isNaN(newPrice) || newPrice < 0) return jsonError('Player and valid price are required.');

  const { data: player } = await supabase.from('players').select('*').eq('id', player_id).maybeSingle();
  if (!player) return jsonError('Player not found.', 404);
  const safePlayer = player as Player;
  if (safePlayer.auction_status !== 'SOLD') return jsonError('Only sold players can have sold price edited.');

  const { data: team } = safePlayer.sold_to_team_id
    ? await supabase.from('teams').select('*').eq('id', safePlayer.sold_to_team_id).maybeSingle()
    : await supabase.from('teams').select('*').eq('team_name', safePlayer.sold_to_team || '').maybeSingle();

  await saveAdminHistory(supabase, { action_type: 'edit_price', player: safePlayer, team: (team || null) as Team | null, message: `Admin edited ${safePlayer.name} sold price.` });

  if (team) {
    const safeTeam = team as Team;
    const difference = newPrice - Number(safePlayer.sold_price || 0);
    const remaining = Math.max(0, Number(safeTeam.remaining_budget || 0) - difference);
    await Promise.all([
      supabase.from('teams').update({ remaining_budget: remaining }).eq('id', safeTeam.id),
      supabase.from('captains').update({ remaining_budget: remaining }).eq('id', safeTeam.captain_id),
    ]);
  }

  await supabase.from('players').update({ sold_price: newPrice, current_bid: newPrice }).eq('id', safePlayer.id);
  await createAuctionEvent(supabase, { event_type: 'STATUS', message: `Admin edited ${safePlayer.name} sold price to ${newPrice}.`, player_id: safePlayer.id, amount: newPrice });
  return NextResponse.json({ ok: true });
}
