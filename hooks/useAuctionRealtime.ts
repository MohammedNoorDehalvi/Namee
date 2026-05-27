'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Auction, AuctionEvent, Bid, Captain, Player, Season, Team } from '@/lib/types';

type LoadOptions = { silent?: boolean };
type RealtimeOptions = { pollMs?: number };

async function getActiveSeasonClient() {
  const { data } = await supabase
    .from('seasons')
    .select('*')
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data as Season | null;
}

export function useAuctionRealtime(options: RealtimeOptions = {}) {
  const pollMs = Math.max(500, options.pollMs ?? 900);
  const [season, setSeason] = useState<Season | null>(null);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [events, setEvents] = useState<AuctionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const inFlightRef = useRef(false);
  const mountedRef = useRef(false);

  const loadAuction = useCallback(async ({ silent = false }: LoadOptions = {}) => {
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    if (!silent) setLoading(true);

    try {
      const activeSeason = await getActiveSeasonClient();

      if (!mountedRef.current) return;

      setSeason(activeSeason);

      if (!activeSeason) {
        setAuction(null);
        setCurrentPlayer(null);
        setPlayers([]);
        setTeams([]);
        setBids([]);
        setEvents([]);
        return;
      }

      const [{ data: auctionData }, { data: playerData }, { data: teamData }, { data: captainData }, { data: eventData }] =
        await Promise.all([
          supabase.from('auction').select('*').eq('id', 1).maybeSingle(),
          supabase
            .from('players')
            .select('*')
            .eq('season_id', activeSeason.id)
            .eq('approval_status', 'Approved')
            .order('created_at', { ascending: false }),
          supabase.from('teams').select('*').eq('season_id', activeSeason.id).order('team_name', { ascending: true }),
          supabase
            .from('captains')
            .select('id,season_id,captain_name,team_name,team_id,photo_url,budget,remaining_budget,created_at')
            .eq('season_id', activeSeason.id),
          supabase
            .from('auction_events')
            .select('*')
            .eq('season_id', activeSeason.id)
            .order('created_at', { ascending: false })
            .limit(20),
        ]);

      if (!mountedRef.current) return;

      const safeAuction = auctionData as Auction | null;
      const safePlayers = (playerData || []) as Player[];
      const safeCaptains = (captainData || []) as Captain[];

      const enrichedTeams = ((teamData || []) as Team[]).map((team) => {
        const captain =
          safeCaptains.find((item) => item.id === team.captain_id) ||
          safeCaptains.find((item) => item.team_id === team.id) ||
          safeCaptains.find((item) => item.team_name === team.team_name);

        return {
          ...team,
          captain_photo_url: captain?.photo_url || team.captain_photo_url || null,
          captain_name: team.captain_name || captain?.captain_name || 'Captain',
        };
      });

      setAuction(safeAuction);
      setPlayers(safePlayers);
      setTeams(enrichedTeams);
      setEvents((eventData || []) as AuctionEvent[]);

      if (safeAuction?.current_player_id) {
        const selected = safePlayers.find((player) => player.id === safeAuction.current_player_id) || null;
        setCurrentPlayer(selected);

        const { data: bidData } = await supabase
          .from('bids')
          .select('*')
          .eq('season_id', activeSeason.id)
          .eq('player_id', safeAuction.current_player_id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!mountedRef.current) return;
        setBids((bidData || []) as Bid[]);
      } else {
        setCurrentPlayer(null);

        const { data: bidData } = await supabase
          .from('bids')
          .select('*')
          .eq('season_id', activeSeason.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!mountedRef.current) return;
        setBids((bidData || []) as Bid[]);
      }
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void loadAuction();

    const softRefresh = () => void loadAuction({ silent: true });

    const channel = supabase
      .channel('apl-live-auction-v5-season-bid-lock')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seasons' }, softRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auction' }, softRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, softRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bids' }, softRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, softRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'captains' }, softRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auction_events' }, softRefresh)
      .subscribe();

    const intervalId = window.setInterval(softRefresh, pollMs);
    const focusRefresh = () => softRefresh();
    const visibilityRefresh = () => {
      if (document.visibilityState === 'visible') softRefresh();
    };

    window.addEventListener('focus', focusRefresh);
    document.addEventListener('visibilitychange', visibilityRefresh);

    return () => {
      mountedRef.current = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', focusRefresh);
      document.removeEventListener('visibilitychange', visibilityRefresh);
      void supabase.removeChannel(channel);
    };
  }, [loadAuction, pollMs]);

  const currentBid = useMemo(() => {
    return Math.max(
      Number(auction?.highest_bid || 0),
      Number(currentPlayer?.current_bid || 0),
      Number(currentPlayer?.base_price || 0),
    );
  }, [auction, currentPlayer]);

  return { season, auction, currentPlayer, players, teams, bids, events, loading, currentBid, refresh: loadAuction };
}
