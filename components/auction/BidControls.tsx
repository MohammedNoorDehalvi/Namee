"use client";

import { useMemo, useState } from 'react';
import { Gavel } from 'lucide-react';
import { readSession } from '@/hooks/useSession';
import { nextBidAmount } from '@/lib/auction-utils';
import type { Auction, Player } from '@/lib/types';
import { toast } from '@/components/ui/AppToaster';
import { formatMoney } from '@/lib/format';

export function BidControls({ auction, player, currentBid, onBid }: { auction: Auction; player: Player; currentBid: number; onBid: () => void }) {
  const [loading, setLoading] = useState(false);
  const nextAmount = useMemo(() => nextBidAmount(currentBid), [currentBid]);
  const live = auction.auction_status === 'LIVE' && player.auction_status === 'CURRENT' && player.status === 'Available';

  async function placeBid() {
    const session = readSession();
    if (!session || session.role !== 'captain') return toast('Login as captain to bid.');
    if (!live) return toast('Auction is not live for bidding.');
    setLoading(true);
    const res = await fetch('/api/bids/place', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
      body: JSON.stringify({ player_id: player.id }),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return toast(json.error || 'Bid failed');
    toast(`Bid placed: ${formatMoney(json.bid_amount || nextAmount)}`);
    onBid();
  }

  return (
    <div className="glass-card rounded-3xl p-4">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-apl-gold">Captain bid control</p>
      <button disabled={!live || loading} onClick={placeBid} className="btn-primary mt-3 w-full disabled:cursor-not-allowed disabled:opacity-50">
        <Gavel className="h-5 w-5" />
        {loading ? 'Bidding...' : `Bid ${formatMoney(nextAmount)}`}
      </button>
      {!live && <p className="mt-3 text-xs text-white/50">Admin must select a live player before captains can bid.</p>}
    </div>
  );
}
