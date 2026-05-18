"use client";

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Auction, Bid, Player } from '@/lib/types';

export function useAuctionRealtime() {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAuction() {
    setLoading(true);
    const { data: auctionData } = await supabase.from('auction').select('*').eq('id', 1).maybeSingle();
    setAuction(auctionData as Auction | null);
    if (auctionData?.current_player_id) {
      const [{ data: playerData }, { data: bidData }] = await Promise.all([
        supabase.from('players').select('*').eq('id', auctionData.current_player_id).maybeSingle(),
        supabase.from('bids').select('*').eq('player_id', auctionData.current_player_id).order('created_at', { ascending: false }).limit(10)
      ]);
      setCurrentPlayer(playerData as Player | null);
      setBids((bidData || []) as Bid[]);
    } else {
      setCurrentPlayer(null);
      setBids([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadAuction();
    const channel = supabase
      .channel('apl-live-auction')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auction' }, () => loadAuction())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => loadAuction())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bids' }, () => loadAuction())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const currentBid = useMemo(() => auction?.highest_bid || currentPlayer?.current_bid || currentPlayer?.base_price || 0, [auction, currentPlayer]);
  return { auction, currentPlayer, bids, loading, currentBid, refresh: loadAuction };
}
