import { NextResponse } from 'next/server';

import { getActiveSeason } from '@/lib/season-server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import type { Auction, AuctionEvent, Bid, Captain, Player, Team } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

function enrichTeams(teams: Team[], captains: Captain[]) {
  return teams.map((team) => {
    const captain =
      captains.find((item) => item.id === team.captain_id) ||
      captains.find((item) => item.team_id === team.id) ||
      captains.find((item) => item.team_name === team.team_name);

    return {
      ...team,
      captain_photo_url: captain?.photo_url || team.captain_photo_url || null,
      captain_name: team.captain_name || captain?.captain_name || 'Captain',
    };
  });
}

function currentBidAmount(auction: Auction | null, player: Player | null) {
  return Math.max(
    Number(auction?.highest_bid || 0),
    Number(player?.current_bid || 0),
    Number(player?.base_price || 0),
  );
}

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();
    const season = await getActiveSeason(supabase);

    if (!season) {
      return NextResponse.json(
        {
          season: null,
          auction: null,
          currentPlayer: null,
          players: [],
          teams: [],
          captains: [],
          bids: [],
          events: [],
          currentBid: 0,
        },
        { headers: NO_STORE_HEADERS },
      );
    }

    const [{ data: auction }, { data: players }, { data: teams }, { data: captains }, { data: events }] =
      await Promise.all([
        supabase.from('auction').select('*').eq('id', 1).maybeSingle(),
        supabase
          .from('players')
          .select('*')
          .eq('season_id', season.id)
          .eq('approval_status', 'Approved')
          .order('created_at', { ascending: false }),
        supabase.from('teams').select('*').eq('season_id', season.id).order('team_name', { ascending: true }),
        supabase
          .from('captains')
          .select('id,season_id,captain_name,team_name,team_id,photo_url,budget,remaining_budget,created_at')
          .eq('season_id', season.id),
        supabase
          .from('auction_events')
          .select('*')
          .eq('season_id', season.id)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

    const safeAuction = (auction || null) as Auction | null;
    const safePlayers = (players || []) as Player[];
    const safeTeams = enrichTeams((teams || []) as Team[], (captains || []) as Captain[]);

    let currentPlayer: Player | null =
      safePlayers.find((player) => player.id === safeAuction?.current_player_id) || null;

    if (!currentPlayer && safeAuction?.current_player_id) {
      const { data } = await supabase
        .from('players')
        .select('*')
        .eq('id', safeAuction.current_player_id)
        .maybeSingle();

      currentPlayer = (data || null) as Player | null;
    }

    const { data: bids } = safeAuction?.current_player_id
      ? await supabase
          .from('bids')
          .select('*')
          .eq('season_id', season.id)
          .eq('player_id', safeAuction.current_player_id)
          .order('created_at', { ascending: false })
          .limit(10)
      : await supabase
          .from('bids')
          .select('*')
          .eq('season_id', season.id)
          .order('created_at', { ascending: false })
          .limit(10);

    return NextResponse.json(
      {
        season,
        auction: safeAuction,
        currentPlayer,
        players: safePlayers,
        teams: safeTeams,
        captains: captains || [],
        bids: (bids || []) as Bid[],
        events: (events || []) as AuctionEvent[],
        currentBid: currentBidAmount(safeAuction, currentPlayer),
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Could not load live auction.',
        season: null,
        auction: null,
        currentPlayer: null,
        players: [],
        teams: [],
        captains: [],
        bids: [],
        events: [],
        currentBid: 0,
      },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
