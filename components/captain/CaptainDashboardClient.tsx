"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Gavel, Menu, Trophy, Users, WalletCards, X } from 'lucide-react';
import { useAuctionRealtime } from '@/hooks/useAuctionRealtime';
import { usePlayerSoldCelebration } from '@/hooks/usePlayerSoldCelebration';
import { PlayerSoldCelebrationOverlay } from '@/components/auction/PlayerSoldCelebrationOverlay';
import { LotCard } from '@/components/auction/LotCard';
import { readSession, useSession } from '@/hooks/useSession';
import { nextBidAmount } from '@/lib/auction-utils';
import type { Bid, Captain, Player, Team } from '@/lib/types';
import { formatMoney, initials } from '@/lib/format';
import { toast } from '@/components/ui/AppToaster';
import { AuctionPageSkeleton } from '@/components/ui/AuctionSkeleton';
import { ReconnectingBanner } from '@/components/ui/ReconnectingBanner';
import { HighestBidderBadge } from '@/components/ui/HighestBidderBadge';
import { AutoScrollList } from '@/components/ui/AutoScrollList';
import { PurseBar } from '@/components/ui/PurseBar';
import { AuctionStatusBadge, StatusBadge } from '@/components/ui/StatusBadge';
import { playBidAcceptedSound, playOutbidSound } from '@/lib/auction-ui';
import { CoachMarks } from '@/components/ui/CoachMarks';

