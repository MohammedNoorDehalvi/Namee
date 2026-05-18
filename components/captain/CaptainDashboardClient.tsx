"use client";

import { useEffect, useState } from 'react';
import { Trophy, Users } from 'lucide-react';
import { useAuctionRealtime } from '@/hooks/useAuctionRealtime';
import { readSession, useSession } from '@/hooks/useSession';
import { useApprovedPlayers } from '@/hooks/usePlayers';
import type { Captain, Player } from '@/lib/types';
import { formatMoney } from '@/lib/format';
import { AuctionScreen } from '@/components/auction/AuctionScreen';
import { PlayerCard } from '@/components/players/PlayerCard';

export function CaptainDashboardClient() {
  const { session } = useSession();
  const { filteredPlayers, loading } = useApprovedPlayers();
  const { auction, currentPlayer, currentBid } = useAuctionRealtime();
  const [captain, setCaptain] = useState<Captain | null>(null);
  const [bought, setBought] = useState<Player[]>([]);

  async function loadMine() {
    const stored = readSession();
    if (!stored) return;
    const res = await fetch('/api/captain/me', { headers: { Authorization: `Bearer ${stored.token}` } });
    if (res.ok) {
      const json = await res.json();
      setCaptain(json.captain);
      setBought(json.players || []);
    }
  }
  useEffect(() => { loadMine(); const id = setInterval(loadMine, 5000); return () => clearInterval(id); }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card label="Captain" value={session?.name || '-'} />
        <Card label="Team" value={session?.team_name || '-'} />
        <Card label="Remaining Budget" value={formatMoney(captain?.remaining_budget)} />
        <Card label="Players Bought" value={bought.length} />
      </div>
      <section className="mb-8 glass-card rounded-[2rem] p-5">
        <h2 className="mb-5 text-2xl font-black">Live Current Auction</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <Card label="Status" value={auction?.auction_status || 'Not Started'} />
          <Card label="Player" value={currentPlayer?.name || '-'} />
          <Card label="Highest Bid" value={formatMoney(currentBid)} />
          <Card label="Winning Team" value={auction?.highest_team_name || '-'} />
        </div>
      </section>
      <AuctionScreen />
      <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_.9fr]">
        <div>
          <h2 className="mb-5 flex items-center gap-2 text-2xl font-black"><Users className="text-apl-gold"/>Available Players</h2>
          {loading ? <p className="text-white/60">Loading...</p> : <div className="grid gap-5 md:grid-cols-2">{filteredPlayers.filter((p) => p.status === 'Available').slice(0, 6).map((p) => <PlayerCard key={p.id} player={p} />)}</div>}
        </div>
        <div>
          <h2 className="mb-5 flex items-center gap-2 text-2xl font-black"><Trophy className="text-apl-gold"/>Bought by Your Team</h2>
          <div className="grid gap-3">{bought.length === 0 && <div className="glass-card rounded-3xl p-5 text-white/55">No players bought yet.</div>}{bought.map((p) => <div key={p.id} className="glass-card rounded-3xl p-4"><b>{p.name}</b><p className="text-white/55">{p.role} • Sold price {formatMoney(p.sold_price)}</p></div>)}</div>
        </div>
      </section>
    </div>
  );
}
function Card({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="glass-card rounded-3xl p-5"><p className="text-sm text-white/50">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>;
}
