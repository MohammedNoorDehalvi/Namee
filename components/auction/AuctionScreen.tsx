"use client";

import Image from 'next/image';
import { Gavel, Trophy } from 'lucide-react';
import { useAuctionRealtime } from '@/hooks/useAuctionRealtime';
import { useSession } from '@/hooks/useSession';
import { formatMoney, initials, statusClass } from '@/lib/format';
import { BidControls } from './BidControls';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';

export function AuctionScreen() {
  const { auction, currentPlayer, bids, loading, currentBid, refresh } = useAuctionRealtime();
  const { session } = useSession();

  if (loading) return <LoadingSpinner label="Loading live auction..." />;
  if (!auction || !currentPlayer) return <EmptyState title="Auction not started" description="Admin can start auction from the Admin Dashboard." />;

  return (
    <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_380px]">
      <section className="glass-card overflow-hidden rounded-[2.4rem]">
        <div className="grid gap-0 lg:grid-cols-[.9fr_1.1fr]">
          <div className="relative min-h-[380px] bg-gradient-to-br from-apl-gold/20 to-apl-green/20">
            {currentPlayer.photo_url ? <Image src={currentPlayer.photo_url} alt={currentPlayer.name} fill className="object-cover" /> : <div className="grid h-full min-h-[380px] place-items-center text-7xl font-black text-apl-gold">{initials(currentPlayer.name)}</div>}
            <div className="absolute left-5 top-5"><span className={`badge ${statusClass(auction.auction_status)}`}>{auction.auction_status}</span></div>
          </div>
          <div className="p-6 sm:p-8">
            <p className="text-sm font-black uppercase tracking-[.3em] text-apl-gold">Current Player</p>
            <h1 className="mt-3 text-5xl font-black tracking-tight sm:text-7xl">{currentPlayer.name}</h1>
            <p className="mt-3 text-lg text-white/65">{currentPlayer.role} • {currentPlayer.batting_style} • {currentPlayer.bowling_style}</p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <BigStat label="Base Price" value={formatMoney(currentPlayer.base_price)} />
              <BigStat label="Highest Bid" value={formatMoney(currentBid)} highlighted />
              <BigStat label="Highest Team" value={auction.highest_team_name || 'No bid yet'} />
              <BigStat label="Sold Team" value={currentPlayer.sold_to_team || '-'} />
            </div>
            <div className="mt-8">
              {session?.role === 'captain' ? <BidControls auction={auction} player={currentPlayer} currentBid={currentBid} onBid={refresh} /> : <div className="rounded-3xl border border-apl-gold/20 bg-apl-gold/10 p-5 font-bold text-apl-gold">Login as captain to bid.</div>}
            </div>
          </div>
        </div>
      </section>
      <aside className="glass-card rounded-[2.4rem] p-6">
        <div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-apl-gold/15 text-apl-gold"><Gavel /></div><div><h2 className="text-xl font-black">Bid History</h2><p className="text-sm text-white/50">Latest 10 bids</p></div></div>
        <div className="mt-6 grid gap-3">
          {bids.length === 0 && <p className="rounded-2xl bg-white/5 p-4 text-white/55">No bids yet.</p>}
          {bids.map((bid) => <div key={bid.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"><span className="font-bold">{bid.team_name}</span><span className="text-apl-gold font-black"><Trophy className="mr-1 inline" size={16}/>{formatMoney(bid.bid_amount)}</span></div>)}
        </div>
      </aside>
    </div>
  );
}
function BigStat({ label, value, highlighted }: { label: string; value: React.ReactNode; highlighted?: boolean }) {
  return <div className={`rounded-3xl border p-4 ${highlighted ? 'border-apl-gold/30 bg-apl-gold/10' : 'border-white/10 bg-white/5'}`}><p className="text-xs font-bold uppercase tracking-[.2em] text-white/45">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>;
}
