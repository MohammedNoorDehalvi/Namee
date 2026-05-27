import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireRole, type TokenPayload } from '@/lib/auth/session';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { MAX_BOUGHT_PLAYERS_PER_TEAM } from '@/lib/constants';
import { nextBidAmount, normalizePhoneNumber } from '@/lib/auction-utils';
import type { Auction, Captain, Player, Season, Team } from '@/lib/types';
import { getActiveSeason } from '@/lib/season-server';

export const AUCTION_ID = 1;

type JsonValue = Record<string, unknown> | unknown[] | string | number | boolean | null;

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function requireAdminRequest(request: Request) {
  const session = requireRole(request, 'admin');

  if (!session) {
    return { response: jsonError('Admin access required.', 401), session: null, supabase: null };
  }

  return { response: null, session, supabase: createSupabaseAdmin() };
}

export function requireCaptainRequest(request: Request) {
  const session = requireRole(request, 'captain');

  if (!session) {
    return { response: jsonError('Captain login required.', 401), session: null, supabase: null };
  }

  return { response: null, session, supabase: createSupabaseAdmin() };
}

export async function createAuctionEvent(
  supabase: SupabaseClient,
  input: {
    event_type: string;
    message: string;
    player_id?: string | null;
    team_id?: string | null;
    captain_id?: string | null;
    amount?: number | null;
    metadata?: JsonValue;
    season_id?: string | null;
  },
) {
  const activeSeason = input.season_id ? null : await getActiveSeason(supabase).catch(() => null);

  await supabase.from('auction_events').insert({
    season_id: input.season_id || activeSeason?.id || null,
    event_type: input.event_type,
    message: input.message,
    player_id: input.player_id || null,
    team_id: input.team_id || null,
    captain_id: input.captain_id || null,
    amount: input.amount ?? null,
    metadata: input.metadata || {},
  });
}

export async function saveAdminHistory(
  supabase: SupabaseClient,
  input: {
    action_type: string;
    player?: Player | null;
    auction?: Auction | null;
    team?: Team | null;
    message?: string | null;
    season_id?: string | null;
  },
) {
  const activeSeason = input.season_id ? null : await getActiveSeason(supabase).catch(() => null);

  await supabase.from('auction_action_history').insert({
    season_id: input.season_id || activeSeason?.id || null,
    action_type: input.action_type,
    player_id: input.player?.id || null,
    previous_player: input.player || null,
    previous_auction: input.auction || null,
    previous_team: input.team || null,
    event_message: input.message || null,
  });
}

export async function getAuction(supabase: SupabaseClient) {
  const { data, error } = await supabase.from('auction').select('*').eq('id', AUCTION_ID).maybeSingle();

  if (error) throw error;

  return data as Auction | null;
}

export async function getCurrentPlayer(supabase: SupabaseClient, auction: Auction | null) {
  if (!auction?.current_player_id) return null;

  const { data, error } = await supabase.from('players').select('*').eq('id', auction.current_player_id).maybeSingle();

  if (error) throw error;

  return data as Player | null;
}

export async function getTeamForCaptain(supabase: SupabaseClient, captainId: string) {
  const activeSeason = await getActiveSeason(supabase);
  let query = supabase.from('teams').select('*').eq('captain_id', captainId);

  if (activeSeason?.id) query = query.eq('season_id', activeSeason.id);

  const { data, error } = await query.maybeSingle();

  if (error) throw error;

  return data as Team | null;
}

export async function getBoughtCount(supabase: SupabaseClient, team: Team) {
  let query = supabase
    .from('players')
    .select('id', { count: 'exact', head: true })
    .eq('auction_status', 'SOLD')
    .or(`sold_to_team_id.eq.${team.id},sold_to_team.eq.${team.team_name}`);

  if (team.season_id) query = query.eq('season_id', team.season_id);

  const { count, error } = await query;

  if (error) throw error;

  return count || 0;
}

export async function validateAuctionStart(supabase: SupabaseClient) {
  const season = await getActiveSeason(supabase);

  if (!season) return 'No current season going. Start a new season first.';

  const [{ data: teams }, { data: captains }, { data: players }] = await Promise.all([
    supabase.from('teams').select('*').eq('season_id', season.id),
    supabase.from('captains').select('id,captain_name,team_name,season_id').eq('season_id', season.id),
    supabase
      .from('players')
      .select('id')
      .eq('season_id', season.id)
      .eq('approval_status', 'Approved')
      .eq('auction_status', 'PENDING'),
  ]);

  const safeTeams = (teams || []) as Team[];
  const safeCaptains = (captains || []) as Captain[];
  const safePlayers = (players || []) as Pick<Player, 'id'>[];
  const teamsWithOneCaptain = safeTeams.filter((team) => Boolean(team.captain_id));

  if (safeTeams.length < 4 || safeCaptains.length < 4 || teamsWithOneCaptain.length < 4) {
    return 'Need at least 4 teams and 4 captains before starting auction.';
  }

  if (safeTeams.some((team) => !team.captain_id || !team.captain_name)) {
    return 'Each team must have exactly one captain assigned before starting auction.';
  }

  if (safePlayers.length === 0) {
    return 'Approve players first. No approved players are available for auction.';
  }

  return null;
}

