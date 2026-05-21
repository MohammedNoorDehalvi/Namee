"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BadgeDollarSign, Gavel, Menu, Radio, Shield, Trophy, Users, WalletCards, X } from 'lucide-react';
import { useAuctionRealtime } from '@/hooks/useAuctionRealtime';
import { readSession, useSession } from '@/hooks/useSession';
import { nextBidAmount } from '@/lib/auction-utils';
import type { Bid, Captain, Player, Team } from '@/lib/types';
import { formatMoney, initials } from '@/lib/format';
import { toast } from '@/components/ui/AppToaster';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function CaptainDashboardClient() {
  const { session } = useSession();
  const { auction, currentPlayer, currentBid, bids, teams, players, loading, refresh } = useAuctionRealtime({ pollMs: 700 });

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

    const res = await fetch('/api/captain/me', {
      headers: { Authorization: `Bearer ${stored.token}` },
    });

    if (res.ok) {
      const json = await res.json();
      setCaptain(json.captain || null);
      setTeam(json.team || null);
      setBought(json.players || []);
    }
  }

  useEffect(() => {
    void loadMine();

    const softRefresh = () => void loadMine();
    const id = window.setInterval(softRefresh, 900);
    const focusRefresh = () => softRefresh();
    const visibilityRefresh = () => {
      if (document.visibilityState === 'visible') softRefresh();
    };

    window.addEventListener('focus', focusRefresh);
    document.addEventListener('visibilitychange', visibilityRefresh);

    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', focusRefresh);
      document.removeEventListener('visibilitychange', visibilityRefresh);
    };
  }, []);

  async function bid() {
    const stored = readSession();

    if (!stored || !currentPlayer) return toast('Login as captain to bid.');
    if (cannotBidReason) return toast(cannotBidReason);

    setBusy(true);

    const res = await fetch('/api/bids/place', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${stored.token}`,
      },
      body: JSON.stringify({ player_id: currentPlayer.id }),
    });

    const json = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) return toast(json.error || 'Bid failed');

    toast(`Bid placed: ${formatMoney(json.bid_amount)}`);
    void refresh({ silent: true });
    void loadMine();
  }

  const highestTeam =
    teams.find((item) => item.id === auction?.highest_bidder_team_id) ||
    teams.find((item) => item.team_name === auction?.highest_team_name) ||
    null;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading captain auction room..." />
      </div>
    );
  }

  if (!session || session.role !== 'captain') {
    return (
      <section className="glass-card mx-auto max-w-xl rounded-[2rem] p-7 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-yellow-300/25 bg-yellow-300/10 text-yellow-300">
          <Shield size={28} />
        </div>
        <h1 className="mt-5 text-3xl font-black text-white">Captain login required</h1>
        <p className="mt-3 text-white/60">Login as a captain to open the live bidding dashboard.</p>
        <Link href="/captain-login" className="btn-primary mt-6 w-full">
          Captain Login
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="glass-card relative overflow-hidden rounded-[2.3rem] p-5 sm:p-7">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-green-300/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar src={team?.logo_url} label={captain?.team_name || session.team_name || 'Team'} size="lg" />
            <div className="min-w-0">
              <p className="badge border-green-300/20 bg-green-300/10 text-green-200">
                <Radio size={14} /> Captain Auction Room
              </p>
              <h1 className="mt-3 truncate text-3xl font-black text-white sm:text-5xl">{captain?.team_name || session.team_name || 'Your Team'}</h1>
              <div className="mt-2 flex items-center gap-2 text-sm text-white/60">
                <Avatar src={captain?.photo_url || team?.captain_photo_url} label={captain?.captain_name || session.name} size="xs" />
                <span className="truncate">Captain: {captain?.captain_name || session.name}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(true)}
            className="btn-ghost w-full justify-center lg:hidden"
            type="button"
          >
            <Menu size={18} /> Team
          </button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <main className="space-y-6">
          <section className="premium-card rounded-[2rem] p-4 sm:p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Highest Bidder</p>
            <div className="mt-3 flex items-center gap-3">
              <Avatar src={highestTeam?.logo_url} label={highestTeam?.team_name || 'No bids'} size="md" />
              <div className="min-w-0">
                <p className="truncate text-xl font-black text-white">
                  {auction?.highest_team_name ? `${auction.highest_team_name} / ${auction.highest_bidder_captain_name || 'Captain'}` : 'No bids yet'}
                </p>
                <p className="mt-1 text-sm text-green-300">Current bid {formatMoney(currentBid)} • Next {formatMoney(nextBid)}</p>
              </div>
            </div>
          </section>

          {!currentPlayer ? (
            <section className="premium-card grid min-h-[360px] place-items-center rounded-[2rem] p-6 text-center">
              <div>
                <Gavel className="mx-auto h-12 w-12 text-yellow-300" />
                <h2 className="mt-4 text-2xl font-black text-white">No current player selected</h2>
                <p className="mt-2 text-white/60">Admin will select the next player soon.</p>
              </div>
            </section>
          ) : (
            <section className="overflow-hidden rounded-[2.3rem] border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur">
              <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
                <div className="min-h-[320px] bg-black/20">
                  {currentPlayer.photo_url ? (
                    <img src={currentPlayer.photo_url} alt={currentPlayer.name} loading="lazy" className="h-full min-h-[320px] w-full object-cover" />
                  ) : (
                    <div className="grid h-full min-h-[320px] place-items-center bg-gradient-to-br from-yellow-300/15 to-green-300/15">
                      <span className="text-6xl font-black text-yellow-300">{initials(currentPlayer.name)}</span>
                    </div>
                  )}
                </div>

                <div className="p-5 sm:p-7">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-green-300">Current Auction Player</p>
                  <h2 className="mt-3 break-words text-4xl font-black text-white sm:text-6xl">{currentPlayer.name}</h2>
                  <p className="mt-3 text-sm leading-6 text-white/60">
                    {currentPlayer.role} • Batting: {currentPlayer.batting_style} • Bowling: {currentPlayer.bowling_style}
                  </p>

                  <div className="mt-7 grid grid-cols-2 gap-3">
                    <Stat label="Base Price" value={formatMoney(currentPlayer.base_price)} />
                    <Stat label="Current Bid" value={formatMoney(currentBid)} green />
                    <Stat label="Your Budget" value={formatMoney(team?.remaining_budget)} />
                    <Stat label="Next Bid" value={formatMoney(nextBid)} green />
                  </div>

                  <button
                    onClick={() => void bid()}
                    disabled={Boolean(cannotBidReason) || busy}
                    className="btn-primary mt-6 w-full text-lg disabled:cursor-not-allowed disabled:opacity-50"
                    type="button"
                  >
                    <Gavel size={20} />
                    {busy ? 'Bidding...' : `Bid ${formatMoney(nextBid)}`}
                  </button>

                  {cannotBidReason && (
                    <p className="mt-3 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-3 text-center text-sm font-bold text-yellow-100">
                      {cannotBidReason}
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}
        </main>

        <aside className="hidden xl:block">
          <TeamPanel team={team} captain={captain} bought={bought} bids={bids} teams={teams} players={players} />
        </aside>
      </div>

      <CaptainSidebarDrawer
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        team={team}
        captain={captain}
        bought={bought}
        bids={bids}
        teams={teams}
        players={players}
      />
    </div>
  );
}

function CaptainSidebarDrawer({
  open,
  onClose,
  team,
  captain,
  bought,
  bids,
  teams,
  players,
}: {
  open: boolean;
  onClose: () => void;
  team: Team | null;
  captain: Captain | null;
  bought: Player[];
  bids: Bid[];
  teams: Team[];
  players: Player[];
}) {
  if (!open) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 z-[80] bg-black/70 p-3 backdrop-blur-sm xl:hidden">
      <div onClick={(event) => event.stopPropagation()} className="ml-auto h-full max-w-md overflow-y-auto rounded-[2rem] border border-white/10 bg-[#07110c] p-4 soft-scrollbar">
        <button onClick={onClose} className="btn-ghost mb-4 w-full" type="button">
          <X size={18} /> Close Team
        </button>
        <TeamPanel team={team} captain={captain} bought={bought} bids={bids} teams={teams} players={players} />
      </div>
    </div>
  );
}

function TeamPanel({
  team,
  captain,
  bought,
  bids,
  teams,
  players,
}: {
  team: Team | null;
  captain: Captain | null;
  bought: Player[];
  bids: Bid[];
  teams: Team[];
  players: Player[];
}) {
  return (
    <div className="grid gap-5">
      <section className="premium-card rounded-[2rem] p-5">
        <div className="flex items-center gap-3">
          <Avatar src={team?.logo_url} label={team?.team_name || 'Team'} size="lg" />
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-black text-white">{team?.team_name || 'Your Team'}</h2>
            <div className="mt-2 flex items-center gap-2 text-sm text-white/55">
              <Avatar src={captain?.photo_url || team?.captain_photo_url} label={captain?.captain_name || team?.captain_name || 'Captain'} size="xs" />
              <span className="truncate">{captain?.captain_name || team?.captain_name || 'Captain'}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Stat label="Remaining" value={formatMoney(team?.remaining_budget)} green />
          <Stat label="Budget" value={formatMoney(team?.budget)} />
          <Stat label="Players" value={`${bought.length}/${team?.max_players || 4}`} />
          <Stat label="Status" value={bought.length >= (team?.max_players || 4) ? 'Full' : 'Open'} />
        </div>
      </section>

      <section className="premium-card rounded-[2rem] p-5">
        <h3 className="flex items-center gap-2 font-black text-white">
          <Trophy size={18} className="text-yellow-300" /> Your Players
        </h3>
        <div className="mt-4 grid gap-3">
          {bought.length === 0 && <p className="text-sm text-white/50">No players bought yet.</p>}
          {bought.map((player) => (
            <div key={player.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center gap-3">
                <Avatar src={player.photo_url} label={player.name} size="md" />
                <div className="min-w-0">
                  <p className="truncate font-black text-white">{player.name}</p>
                  <p className="mt-1 text-xs text-white/55">Points bought: {formatMoney(player.sold_price)}</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-white/48">
                Role: {player.role} • Batting: {player.batting_style} • Bowling: {player.bowling_style}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="premium-card rounded-[2rem] p-5">
        <h3 className="flex items-center gap-2 font-black text-white">
          <Users size={18} className="text-green-300" /> Other Teams
        </h3>
        <div className="mt-4 grid gap-3">
          {teams.map((other) => {
            const count = players.filter(
              (player) => player.auction_status === 'SOLD' && (player.sold_to_team_id === other.id || player.sold_to_team === other.team_name),
            ).length;

            return (
              <div key={other.id} className="flex items-center justify-between gap-3 rounded-2xl bg-black/20 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar src={other.logo_url} label={other.team_name} size="sm" />
                  <p className="truncate font-bold text-white">{other.team_name}</p>
                </div>
                <p className="shrink-0 text-sm text-white/55">{count}/{other.max_players || 4}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="premium-card rounded-[2rem] p-5">
        <h3 className="flex items-center gap-2 font-black text-white">
          <BadgeDollarSign size={18} className="text-yellow-300" /> Last 10 Bids
        </h3>
        <div className="mt-4 grid gap-2">
          {bids.length === 0 && <p className="text-sm text-white/50">No bids yet.</p>}
          {bids.map((bid) => (
            <div key={bid.id} className="flex items-center justify-between rounded-2xl bg-black/20 p-3 text-sm">
              <span className="truncate text-white/75">{bid.team_name}</span>
              <span className="font-black text-green-300">{formatMoney(bid.bid_amount)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, green }: { label: string; value: React.ReactNode; green?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${green ? 'border-green-300/25 bg-green-300/10' : 'border-white/10 bg-black/20'}`}>
      <p className="text-xs font-bold uppercase tracking-wider text-white/42">{label}</p>
      <p className={`mt-1 break-words text-xl font-black ${green ? 'text-green-300' : 'text-white'}`}>{value}</p>
    </div>
  );
}

function Avatar({ src, label, size = 'md' }: { src?: string | null; label: string; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const sizes = {
    xs: 'h-6 w-6 rounded-full text-[9px]',
    sm: 'h-9 w-9 rounded-xl text-[10px]',
    md: 'h-12 w-12 rounded-2xl text-xs',
    lg: 'h-16 w-16 rounded-2xl text-sm',
  };

  if (src) {
    return <img src={src} alt={label} loading="lazy" className={`${sizes[size]} shrink-0 border border-white/10 object-cover shadow-lg shadow-black/30`} />;
  }

  return (
    <div className={`${sizes[size]} flex shrink-0 items-center justify-center border border-yellow-300/20 bg-yellow-300/15 font-black text-yellow-300`}>
      {initials(label)}
    </div>
  );
}
