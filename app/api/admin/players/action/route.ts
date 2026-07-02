import { NextResponse } from 'next/server';
import { createAuctionEvent, jsonError, requireAdminRequest } from '@/lib/auction-server';
import { isValidPhoneNumber, normalizePhoneNumber } from '@/lib/auction-utils';

export const runtime = 'nodejs';

type PlayerAction = 'approve' | 'reject' | 'update' | 'approve-update';

type PlayerActionBody = {
  action?: PlayerAction;
  player_id?: string;
  name?: string;
  phone?: string;
  role?: string;
  batting_style?: string;
  bowling_style?: string;
  base_price?: number | string | null;
};

const roles = ['Batter', 'Bowler', 'All-rounder', 'Wicketkeeper'];
const battingStyles = ['Right Hand', 'Left Hand'];
const bowlingStyles = ['Fast', 'Medium', 'Spin', 'None'];

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : undefined;
}

function cleanPrice(value: unknown) {
  if (value === null || value === undefined || value === '') return undefined;
  const price = Number(value);
  if (!Number.isFinite(price) || price < 0) return null;
  return Math.round(price);
}

export async function POST(request: Request) {
  const { response, supabase } = requireAdminRequest(request);
  if (response || !supabase) return response;

  const body = (await request.json().catch(() => ({}))) as PlayerActionBody;
  const action = body.action;
  const playerId = cleanText(body.player_id);

  if (!playerId) return jsonError('Player id is required.');
  if (!action || !['approve', 'reject', 'update', 'approve-update'].includes(action)) {
    return jsonError('Valid player action is required.');
  }

  const { data: existingPlayer, error: existingError } = await supabase
    .from('players')
    .select('*')
    .eq('id', playerId)
    .maybeSingle();

  if (existingError) return jsonError(existingError.message, 500);
  if (!existingPlayer) return jsonError('Player not found.', 404);

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  const shouldApplyEditableFields = action === 'update' || action === 'approve-update';
  if (shouldApplyEditableFields) {
    const name = cleanText(body.name);
    if (name !== undefined) {
      if (name.length < 2) return jsonError('Player name must be at least 2 characters.');
      updates.name = name;
    }

    const phone = cleanText(body.phone);
    if (phone !== undefined) {
      const normalizedPhone = normalizePhoneNumber(phone);
      if (!isValidPhoneNumber(normalizedPhone)) return jsonError('Enter a valid phone number.');
      updates.phone = normalizedPhone;
      updates.normalized_phone = normalizedPhone;
    }

    if (body.role !== undefined) {
      if (!roles.includes(String(body.role))) return jsonError('Invalid role.');
      updates.role = body.role;
    }

    if (body.batting_style !== undefined) {
      if (!battingStyles.includes(String(body.batting_style))) return jsonError('Invalid batting style.');
      updates.batting_style = body.batting_style;
    }

    if (body.bowling_style !== undefined) {
      if (!bowlingStyles.includes(String(body.bowling_style))) return jsonError('Invalid bowling style.');
      updates.bowling_style = body.bowling_style;
    }
  }

  const cleanedPrice = cleanPrice(body.base_price);
  if (cleanedPrice === null) return jsonError('Base price must be a valid number.');
  if (cleanedPrice !== undefined) updates.base_price = cleanedPrice;

  if (action === 'approve' || action === 'approve-update') {
    const finalBasePrice = Number(updates.base_price ?? existingPlayer.base_price ?? 100);
    if (!Number.isFinite(finalBasePrice) || finalBasePrice <= 0) {
      return jsonError('Base price must be more than 0 before approving.');
    }

    updates.approval_status = 'Approved';
    updates.status = 'Available';
    updates.auction_status = 'PENDING';
    updates.base_price = Math.round(finalBasePrice);
    updates.current_bid = 0;
    updates.sold_to_team = null;
    updates.sold_to_team_id = null;
    updates.sold_to_captain_id = null;
    updates.sold_price = null;
    updates.assigned_by_admin = false;
  }

  if (action === 'reject') {
    updates.approval_status = 'Rejected';
    updates.status = 'Available';
    updates.auction_status = 'PENDING';
    updates.current_bid = 0;
    updates.sold_to_team = null;
    updates.sold_to_team_id = null;
    updates.sold_to_captain_id = null;
    updates.sold_price = null;
    updates.assigned_by_admin = false;
  }

  const { data: player, error } = await supabase
    .from('players')
    .update(updates)
    .eq('id', playerId)
    .select('*')
    .single();

  if (error) return jsonError(error.message, 500);

  if (action === 'approve' || action === 'approve-update') {
    await createAuctionEvent(supabase, {
      event_type: 'STATUS',
      message: `Admin approved ${player.name} for auction at base price ${player.base_price || 0}.`,
      player_id: player.id,
      amount: Number(player.base_price || 0),
    });
  }

  if (action === 'reject') {
    await createAuctionEvent(supabase, {
      event_type: 'STATUS',
      message: `Admin rejected ${existingPlayer.name}'s registration.`,
      player_id: existingPlayer.id,
    });
  }

  return NextResponse.json({ ok: true, player });
}
