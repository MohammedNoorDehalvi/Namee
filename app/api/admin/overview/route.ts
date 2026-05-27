import { NextResponse } from 'next/server';
import { requireAdminRequest } from '@/lib/auction-server';
import { boughtPlayersForTeam } from '@/lib/auction-utils';
import { getActiveSeason } from '@/lib/season-server';
import type { Player, Team } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { response, supabase } = requireAdminRequest(request);
  if (response || !supabase) return response;

  const season = await getActiveSeason(supabase);

  if (!season) {
    const { data: auction } = await supabase.from('auction').select('*').eq('id', 1).maybeSingle();

    return NextResponse.json({
      season: null,
      players: [],
      teams: [],
      captains: [],
      bids: [],
      auction: auction || null,
      events: [],
      summary: {
        totalApprovedPlayers: 0,
        totalSoldPlayers: 0,
        totalUnsoldPlayers: 0,
        mostExpensivePlayer: null,
        cheapestSoldPlayer: null,
        teamsFull: [],
        teamsLessThanFour: [],
      },
    });
  }

  const [players, teams, captains, bids, auction, events] = await Promise.all([
    supabase.from('players').select('*').eq('season_id', season.id).order('created_at', { ascending: false }),
    supabase.from('teams').select('*').eq('season_id', season.id).order('team_name', { ascending: true }),
    supabase
      .from('captains')
      .select('id,season_id,captain_name,team_name,team_id,budget,remaining_budget,photo_url,created_at')
      .eq('season_id', season.id)
      .order('team_name'),
    supabase.from('bids').select('*').eq('season_id', season.id).order('created_at', { ascending: false }).limit(50),
    supabase.from('auction').select('*').eq('id', 1).maybeSingle(),
    supabase.from('auction_events').select('*').eq('season_id', season.id).order('created_at', { ascending: false }).limit(30),
  ]);

  const safePlayers = (players.data || []) as Player[];
  const safeTeams = (teams.data || []) as Team[];
  const soldPlayers = safePlayers.filter((player) => player.auction_status === 'SOLD' || player.status === 'Sold');
  const unsoldPlayers = safePlayers.filter((player) => player.auction_status === 'UNSOLD' || player.status === 'Unsold');
  const approvedPlayers = safePlayers.filter((player) => player.approval_status === 'Approved');
  const sortedSold = [...soldPlayers].sort((a, b) => Number(b.sold_price || 0) - Number(a.sold_price || 0));
  const teamsFull = safeTeams.filter((team) => boughtPlayersForTeam(safePlayers, team).length >= (team.max_players || 4));

  return NextResponse.json({
    season,
    players: safePlayers,
    teams: safeTeams,
    captains: captains.data || [],
    bids: bids.data || [],
    auction: auction.data || null,
    events: events.data || [],
    summary: {
      totalApprovedPlayers: approvedPlayers.length,
      totalSoldPlayers: soldPlayers.length,
      totalUnsoldPlayers: unsoldPlayers.length,
      mostExpensivePlayer: sortedSold[0] || null,
      cheapestSoldPlayer: sortedSold.length ? sortedSold[sortedSold.length - 1] : null,
      teamsFull,
      teamsLessThanFour: safeTeams.filter((team) => boughtPlayersForTeam(safePlayers, team).length < (team.max_players || 4)),
    },
  });
}
