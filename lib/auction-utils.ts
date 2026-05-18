import { HIGH_BID_INCREMENT, LOW_BID_INCREMENT, MAX_BOUGHT_PLAYERS_PER_TEAM } from '@/lib/constants';
import type { Player, Team } from '@/lib/types';

export function nextBidAmount(currentAmount: number) {
  return currentAmount < 1000 ? currentAmount + LOW_BID_INCREMENT : currentAmount + HIGH_BID_INCREMENT;
}

export function normalizePhoneNumber(phone: string) {
  const trimmed = phone.trim();
  const startsWithPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return `${startsWithPlus ? '+' : ''}${digits}`;
}

export function isValidPhoneNumber(phone: string) {
  const normalized = normalizePhoneNumber(phone);
  const digitCount = normalized.replace(/\D/g, '').length;
  return digitCount >= 10 && digitCount <= 15;
}

export function boughtPlayersForTeam(players: Player[], team: Pick<Team, 'id' | 'team_name'>) {
  return players.filter((player) =>
    player.auction_status === 'SOLD' &&
    (player.sold_to_team_id === team.id || player.sold_to_team === team.team_name)
  );
}

export function teamBoughtCount(players: Player[], team: Pick<Team, 'id' | 'team_name'>) {
  return boughtPlayersForTeam(players, team).length;
}

export function isTeamFull(players: Player[], team: Pick<Team, 'id' | 'team_name' | 'max_players'>) {
  return teamBoughtCount(players, team) >= (team.max_players || MAX_BOUGHT_PLAYERS_PER_TEAM);
}

export function computeTeamSpent(players: Player[], team: Pick<Team, 'id' | 'team_name'>) {
  return boughtPlayersForTeam(players, team).reduce((sum, player) => sum + Number(player.sold_price || 0), 0);
}
