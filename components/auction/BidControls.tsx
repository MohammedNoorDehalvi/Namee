'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Gavel, Lock, WalletCards } from 'lucide-react';
import { readSession } from '@/hooks/useSession';
import { nextBidAmount } from '@/lib/auction-utils';
import type { Auction, Player } from '@/lib/types';
import { toast } from '@/components/ui/AppToaster';
import { formatMoney } from '@/lib/format';
import { playBidSound } from '@/lib/auction-ui';

export function BidControls({
  auction,
  player,
  currentBid,
  onBid,
  remainingBudget,
  sticky = false,
}: {
  auction: Auction;
  player: Player;
  currentBid: number;
  onBid: () => void;
  remainingBudget?: number | null;
  /** Render as fixed bottom bar (captain mobile). */
  sticky?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const nextAmount = useMemo(() => nextBidAmount(currentBid), [currentBid]);
  const session = typeof window !== 'undefined' ? readSession() : null;
  const isCaptain = session?.role === 'captain';
  const live =
    auction.auction_status === 'LIVE' &&
    player.auction_status === 'CURRENT' &&
    player.status === 'Available';

  const blockedReason = (() => {
    if (!isCaptain) return 'Login as captain to bid';
    if (!live) return 'Waiting for a live lot';
    if (remainingBudget != null && nextAmount > remainingBudget) return 'Budget too low';
    return null;
  })();

  async function placeBid() {
    const current = readSession();
    if (!current || current.role !== 'captain') {
      toast.error('Login as captain to bid.');
      return;
    }
    if (!live) {
      toast.error('Auction is not live for bidding.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/bids/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${current.token}`,
        },
        body: JSON.stringify({ player_id: player.id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error || 'Bid failed');
        return;
      }
      playBidSound();
      toast.success(`Bid placed: ${formatMoney(json.bid_amount || nextAmount)}`);
      onBid();
    } catch {
      toast.error('Network error placing bid.');
    } finally {
      setLoading(false);
    }
  }

  const shellClass = sticky
    ? 'fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-slate-950/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl shadow-2xl'
    : 'rounded-3xl border border-white/15 bg-slate-900/80 p-4 shadow-xl backdrop-blur-xl sm:p-5';

  return (
    <div className={shellClass}>
      <div className={sticky ? 'mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:gap-4' : 'space-y-3'}>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">Captain bid control</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-300">
            <span>
              Next: <strong className="text-white">{formatMoney(nextAmount)}</strong>
            </span>
            {remainingBudget != null && (
              <span className="inline-flex items-center gap-1 text-slate-400">
                <WalletCards className="h-3.5 w-3.5" />
                Purse {formatMoney(remainingBudget)}
              </span>
            )}
          </div>
        </div>

        {!isCaptain ? (
          <Link
            href="/captain-login"
            className="btn-primary w-full justify-center sm:w-auto sm:min-w-[200px]"
          >
            <Lock className="h-4 w-4" />
            Captain login to bid
          </Link>
        ) : (
          <button
            type="button"
            disabled={Boolean(blockedReason) || loading}
            onClick={() => void placeBid()}
            className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[200px]"
          >
            <Gavel className="h-5 w-5" />
            {loading ? 'Bidding…' : blockedReason ? blockedReason : `Bid ${formatMoney(nextAmount)}`}
          </button>
        )}
      </div>
      {isCaptain && blockedReason && !loading && (
        <p className="mt-2 text-center text-xs text-white/50 sm:text-left">{blockedReason}</p>
      )}
    </div>
  );
}
