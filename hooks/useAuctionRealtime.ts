"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { supabase } from '@/lib/supabase/client';
import type { Auction, AuctionEvent, Bid, Captain, Player, Season, Team } from '@/lib/types';

type LoadOptions = { silent?: boolean };
type RealtimeOptions = { pollMs?: number };

type LiveAuctionState = {
  season: Season | null;
  auction: Auction | null;
  currentPlayer: Player | null;
  players: Player[];
  teams: Team[];
  captains: Captain[];
  bids: Bid[];
  events: AuctionEvent[];
  currentBid?: number;
  error?: string;
};

const emptyState: LiveAuctionState = {
  season: null,
  auction: null,
  currentPlayer: null,
  players: [],
  teams: [],
  captains: [],
  bids: [],
  events: [],
  currentBid: 0,
};

async function fetchLiveState() {
  const res = await fetch(`/api/auction/live-state?t=${Date.now()}`, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
  });

  const json = (await res.json().catch(() => emptyState)) as LiveAuctionState;

  if (!res.ok) throw new Error(json.error || 'Could not load live auction.');

  return json;
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
  const [serverCurrentBid, setServerCurrentBid] = useState(0);

  const inFlightRef = useRef(false);
  const mountedRef = useRef(false);

  const loadAuction = useCallback(async ({ silent = false }: LoadOptions = {}) => {
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    if (!silent) setLoading(true);

    try {
      const liveState = await fetchLiveState();
      if (!mountedRef.current) return;

      setSeason(liveState.season || null);
      setAuction(liveState.auction || null);
      setCurrentPlayer(liveState.currentPlayer || null);
      setPlayers(liveState.players || []);
      setTeams(liveState.teams || []);
      setBids(liveState.bids || []);
      setEvents(liveState.events || []);
      setServerCurrentBid(Number(liveState.currentBid || 0));
    } catch {
      if (!mountedRef.current) return;

      if (!silent) {
        setSeason(null);
        setAuction(null);
        setCurrentPlayer(null);
        setPlayers([]);
        setTeams([]);
        setBids([]);
        setEvents([]);
        setServerCurrentBid(0);
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
      .channel('apl-live-auction-server-state')
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
      Number(serverCurrentBid || 0),
      Number(auction?.highest_bid || 0),
      Number(currentPlayer?.current_bid || 0),
      Number(currentPlayer?.base_price || 0),
    );
  }, [auction, currentPlayer, serverCurrentBid]);

  return { season, auction, currentPlayer, players, teams, bids, events, loading, currentBid, refresh: loadAuction };
}
