"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Auction, AuctionEvent, Bid, Captain, Player, Team } from '@/lib/types';

function mergeCaptainPhotos(teams: Team[], captains: Captain[]) {
  return teams.map((team) => {
    const captain =
      captains.find((item) => item.id === team.captain_id) ||
      captains.find((item) => item.team_id === team.id) ||
      captains.find((item) => item.team_name === team.team_name) ||
      captains.find((item) => item.captain_name === team.captain_name);

    return {
      ...team,
      captain_photo_url: team.captain_photo_url || captain?.photo_url || null,
    };
  });
}

export function useAuctionRealtime() {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [captains, setCaptains] = useState<Captain[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [events, setEvents] = useState<AuctionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAuction = useCallback(async () => {
    setLoading(true);

    const [{ data: auctionData }, { data: playerData }, { data: teamData }, { data: captainData }, { data: eventData }] =
      await Promise.all([
        supabase.from('auction').select('*').eq('id', 1).maybeSingle(),
        supabase.from('players').select('*').eq('approval_status', 'Approved').order('created_at', { ascending: false }),
        supabase.from('teams').select('*').order('team_name', { ascending: true }),
        supabase.from('captains').select('id,captain_name,team_name,team_id,budget,remaining_budget,photo_url,created_at'),
        supabase.from('auction_events').select('*').order('created_at', { ascending: false }).limit(20),
      ]);

    const safeAuction = auctionData as Auction | null;
    const safePlayers = (playerData || []) as Player[];
    const safeCaptains = (captainData || []) as Captain[];
    const safeTeams = mergeCaptainPhotos((teamData || []) as Team[], safeCaptains);

    setAuction(safeAuction);
    setPlayers(safePlayers);
    setTeams(safeTeams);
    setCaptains(safeCaptains);
    setEvents((eventData || []) as AuctionEvent[]);

    if (safeAuction?.current_player_id) {
      const selected = safePlayers.find((player) => player.id === safeAuction.current_player_id) || null;
      setCurrentPlayer(selected);

      const { data: bidData } = await supabase
        .from('bids')
        .select('*')
        .eq('player_id', safeAuction.current_player_id)
        .order('created_at', { ascending: false })
        .limit(10);

      setBids((bidData || []) as Bid[]);
    } else {
      setCurrentPlayer(null);

      const { data: bidData } = await supabase
        .from('bids')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setBids((bidData || []) as Bid[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadAuction();

    const channel = supabase
      .channel('apl-live-auction-v3')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auction' }, () => void loadAuction())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => void loadAuction())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bids' }, () => void loadAuction())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => void loadAuction())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'captains' }, () => void loadAuction())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auction_events' }, () => void loadAuction())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadAuction]);

  const currentBid = useMemo(() => {
    return Math.max(
      Number(auction?.highest_bid || 0),
      Number(currentPlayer?.current_bid || 0),
      Number(currentPlayer?.base_price || 0),
    );
  }, [auction, currentPlayer]);

  return {
    auction,
    currentPlayer,
    players,
    teams,
    captains,
    bids,
    events,
    loading,
    currentBid,
    refresh: loadAuction,
  };
}
