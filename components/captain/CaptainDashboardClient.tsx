"use client";

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { Gavel, Menu, Trophy, Users, WalletCards, X } from 'lucide-react';
import { useAuctionRealtime } from '@/hooks/useAuctionRealtime';
import { readSession, useSession } from '@/hooks/useSession';
import { nextBidAmount } from '@/lib/auction-utils';
import type { Captain, Player, Team } from '@/lib/types';
import { formatMoney, initials } from '@/lib/format';
import { toast } from '@/components/ui/AppToaster';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function CaptainDashboardClient() {
  const { session } = useSession();
  const { auction, currentPlayer, currentBid, bids, teams, players, loading, refresh } = useAuctionRealtime();
  const [captain, setCaptain] = useState<Captain | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [bought, setBought] = useState<Player[]>([]);
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nextBid = useMemo(() => nextBidAmount(currentBid), [currentBid]);
  const alreadyHighest = auction?.highest_bidder_id === session?.id;
  const teamFull = bought.length >= (team?.max_players || 4);
  const cannotBidReason = (() => {
    if (!session || session.role !== 'captain') return 'Login as captain first.';
    if (auction?.auction_status !== 'LIVE') return 'Auction is not live.';
    if (!currentPlayer) return 'No current player selected.';
    if (currentPlayer.auction_status !== 'CURRENT' || currentPlayer.status !== 'Available') return 'Player already completed.';
    if (teamFull) return 'Team Full';
    if (alreadyHighest) return 'You are already highest bidder.';
    if (team && nextBid > team.remaining_budget) return 'Budget is not enough.';
    return null;
  })();

  async function loadMine() {
    const stored = readSession();
    if (!stored) return;
    const res = await fetch('/api/captain/me', { headers: { Authorization: `Bearer ${stored.token}` } });
    if (res.ok) {
      const json = await res.json();
      setCaptain(json.captain || null);
      setTeam(json.team || null);
      setBought(json.players || []);
    }
  }

  useEffect(() => {
    void loadMine();
    const id = window.setInterval(() => void loadMine(), 5000);
    return () => window.clearInterval(id);
  }, []);

  async function bid() {
    const stored = readSession();
    if (!stored || !currentPlayer) return toast('Login as captain to bid.');
    if (cannotBidReason) return toast(cannotBidReason);
    setBusy(true);
    const res = await fetch('/api/bids/place', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stored.token}` },
      body: JSON.stringify({ player_id: currentPlayer.id }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast(json.error || 'Bid failed');
    toast(`Bid placed: ${formatMoney(json.bid_amount)}`);
    void refresh();
    void loadMine();
  }

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  return (
    <main className="min-h-screen bg-stadium px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex items-center justify-between gap-4 rounded-[2rem] border border-white/10 bg-black/25 p-4 backdrop-blur-xl">
          <div>
            <p className="badge inline-flex border-apl-gold/40 bg-apl-gold/10 text-apl-gold">Captain Auction Room</p>
            <h1 className="mt-2 text-3xl font-black">{captain?.team_name || session?.team_name || 'Your Team'}</h1>
            <p className="text-sm text-white/60">Highest Bidder: {auction?.highest_team_name ? `${auction.highest_team_name} / ${auction.highest_bidder_captain_name || 'Captain'}` : 'No bids yet'}</p>
          </div>
          <button className="btn-ghost lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5" /> Team</button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <section className="glass-card rounded-[2rem] p-5 sm:p-8">
            {!currentPlayer ? (
              <div className="flex min-h-[420px] items-center justify-center text-center text-white/60">No current player selected by admin.</div>
            ) : (
              <div className="grid gap-6 md:grid-cols-[280px_1fr]">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
                  {currentPlayer.photo_url ? <Image src={currentPlayer.photo_url} alt={currentPlayer.name} fill className="object-cover" sizes="280px" /> : <div className="flex h-full items-center justify-center text-6xl font-black text-apl-gold">{initials(currentPlayer.name)}</div>}
                </div>
                <div>
                  <p className="badge inline-flex border-apl-neon/30 bg-apl-neon/10 text-apl-neon">Current Auction Player</p>
                  <h2 className="mt-4 text-4xl font-black sm:text-6xl">{currentPlayer.name}</h2>
                  <p className="mt-3 text-white/65">{currentPlayer.role} • Batting: {currentPlayer.batting_style} • Bowling: {currentPlayer.bowling_style}</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <Stat label="Base" value={formatMoney(currentPlayer.base_price)} />
                    <Stat label="Current Bid" value={formatMoney(currentBid)} gold />
                    <Stat label="Next Bid" value={formatMoney(nextBid)} />
                  </div>
                  <button disabled={Boolean(cannotBidReason) || busy} onClick={bid} className="btn-primary mt-8 w-full text-lg disabled:cursor-not-allowed disabled:opacity-50">
                    <Gavel className="h-5 w-5" />
                    {busy ? 'Bidding...' : 'Bid'}
                  </button>
                  {cannotBidReason && <p className="mt-3 text-center text-sm text-amber-100/75">{cannotBidReason}</p>}
                </div>
              </div>
            )}
          </section>

          <CaptainSidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            team={team}
            bought={bought}
            bids={bids}
            teams={teams}
            players={players}
          />
        </div>
      </div>
    </main>
  );
}

function CaptainSidebar({ open, onClose, team, bought, bids, teams, players }: { open: boolean; onClose: () => void; team: Team | null; bought: Player[]; bids: { id: string; team_name: string; captain_name?: string | null; bid_amount: number }[]; teams: Team[]; players: Player[] }) {
  const content = (
    <div className="space-y-5">
      <div className="flex items-center justify-between lg:hidden"><h2 className="text-xl font-black">Team Sidebar</h2><button onClick={onClose}><X /></button></div>
      <div className="glass-card rounded-[2rem] p-5">
        <div className="flex items-center gap-2"><WalletCards className="h-5 w-5 text-apl-gold" /><h3 className="font-black">Budget</h3></div>
        <p className="mt-3 text-3xl font-black text-apl-gold">{formatMoney(team?.remaining_budget)}</p>
        <p className="text-sm text-white/55">Remaining from {formatMoney(team?.budget)}</p>
      </div>
      <div className="glass-card rounded-[2rem] p-5">
        <div className="flex items-center gap-2"><Users className="h-5 w-5 text-apl-neon" /><h3 className="font-black">Your Players</h3></div>
        <div className="mt-3 space-y-3">
          {bought.length === 0 && <p className="text-sm text-white/50">No players bought yet.</p>}
          {bought.map((player) => (
            <div key={player.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <p className="font-black">{player.name}</p>
              <p className="text-xs text-white/55">Role: {player.role}</p>
              <p className="text-xs text-white/55">Batting: {player.batting_style}</p>
              <p className="text-xs text-white/55">Bowling: {player.bowling_style}</p>
              <p className="text-xs text-apl-gold">Points bought: {formatMoney(player.sold_price)}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-card rounded-[2rem] p-5">
        <div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-apl-gold" /><h3 className="font-black">Other Teams</h3></div>
        <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
          {teams.map((other) => {
            const count = players.filter((player) => player.auction_status === 'SOLD' && (player.sold_to_team_id === other.id || player.sold_to_team === other.team_name)).length;
            return <p key={other.id} className="rounded-xl bg-white/[0.05] px-3 py-2 text-sm">{other.team_name}: {count}/{other.max_players || 4}</p>;
          })}
        </div>
      </div>
      <div className="glass-card rounded-[2rem] p-5">
        <h3 className="font-black">Last 10 Bids</h3>
        <div className="mt-3 space-y-2">
          {bids.length === 0 && <p className="text-sm text-white/50">No bids yet.</p>}
          {bids.map((bid) => <p key={bid.id} className="flex justify-between rounded-xl bg-white/[0.05] px-3 py-2 text-sm"><span>{bid.team_name}</span><b>{formatMoney(bid.bid_amount)}</b></p>)}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block">{content}</aside>
      {open && <div className="fixed inset-0 z-50 bg-black/60 p-4 backdrop-blur-sm lg:hidden"><div className="ml-auto h-full max-w-sm overflow-y-auto rounded-[2rem] bg-apl-dark p-4">{content}</div></div>}
    </>
  );
}

function Stat({ label, value, gold }: { label: string; value: React.ReactNode; gold?: boolean }) {
  return <div className={`rounded-2xl border p-4 ${gold ? 'border-apl-gold/40 bg-apl-gold/10' : 'border-white/10 bg-white/[0.04]'}`}><p className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>;
}
