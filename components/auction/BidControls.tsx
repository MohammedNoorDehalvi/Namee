"use client";

import { useState } from 'react';
import { BID_STEPS } from '@/lib/constants';
import type { Auction, Player } from '@/lib/types';
import { readSession } from '@/hooks/useSession';
import { toast } from '@/components/ui/AppToaster';

export function BidControls({ auction, player, currentBid, onBid }: { auction: Auction; player: Player; currentBid: number; onBid: () => void }) {
  const [customBid, setCustomBid] = useState('');
  const [loading, setLoading] = useState(false);
  const live = auction.auction_status === 'Live' && player.status === 'Available';

  async function placeBid(amount: number) {
    const session = readSession();
    if (!session || session.role !== 'captain') return toast('Login as captain to bid.');
    if (!live) return toast('Auction is not live for bidding.');
    if (!amount || amount <= currentBid) return toast('Bid must be higher than current bid.');
    setLoading(true);
    const res = await fetch('/api/bids/place', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
      body: JSON.stringify({ player_id: player.id, bid_amount: amount })
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) return toast(json.error || 'Bid failed');
    toast('Bid placed successfully');
    setCustomBid('');
    onBid();
  }

  const base = Math.max(currentBid || 0, player.base_price || 0);
  return (
    <div className="rounded-[2rem] border border-white/10 bg-black/20 p-4">
      <p className="mb-3 text-sm font-bold text-white/60">Bid controls</p>
      <div className="grid grid-cols-3 gap-3">
        {BID_STEPS.map((step) => <button disabled={loading || !live} key={step} onClick={() => placeBid(base + step)} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">+{step}</button>)}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input className="input" value={customBid} onChange={(e) => setCustomBid(e.target.value)} placeholder="Custom total bid amount" type="number" min={base + 1} />
        <button disabled={loading || !live} onClick={() => placeBid(Number(customBid))} className="btn-ghost disabled:opacity-50">Custom Bid</button>
      </div>
      {!live && <p className="mt-3 text-sm text-white/50">Admin must start the live auction before captains can bid.</p>}
    </div>
  );
}