export async function selectCurrentPlayer(supabase: SupabaseClient, playerId: string, hideManualPicker: boolean) {
  const season = await getActiveSeason(supabase);

  if (!season) return { response: jsonError('No current season going. Start a season first.') };

  const auction = await getAuction(supabase);
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('*')
    .eq('id', playerId)
    .eq('season_id', season.id)
    .maybeSingle();

  if (playerError) throw playerError;
  if (!player) return { response: jsonError('Player not found.', 404) };

  const safePlayer = player as Player;

  if (safePlayer.approval_status !== 'Approved') return { response: jsonError('Only approved players can be auctioned.') };

  if (safePlayer.auction_status === 'SOLD' || safePlayer.auction_status === 'UNSOLD' || safePlayer.status !== 'Available') {
    return { response: jsonError('This player is already completed.') };
  }

  await saveAdminHistory(supabase, {
    season_id: season.id,
    action_type: 'select_player',
    player: safePlayer,
    auction,
    message: `New player: ${safePlayer.name}`,
  });

  await supabase
    .from('players')
    .update({
      auction_status: 'CURRENT',
      status: 'Available',
      current_bid: Number(safePlayer.base_price || 0),
      updated_at: new Date().toISOString(),
    })
    .eq('id', safePlayer.id);

  await supabase
    .from('players')
    .update({ auction_status: 'PENDING', updated_at: new Date().toISOString() })
    .neq('id', safePlayer.id)
    .eq('season_id', season.id)
    .eq('auction_status', 'CURRENT');

  await supabase
    .from('auction')
    .update({
      season_id: season.id,
      current_player_id: safePlayer.id,
      auction_status: 'LIVE',
      highest_bid: Number(safePlayer.base_price || 0),
      highest_bidder_id: null,
      highest_bidder_team_id: null,
      highest_bidder_captain_name: null,
      highest_team_name: null,
      manual_picker_hidden: hideManualPicker,
      bid_processing: false,
      bid_lock_started_at: null,
      bid_lock_player_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', AUCTION_ID);

  await createAuctionEvent(supabase, {
    season_id: season.id,
    event_type: 'NEW_PLAYER',
    message: `New player on auction: ${safePlayer.name} at base price ${safePlayer.base_price || 0}.`,
    player_id: safePlayer.id,
    amount: Number(safePlayer.base_price || 0),
  });

  return { response: NextResponse.json({ ok: true }) };
}

export async function pickRandomPlayer(supabase: SupabaseClient) {
  const season = await getActiveSeason(supabase);

  if (!season) return null;

  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('season_id', season.id)
    .eq('approval_status', 'Approved')
    .eq('status', 'Available')
    .eq('auction_status', 'PENDING');

  if (error) throw error;

  const players = (data || []) as Player[];
  if (players.length === 0) return null;

  return players[Math.floor(Math.random() * players.length)];
}

export async function computeNextBidState(
  supabase: SupabaseClient,
  session: TokenPayload,
  incomingPlayerId?: string | null,
) {
  const season = await getActiveSeason(supabase);
  if (!season) return { error: 'No current season going.' };

  const auction = await getAuction(supabase);

  if (!auction || auction.auction_status !== 'LIVE') return { error: 'Auction is not live.' };
  if (!auction.current_player_id) return { error: 'No current player selected.' };
  if (incomingPlayerId && incomingPlayerId !== auction.current_player_id) {
    return { error: 'This player is not currently being auctioned.' };
  }

  const [{ data: captain }, { data: player }, team] = await Promise.all([
    supabase.from('captains').select('*').eq('id', session.id).eq('season_id', season.id).maybeSingle(),
    supabase.from('players').select('*').eq('id', auction.current_player_id).eq('season_id', season.id).maybeSingle(),
    getTeamForCaptain(supabase, session.id),
  ]);

  if (!captain) return { error: 'Captain not found.' };
  if (!team) return { error: 'Team not found for this captain.' };
  if (!player) return { error: 'Current player not found.' };

  const safePlayer = player as Player;

  if (safePlayer.auction_status !== 'CURRENT' || safePlayer.status !== 'Available') {
    return { error: 'Player is already sold or unsold.' };
  }

  if (auction.highest_bidder_id === session.id) return { error: 'You are already the highest bidder.' };

  const boughtCount = await getBoughtCount(supabase, team);
  if (boughtCount >= (team.max_players || MAX_BOUGHT_PLAYERS_PER_TEAM)) return { error: 'Your team is already full.' };

  const current = Math.max(
    Number(auction.highest_bid || 0),
    Number(safePlayer.current_bid || 0),
    Number(safePlayer.base_price || 0),
  );
  const nextAmount = nextBidAmount(current);

  if (nextAmount > Number(team.remaining_budget || 0)) return { error: 'Your team budget is not enough for the next bid.' };

  return { auction, season: season as Season, captain: captain as Captain, team, player: safePlayer, current, nextAmount };
}

export function cleanPhoneInput(phone: string) {
  return normalizePhoneNumber(phone);
}