export function CaptainDashboardClient() {
  const { session } = useSession();
  const { auction, currentPlayer, currentBid, bids, teams, players, events, loading, refresh, realtimeDisconnected } =
    useAuctionRealtime({ pollMs: 900 });

  const [captain, setCaptain] = useState<Captain | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [bought, setBought] = useState<Player[]>([]);
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const prevBidRef = useRef<number | null>(null);

  const nextBid = useMemo(() => nextBidAmount(currentBid), [currentBid]);
  const alreadyHighest = auction?.highest_bidder_id === session?.id;
  const teamFull = bought.length >= (team?.max_players || 4);
  const latestBidId = bids[0]?.id || '';

  // Live bid animation + outbid tone when someone else raises
  useEffect(() => {
    if (prevBidRef.current !== null && currentBid > prevBidRef.current) {
      playOutbidSound();
    }
    prevBidRef.current = currentBid;
  }, [currentBid]);

  const cannotBidReason = (() => {
    if (!session || session.role !== 'captain') return 'Login as captain first.';
    if (auction?.auction_status === 'PAUSED') return 'Auction is paused';
    if (auction?.auction_status !== 'LIVE') return 'Auction is not live';
    if (!currentPlayer) return 'Waiting for next lot';
    if (currentPlayer.auction_status !== 'CURRENT' || currentPlayer.status !== 'Available') return 'Lot already closed';
    if (teamFull) return 'Squad is full';
    if (alreadyHighest) return 'You are highest bidder';
    if (team && nextBid > team.remaining_budget) return 'Insufficient purse';
    return null;
  })();

  const bidBlockedTone = alreadyHighest
    ? 'success'
    : cannotBidReason?.includes('paused') || cannotBidReason?.includes('not live')
      ? 'warning'
      : cannotBidReason
        ? 'danger'
        : 'neutral';

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
    if (!stored || !currentPlayer) return toast.error('Login as captain to bid.');
    if (cannotBidReason) return toast.error(cannotBidReason);

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

    if (!res.ok) return toast.error(json.error || 'Bid failed');

    playBidAcceptedSound();
    toast.success(`Bid placed: ${formatMoney(json.bid_amount)}`);
    void refresh({ silent: true });
    void loadMine();
  }

  const highestTeam =
    teams.find((item) => item.id === auction?.highest_bidder_team_id) ||
    teams.find((item) => item.team_name === auction?.highest_team_name) ||
    null;

  const { celebration } = usePlayerSoldCelebration({
    events,
    players,
    teams,
    loading,
    fallbackTeam: highestTeam,
  });

  if (loading) {
    return (
      <div data-hide-dock className="px-4 py-6">
        <AuctionPageSkeleton />
      </div>
    );
  }

  const afterBidPreview =
    team && !cannotBidReason
      ? Math.max(0, Number(team.remaining_budget || 0) - nextBid)
      : null;

  return (
    <div data-hide-dock>
      <ReconnectingBanner visible={Boolean(realtimeDisconnected)} />
      <PlayerSoldCelebrationOverlay celebration={celebration} />
      <CoachMarks
        scope="captain"
        tips={[
          {
            id: 'purse-sticky',
            title: 'Your purse stays on top',
            body: 'Remaining budget and squad slots are always visible in the sticky bar — no scrolling needed under pressure.',
          },
          {
            id: 'bid-preview',
            title: 'See the next bid before you hit it',
            body: 'The lot card shows next bid and purse after bid so you never overshoot your budget.',
          },
          {
            id: 'highest',
            title: 'Already highest? Sit tight',
            body: 'When you are the highest bidder the button greys with a clear badge — no accidental re-bids needed.',
          },
        ]}
      />

      {/* Sticky purse strip */}
      <div className="sticky top-[4.5rem] z-40 border-b border-white/10 bg-slate-950/95 px-4 py-2.5 backdrop-blur-xl sm:top-[4.75rem] sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <WalletCards className="h-4 w-4 text-apl-gold" aria-hidden />
              <span className="text-[10px] font-bold uppercase tracking-wide text-white/50">Your franchise purse</span>
              <AuctionStatusBadge status={auction?.auction_status || 'NOT_STARTED'} className="scale-90" />
            </div>
            <PurseBar
              remaining={team?.remaining_budget}
              budget={team?.budget}
              squadCount={bought.length}
              maxPlayers={team?.max_players || 4}
              compact
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <HighestBidderBadge visible={Boolean(alreadyHighest)} teamName={team?.team_name} />
          </div>
        </div>
      </div>

      <main className="section-shell space-y-6 overflow-x-hidden pb-28 sm:pb-10">
        <section className="glass-card p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar src={team?.logo_url} label={captain?.team_name || session?.team_name || 'Team'} size="lg" />

              <div className="min-w-0">
                <StatusBadge tone="gold">Captain auction room</StatusBadge>
                <h1 className="mt-2 break-words text-3xl font-black text-white font-display sm:text-5xl">
                  {captain?.team_name || session?.team_name || 'Your Team'}
                </h1>
                <div className="mt-2 flex items-center gap-2 text-white/65">
                  <Avatar src={captain?.photo_url || team?.captain_photo_url} label={captain?.captain_name || session?.name || 'Captain'} size="xs" />
                  <span>Captain: {captain?.captain_name || session?.name || 'Captain'}</span>
                </div>
              </div>
            </div>

            <button type="button" onClick={() => setSidebarOpen(true)} className="btn-ghost w-full justify-center sm:w-auto sm:shrink-0">
              <Menu className="h-5 w-5" />
              Team
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
            <Avatar src={highestTeam?.logo_url} label={auction?.highest_team_name || 'No bids'} size="sm" />
            <p className="text-sm text-white/65">
              Highest bidder:{' '}
              <span className="font-bold text-white">
                {auction?.highest_team_name
                  ? `${auction.highest_team_name} / ${auction.highest_bidder_captain_name || 'Captain'}`
                  : 'No bids yet'}
              </span>
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <LotCard
            player={currentPlayer}
            currentBid={currentBid}
            highestTeam={auction?.highest_team_name || null}
            flashKey={latestBidId || currentBid}
            auctionStatus={auction?.auction_status}
            nextBid={nextBid}
            emptyTitle="Waiting for admin"
            emptyDescription="No current player on the lot. Bids unlock when the next player is called."
            extraStats={[
              { label: 'Your purse', value: formatMoney(team?.remaining_budget) },
              { label: 'Your squad', value: `${bought.length}/${team?.max_players || 4}` },
            ]}
            footer={
              <div className="space-y-3">
                {alreadyHighest && (
                  <div className="flex justify-center sm:justify-start">
                    <HighestBidderBadge visible teamName={team?.team_name} />
                  </div>
                )}

                {afterBidPreview != null && (
                  <p className="text-center text-xs text-slate-400 sm:text-left">
                    After this bid your purse would be <strong className="text-white">{formatMoney(afterBidPreview)}</strong>
                  </p>
                )}

                {cannotBidReason && !busy && (
                  <div className="hidden sm:flex">
                    <StatusBadge tone={bidBlockedTone === 'success' ? 'success' : bidBlockedTone === 'warning' ? 'warning' : 'danger'}>
                      {cannotBidReason}
                    </StatusBadge>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => void bid()}
                  disabled={Boolean(cannotBidReason) || busy}
                  className={`btn-primary hidden w-full justify-center transition active:scale-[0.98] sm:inline-flex ${
                    busy ? 'opacity-70' : ''
                  } disabled:cursor-not-allowed disabled:opacity-50 ${
                    alreadyHighest ? 'disabled:grayscale-0 border border-emerald-400/30 bg-emerald-500/20 text-emerald-100' : 'disabled:grayscale'
                  }`}
                >
                  <Gavel className="h-5 w-5" />
                  {busy ? 'Bidding…' : alreadyHighest ? 'You are highest bidder' : cannotBidReason ? cannotBidReason : `Bid ${formatMoney(nextBid)}`}
                </button>
              </div>
            }
          />

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

      {/* Mobile sticky bid bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-slate-950/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:hidden">
        <div className="mx-auto flex max-w-lg flex-col gap-2">
          <PurseBar
            remaining={team?.remaining_budget}
            budget={team?.budget}
            squadCount={bought.length}
            maxPlayers={team?.max_players || 4}
            compact
          />
          <div className="flex items-center justify-between text-xs text-white/55">
            <span>
              Next <strong className="text-white">{formatMoney(nextBid)}</strong>
            </span>
            {cannotBidReason && (
              <span className={`font-semibold ${alreadyHighest ? 'text-emerald-300' : 'text-amber-200'}`}>{cannotBidReason}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => void bid()}
            disabled={Boolean(cannotBidReason) || busy || !currentPlayer}
            className={`btn-primary w-full justify-center active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
              alreadyHighest ? 'disabled:grayscale-0 border border-emerald-400/30 bg-emerald-500/20 text-emerald-100' : 'disabled:grayscale'
            }`}
          >
            <Gavel className="h-5 w-5" />
            {busy ? 'Bidding…' : alreadyHighest ? 'Highest bidder' : cannotBidReason ? cannotBidReason : `Bid ${formatMoney(nextBid)}`}
          </button>
        </div>
      </div>
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
  const latestBidId = bids[0]?.id || '';

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
        <AutoScrollList scrollKey={latestBidId} className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
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
        </AutoScrollList>
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


