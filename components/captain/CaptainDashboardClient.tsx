"use client";

import { useEffect, useMemo, useState } from 'react';
import { Gavel, Menu, Trophy, Users, WalletCards, X } from 'lucide-react';
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
      <main className="section-shell flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading captain room..." />
      </main>
    );
  }

  return (
    <main className="section-shell space-y-6 overflow-x-hidden">
      <section className="glass-card p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar src={team?.logo_url} label={captain?.team_name || session?.team_name || 'Team'} size="lg" />

            <div className="min-w-0">
              <p className="inline-flex rounded-full border border-apl-gold/25 bg-apl-gold/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-apl-gold">
                Captain Auction Room
              </p>
              <h1 className="mt-3 break-words text-3xl font-black text-white sm:text-5xl">
                {captain?.team_name || session?.team_name || 'Your Team'}
              </h1>
              <div className="mt-2 flex items-center gap-2 text-white/65">
                <Avatar src={captain?.photo_url || team?.captain_photo_url} label={captain?.captain_name || session?.name || 'Captain'} size="xs" />
                <span>Captain: {captain?.captain_name || session?.name || 'Captain'}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="btn-ghost w-full justify-center sm:w-auto sm:shrink-0"
          >
            <Menu className="h-5 w-5" />
            Team
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
          <Avatar src={highestTeam?.logo_url} label={auction?.highest_team_name || 'No bids'} size="sm" />
          <p className="text-sm text-white/65">
            Highest Bidder:{' '}
            <span className="font-bold text-white">
              {auction?.highest_team_name ? `${auction.highest_team_name} / ${auction.highest_bidder_captain_name || 'Captain'}` : 'No bids yet'}
            </span>
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="glass-card min-h-[420px] p-5 sm:p-7">
          {!currentPlayer ? (
            <div className="flex min-h-[360px] items-center justify-center text-center text-white/55">
              No current player selected by admin.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-[220px_1fr]">
              <div className="aspect-square overflow-hidden rounded-[2rem] border border-white/10 bg-black/30">
                {currentPlayer.photo_url ? (
                  <img
                    src={currentPlayer.photo_url}
                    alt={currentPlayer.name}
                    loading="eager"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-4xl font-black text-apl-gold">{initials(currentPlayer.name)}</div>
                )}
              </div>

              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-apl-gold">Current Auction Player</p>
                <h2 className="mt-2 text-4xl font-black text-white">{currentPlayer.name}</h2>
                <p className="mt-2 text-white/60">
                  {currentPlayer.role} • Batting: {currentPlayer.batting_style} • Bowling: {currentPlayer.bowling_style}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Stat label="Current Bid" value={formatMoney(currentBid)} gold />
                  <Stat label="Next Bid" value={formatMoney(nextBid)} />
                  <Stat label="Your Budget" value={formatMoney(team?.remaining_budget)} />
                  <Stat label="Your Players" value={`${bought.length}/${team?.max_players || 4}`} />
                </div>

                <button
                  type="button"
                  onClick={() => void bid()}
                  disabled={Boolean(cannotBidReason) || busy}
                  className="btn-primary mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Gavel className="h-5 w-5" />
                  {busy ? 'Bidding...' : 'Bid'}
                </button>

                {cannotBidReason && <p className="mt-3 text-center text-sm text-white/55">{cannotBidReason}</p>}
              </div>
            </div>
          )}
        </div>

        <CaptainSidebarContent team={team} captain={captain} bought={bought} bids={bids} teams={teams} players={players} compact />
      </section>

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
    </main>
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md xl:hidden" onClick={onClose}>
      <aside
        className="ml-auto h-full w-[min(92vw,390px)] overflow-y-auto border-l border-white/10 bg-apl-dark p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" onClick={onClose} className="btn-ghost mb-5 w-full justify-center">
          <X className="h-5 w-5" />
          Close Team
        </button>

        <CaptainSidebarContent team={team} captain={captain} bought={bought} bids={bids} teams={teams} players={players} />
      </aside>
    </div>
  );
}

function CaptainSidebarContent({
  team,
  captain,
  bought,
  bids,
  teams,
  players,
  compact = false,
}: {
  team: Team | null;
  captain: Captain | null;
  bought: Player[];
  bids: Bid[];
  teams: Team[];
  players: Player[];
  compact?: boolean;
}) {
  return (
    <aside className={`${compact ? 'hidden xl:block' : ''} glass-card p-5`}>
      <div className="flex items-center gap-3">
        <Avatar src={team?.logo_url} label={team?.team_name || 'Team'} size="md" />
        <div>
          <h2 className="text-xl font-black text-white">Team Sidebar</h2>
          <div className="mt-1 flex items-center gap-2 text-sm text-white/55">
            <Avatar src={captain?.photo_url || team?.captain_photo_url} label={captain?.captain_name || 'Captain'} size="xs" />
            <span>{captain?.captain_name || team?.captain_name || 'Captain'}</span>
          </div>
        </div>
      </div>

      <section className="mt-5">
        <h3 className="flex items-center gap-2 font-black text-white">
          <WalletCards className="h-4 w-4 text-apl-gold" />
          Budget
        </h3>
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="font-bold text-white">{team?.team_name || 'Your Team'}</p>
          <p className="mt-1 text-3xl font-black text-apl-gold">{formatMoney(team?.remaining_budget)}</p>
          <p className="text-sm text-white/45">Remaining from {formatMoney(team?.budget)}</p>
        </div>
      </section>

      <section className="mt-5">
        <h3 className="flex items-center gap-2 font-black text-white">
          <Users className="h-4 w-4 text-apl-green" />
          Your Players
        </h3>
        <div className="mt-3 space-y-3">
          {bought.length === 0 && <p className="text-white/50">No players bought yet.</p>}
          {bought.map((player) => (
            <div key={player.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <div className="flex items-center gap-3">
                <Avatar src={player.photo_url} label={player.name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate font-bold text-white">{player.name}</p>
                  <p className="text-xs text-white/55">Points bought: {formatMoney(player.sold_price)}</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-white/55">
                Role: {player.role} • Batting: {player.batting_style} • Bowling: {player.bowling_style}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <h3 className="flex items-center gap-2 font-black text-white">
          <Trophy className="h-4 w-4 text-apl-gold" />
          Other Teams
        </h3>
        <div className="mt-3 space-y-2">
          {teams.map((other) => {
            const count = players.filter(
              (player) =>
                player.auction_status === 'SOLD' &&
                (player.sold_to_team_id === other.id || player.sold_to_team === other.team_name),
            ).length;

            return (
              <div key={other.id} className="flex items-center justify-between rounded-2xl bg-white/[0.04] p-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar src={other.logo_url} label={other.team_name} size="sm" />
                  <span className="truncate text-sm font-bold text-white">{other.team_name}</span>
                </div>
                <span className="shrink-0 text-sm text-apl-gold">
                  {count}/{other.max_players || 4}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-5">
        <h3 className="flex items-center gap-2 font-black text-white">
          <Gavel className="h-4 w-4 text-apl-gold" />
          Last 10 Bids
        </h3>
        <div className="mt-3 space-y-2">
          {bids.length === 0 && <p className="text-white/50">No bids yet.</p>}
          {bids.map((bid) => {
            const bidTeam = teams.find((item) => item.id === bid.team_id) || teams.find((item) => item.team_name === bid.team_name);

            return (
              <div key={bid.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.04] p-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar src={bidTeam?.logo_url} label={bid.team_name} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{bid.team_name}</p>
                    <p className="truncate text-xs text-white/45">{bid.captain_name || 'Captain'}</p>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-black text-apl-gold">{formatMoney(bid.bid_amount)}</span>
              </div>
            );
          })}
        </div>
      </section>
    </aside>
  );
}

function Avatar({
  src,
  label,
  size = 'md',
}: {
  src?: string | null;
  label: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}) {
  const [ok, setOk] = useState(Boolean(src));
  const sizes = {
    xs: 'h-7 w-7 rounded-full text-[10px]',
    sm: 'h-10 w-10 rounded-2xl text-xs',
    md: 'h-14 w-14 rounded-2xl text-sm',
    lg: 'h-20 w-20 rounded-3xl text-lg',
  };

  return (
    <div className={`${sizes[size]} grid shrink-0 place-items-center overflow-hidden border border-white/10 bg-apl-gold/15 font-black text-apl-gold`}>
      {src && ok ? (
        <img
          src={src}
          alt={label}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={() => setOk(false)}
        />
      ) : (
        <span>{initials(label)}</span>
      )}
    </div>
  );
}

function Stat({ label, value, gold }: { label: string; value: React.ReactNode; gold?: boolean }) {
  return (
    <div className={`rounded-3xl border p-4 ${gold ? 'border-apl-gold/40 bg-apl-gold/10' : 'border-white/10 bg-white/[0.04]'}`}>
      <p className="text-sm text-white/45">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}
