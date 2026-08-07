"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Maximize2, Minimize2, Share2, Trophy, WalletCards, Zap } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useAuctionRealtime } from '@/hooks/useAuctionRealtime';
import { usePlayerSoldCelebration } from '@/hooks/usePlayerSoldCelebration';
import { useSession } from '@/hooks/useSession';
import { PlayerSoldCelebrationOverlay } from '@/components/auction/PlayerSoldCelebrationOverlay';
import { BidControls } from '@/components/auction/BidControls';
import { LotCard } from '@/components/auction/LotCard';
import { TheaterOverlay } from '@/components/auction/TheaterOverlay';
import { boughtPlayersForTeam, computeTeamSpent } from '@/lib/auction-utils';
import { formatMoney, initials } from '@/lib/format';
import type { Auction, Player, Team } from '@/lib/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassCard, GlassButton } from '@/components/ui/liquid-glass';
import { ReconnectingBanner } from '@/components/ui/ReconnectingBanner';
import { BidFlash } from '@/components/ui/BidFlash';
import { AutoScrollList } from '@/components/ui/AutoScrollList';
import { AuctionPageSkeleton } from '@/components/ui/AuctionSkeleton';
import { AuctionStatusBadge, StatusBadge } from '@/components/ui/StatusBadge';
import { PurseBar } from '@/components/ui/PurseBar';
import { downloadCsv, playOutbidSound, printSummaryHtml, shareLotMoment } from '@/lib/auction-ui';

type SaleCelebration = {
  id: string;
  playerName: string;
  teamName: string;
  teamLogo?: string | null;
};

export function LiveAuction({ mode = 'public' }: { mode?: 'public' | 'captain' }) {
  const { auction, currentPlayer, players, teams, bids, events, loading, currentBid, realtimeDisconnected, refresh } =
    useAuctionRealtime();
  const { session } = useSession();
  const searchParams = useSearchParams();
  const isCaptainSession = session?.role === 'captain';

  const soldPlayers = players.filter((player) => player.auction_status === 'SOLD' || player.status === 'Sold');
  const unsoldPlayers = players.filter((player) => player.auction_status === 'UNSOLD' || player.status === 'Unsold');
  const mostExpensive = useMemo(
    () => [...soldPlayers].sort((a, b) => Number(b.sold_price || 0) - Number(a.sold_price || 0))[0] || null,
    [soldPlayers],
  );
  const leaderboard = useMemo(
    () => [...teams].sort((a, b) => computeTeamSpent(soldPlayers, b) - computeTeamSpent(soldPlayers, a)),
    [teams, soldPlayers],
  );
  const highestTeam =
    teams.find((team) => team.id === auction?.highest_bidder_team_id) ||
    teams.find((team) => team.team_name === auction?.highest_team_name) ||
    null;

  const { celebration: soldCelebration } = usePlayerSoldCelebration({
    events,
    players,
    teams,
    loading,
    fallbackTeam: highestTeam,
  });

  const [celebration, setCelebration] = useState<SaleCelebration | null>(null);
  const [celebrationQueue, setCelebrationQueue] = useState<SaleCelebration[]>([]);
  const [theaterMode, setTheaterMode] = useState(false);
  const seenSoldIdsRef = useRef<Set<string>>(new Set());
  const hasPrimedSoldSnapshotRef = useRef(false);
  const prevBidRef = useRef<number | null>(null);
  const latestBidId = bids[0]?.id || '';
  const auctionStatus = auction?.auction_status || 'NOT_STARTED';

  // Deep-link theater: /auction?view=theater
  useEffect(() => {
    if (searchParams?.get('view') === 'theater') {
      setTheaterMode(true);
    }
  }, [searchParams]);

  // Body class for full chrome hide (navbar/footer/dock)
  useEffect(() => {
    document.body.classList.toggle('theater-mode', theaterMode);
    return () => document.body.classList.remove('theater-mode');
  }, [theaterMode]);

  // Sync URL without full navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (theaterMode) url.searchParams.set('view', 'theater');
    else url.searchParams.delete('view');
    window.history.replaceState({}, '', url.toString());
  }, [theaterMode]);

  // Bid rise → outbid tick for spectators / others
  useEffect(() => {
    if (prevBidRef.current !== null && currentBid > prevBidRef.current) {
      playOutbidSound();
    }
    prevBidRef.current = currentBid;
  }, [currentBid]);

  useEffect(() => {
    if (loading) return;

    const currentSoldIds = new Set(soldPlayers.map((player) => player.id));

    if (!hasPrimedSoldSnapshotRef.current) {
      seenSoldIdsRef.current = currentSoldIds;
      hasPrimedSoldSnapshotRef.current = true;
      return;
    }

    const seenSoldIds = seenSoldIdsRef.current;
    const newlySold = soldPlayers.filter((player) => !seenSoldIds.has(player.id));

    seenSoldIdsRef.current = currentSoldIds;

    if (newlySold.length === 0) return;

    const queuedCelebrations = newlySold
      .sort((a, b) => {
        const aTime = new Date(a.updated_at || a.created_at).getTime();
        const bTime = new Date(b.updated_at || b.created_at).getTime();
        return aTime - bTime;
      })
      .map<SaleCelebration>((player) => {
        const matchedTeam =
          teams.find((team) => team.id === player.sold_to_team_id) ||
          teams.find((team) => team.team_name === player.sold_to_team) ||
          highestTeam;

        return {
          id: player.id,
          playerName: player.name,
          teamName: matchedTeam?.team_name || player.sold_to_team || 'Team',
          teamLogo: matchedTeam?.logo_url || null,
        };
      });

    setCelebrationQueue((prev) => [...prev, ...queuedCelebrations]);
  }, [soldPlayers, teams, highestTeam, loading]);

  useEffect(() => {
    if (celebration || celebrationQueue.length === 0) return;

    const [nextCelebration, ...remaining] = celebrationQueue;
    setCelebration(nextCelebration);
    setCelebrationQueue(remaining);

    const timeoutId = window.setTimeout(() => setCelebration(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [celebration, celebrationQueue]);

  if (loading) {
    return <AuctionPageSkeleton />;
  }

  return (
    <div
      className={`relative space-y-6 sm:space-y-8 ${theaterMode ? 'min-h-[80vh] pb-28' : ''}`}
      data-theater={theaterMode ? '1' : undefined}
    >
      <ReconnectingBanner visible={Boolean(realtimeDisconnected) && !theaterMode} />
      <PlayerSoldCelebrationOverlay celebration={soldCelebration} />
      <TheaterOverlay
        active={theaterMode}
        playerName={currentPlayer?.name}
        currentBid={currentBid}
        highestTeam={auction?.highest_team_name}
        auctionStatus={auctionStatus}
      />

      {/* Arena header — compact in theater */}
      <GlassCard className={`rounded-3xl border-white/15 ${theaterMode ? 'p-3 sm:p-4' : 'p-4 sm:p-6 md:p-8'}`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <AuctionStatusBadge status={auctionStatus} />
              <StatusBadge tone="gold">{theaterMode ? 'Stream mode' : 'Auction arena'}</StatusBadge>
            </div>
            {!theaterMode && (
              <>
                <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white font-display sm:mt-4 sm:text-4xl md:text-6xl">
                  APL Live Auction
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 sm:mt-3 sm:text-base">
                  {auctionStatus === 'LIVE'
                    ? 'Bidding is open. Watch the lot, purses, and bid stream update in real time.'
                    : auctionStatus === 'PAUSED'
                      ? 'Auction is paused. Captains cannot place new bids until admin resumes.'
                      : auctionStatus === 'ENDED'
                        ? 'This session has ended. Review the final report below.'
                        : 'Waiting for admin to start the auction.'}
                </p>
              </>
            )}
            {theaterMode && (
              <p className="mt-2 text-sm font-semibold text-slate-300">
                Full-screen stream pack · Captains scan QR to bid
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <button
              type="button"
              onClick={() => setTheaterMode((v) => !v)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-200 transition hover:bg-white/10"
              title={theaterMode ? 'Exit theater mode' : 'Theater mode for projectors / OBS'}
            >
              {theaterMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              {theaterMode ? 'Exit theater' : 'Theater mode'}
            </button>

            {currentPlayer && (
              <button
                type="button"
                onClick={() =>
                  shareLotMoment({
                    playerName: currentPlayer.name,
                    role: currentPlayer.role,
                    currentBid,
                    highestTeam: auction?.highest_team_name,
                    auctionStatus,
                    formatMoney,
                  })
                }
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-amber-200 transition hover:bg-amber-400/20"
              >
                <Share2 className="h-4 w-4" />
                Share lot
              </button>
            )}

            {!theaterMode && (
              <div className="relative min-w-[220px] overflow-hidden rounded-3xl border border-white/15 bg-slate-900/90 p-4 shadow-xl sm:p-5">
                <BidFlash triggerKey={latestBidId || currentBid} />
                <p className="text-xs font-extrabold uppercase tracking-wider text-amber-400">Leading franchise</p>
                <div className="mt-2.5 flex items-center gap-3.5">
                  <LogoAvatar src={highestTeam?.logo_url} label={highestTeam?.team_name || 'No bids'} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-base font-extrabold text-white font-display">
                      {auction?.highest_team_name || 'No bids yet'}
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-amber-300">Highest: {formatMoney(currentBid)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {auctionStatus === 'ENDED' ? (
        <FinalReport
          teams={leaderboard}
          players={soldPlayers}
          unsoldPlayers={unsoldPlayers}
          mostExpensive={mostExpensive}
          bids={bids}
        />
      ) : (
        <div
          className={`grid gap-6 lg:gap-8 ${
            theaterMode ? 'lg:grid-cols-1' : 'lg:grid-cols-[1.35fr_0.9fr]'
          }`}
        >
          <div className="space-y-4">
            <LotCard
              player={currentPlayer}
              currentBid={currentBid}
              highestTeam={auction?.highest_team_name || null}
              flashKey={latestBidId || currentBid}
              auctionStatus={auctionStatus}
              theaterMode={theaterMode}
            />

            {auction && currentPlayer && (mode === 'captain' || isCaptainSession) && (
              <BidControls
                auction={auction as Auction}
                player={currentPlayer}
                currentBid={currentBid}
                onBid={() => void refresh({ silent: true })}
              />
            )}

            {mode === 'public' && !isCaptainSession && (
              <div className="space-y-2">
                <GlassButton
                  href="/captain-login"
                  variant="emerald"
                  className="w-full rounded-full py-4 text-center font-extrabold text-slate-950"
                >
                  <span>Captain login to place bids</span>
                </GlassButton>
                <p className="text-center text-xs text-slate-400">
                  Spectators watch free. Franchise captains bid after signing in.
                </p>
              </div>
            )}
          </div>

          {!theaterMode && (
            <div className="space-y-5 sm:space-y-6">
              <BudgetPanel teams={teams} players={soldPlayers} />
              <BidHistory bids={bids} teams={teams} />
              <EventPanel events={events} />
              <UnsoldPanel players={unsoldPlayers} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BudgetPanel({ teams, players }: { teams: Team[]; players: Player[] }) {
  return (
    <section className="space-y-4 rounded-[1.5rem] border border-white/15 bg-slate-900/80 p-4 shadow-xl backdrop-blur-xl sm:rounded-[2rem] sm:p-6">
      <h3 className="flex items-center gap-2 text-base font-extrabold text-white font-display sm:text-lg">
        <WalletCards size={20} className="text-amber-400" /> Franchise Purses & Squads
      </h3>
      <div className="grid gap-3">
        {teams.length === 0 && (
          <EmptyState title="No teams yet" description="Teams will appear here once the admin creates them." />
        )}
        {teams.map((team) => {
          const bought = boughtPlayersForTeam(players, team);
          const maxP = team.max_players || 4;
          const full = bought.length >= maxP;

          return (
            <div key={team.id} className="space-y-2.5 rounded-2xl border border-white/10 bg-slate-950/70 p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <LogoAvatar src={team.logo_url} label={team.team_name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-white">{team.team_name}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-300">
                    <LogoAvatar src={team.captain_photo_url} label={team.captain_name} size="xs" />
                    <span className="truncate">Captain: {team.captain_name}</span>
                  </div>
                </div>
                {full && (
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/20 px-2.5 py-1 text-[10px] font-extrabold uppercase text-emerald-300">
                    Squad Full
                  </span>
                )}
              </div>

              <PurseBar
                remaining={team.remaining_budget}
                budget={team.budget}
                squadCount={bought.length}
                maxPlayers={maxP}
                compact
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function BidHistory({
  bids,
  teams,
}: {
  bids: { id: string; team_name: string; team_id?: string | null; captain_name?: string | null; bid_amount: number }[];
  teams: Team[];
}) {
  const latestId = bids[0]?.id || '';

  return (
    <section className="space-y-4 rounded-[1.5rem] border border-white/15 bg-slate-900/80 p-4 shadow-xl backdrop-blur-xl sm:rounded-[2rem] sm:p-6">
      <h3 className="flex items-center gap-2 text-base font-extrabold text-white font-display sm:text-lg">
        <Trophy size={20} className="text-amber-400" /> Recent Bids
      </h3>
      <AutoScrollList scrollKey={latestId} className="grid max-h-72 gap-3 overflow-y-auto pr-1">
        {bids.length === 0 && <p className="text-sm text-slate-400">No bids placed in this lot yet.</p>}
        {bids.map((bid, index) => {
          const bidTeam =
            teams.find((team) => team.id === bid.team_id) || teams.find((team) => team.team_name === bid.team_name);

          return (
            <div
              key={bid.id}
              className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition-all ${
                index === 0
                  ? 'border-amber-400/40 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                  : 'border-white/10 bg-slate-950/60 opacity-85'
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <LogoAvatar src={bidTeam?.logo_url} label={bid.team_name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-white">{bid.team_name}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-300">
                    <LogoAvatar
                      src={bidTeam?.captain_photo_url}
                      label={bid.captain_name || bidTeam?.captain_name || 'Captain'}
                      size="xs"
                    />
                    <span className="truncate">{bid.captain_name || bidTeam?.captain_name || 'Captain'}</span>
                  </div>
                </div>
              </div>
              <p className="shrink-0 text-base font-extrabold text-emerald-400 font-display">{formatMoney(bid.bid_amount)}</p>
            </div>
          );
        })}
      </AutoScrollList>
    </section>
  );
}

function EventPanel({ events }: { events: { id: string; message: string; created_at: string }[] }) {
  return (
    <GlassCard className="space-y-4 rounded-3xl border-white/15 p-4 sm:p-6">
      <h3 className="flex items-center gap-2 text-base font-extrabold text-white font-display sm:text-lg">
        <Zap size={20} className="text-cyan-400" /> Auction Event Log
      </h3>
      <div className="grid gap-2.5">
        {events.length === 0 && <p className="text-sm text-slate-400">No auction event logs yet.</p>}
        {events.map((event) => (
          <p
            key={event.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs font-medium leading-relaxed text-slate-200"
          >
            {event.message}
          </p>
        ))}
      </div>
    </GlassCard>
  );
}

function UnsoldPanel({ players }: { players: Player[] }) {
  return (
    <GlassCard className="space-y-4 rounded-3xl border-white/15 p-4 sm:p-6">
      <h3 className="text-base font-extrabold text-white font-display sm:text-lg">Unsold Players</h3>
      <div className="grid gap-2">
        {players.length === 0 && <p className="text-sm text-slate-400">No unsold players in this session.</p>}
        {players.slice(0, 8).map((player) => (
          <div
            key={player.id}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3 text-xs font-semibold text-slate-300"
          >
            <span>
              {player.name} ({player.role})
            </span>
            <span className="font-medium text-slate-400">{formatMoney(player.base_price)}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function FinalReport({
  teams,
  players,
  unsoldPlayers,
  mostExpensive,
  bids,
}: {
  teams: Team[];
  players: Player[];
  unsoldPlayers: Player[];
  mostExpensive: Player | null;
  bids: { team_name: string; bid_amount: number; captain_name?: string | null }[];
}) {
  const totalSold = players.length;
  const totalSpent = players.reduce((sum, p) => sum + Number(p.sold_price || 0), 0);
  const avgPrice = totalSold ? Math.round(totalSpent / totalSold) : 0;

  function exportCsv() {
    downloadCsv(
      'apl-auction-summary.csv',
      ['Team', 'Captain', 'Player', 'Role', 'Sold Price', 'Remaining Budget'],
      teams.flatMap((team) => {
        const bought = boughtPlayersForTeam(players, team);
        if (bought.length === 0) {
          return [[team.team_name, team.captain_name, '', '', '', team.remaining_budget]];
        }
        return bought.map((p) => [
          team.team_name,
          team.captain_name,
          p.name,
          p.role,
          p.sold_price,
          team.remaining_budget,
        ]);
      }),
    );
  }

  function exportPdf() {
    const rows = teams
      .map((team) => {
        const bought = boughtPlayersForTeam(players, team);
        const playersHtml = bought.map((p) => `<tr><td>${p.name}</td><td>${p.role}</td><td>${formatMoney(p.sold_price)}</td></tr>`).join('');
        return `<h2>${team.team_name}</h2><p class="muted">Captain: ${team.captain_name} · Remaining: ${formatMoney(team.remaining_budget)} · Spent: ${formatMoney(computeTeamSpent(players, team))}</p><table><thead><tr><th>Player</th><th>Role</th><th>Price</th></tr></thead><tbody>${playersHtml || '<tr><td colspan="3">No players</td></tr>'}</tbody></table>`;
      })
      .join('');
    printSummaryHtml(
      'APL Auction Final Summary',
      `<p class="muted">Sold: ${totalSold} · Unsold: ${unsoldPlayers.length} · Total spent: ${formatMoney(totalSpent)} · Avg: ${formatMoney(avgPrice)}</p>${rows}`,
    );
  }

  return (
    <div className="space-y-6">
      {/* Simple analytics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <BigStat label="Players Sold" value={totalSold} />
        <BigStat label="Unsold" value={unsoldPlayers.length} />
        <BigStat label="Total Spent" value={formatMoney(totalSpent)} highlighted />
        <BigStat label="Average Price" value={formatMoney(avgPrice)} />
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={exportCsv} className="btn-primary">
          <Download className="h-4 w-4" /> Export Excel (CSV)
        </button>
        <button type="button" onClick={exportPdf} className="btn-ghost">
          <Download className="h-4 w-4" /> Export / Print PDF
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
        <section className="space-y-4">
          {teams.map((team, index) => {
            const bought = boughtPlayersForTeam(players, team);

            return (
              <div
                key={team.id}
                className="space-y-4 rounded-[2rem] border border-white/15 bg-slate-900/90 p-5 shadow-xl backdrop-blur-2xl sm:rounded-[2.5rem] sm:p-6"
              >
                <div className="flex items-center gap-4">
                  <LogoAvatar src={team.logo_url} label={team.team_name} size="md" />
                  <div>
                    <h2 className="text-xl font-extrabold text-white font-display sm:text-2xl">
                      #{index + 1} {team.team_name}
                    </h2>
                    <p className="text-xs font-medium text-slate-300">
                      Captain: {team.captain_name} • Remaining: {formatMoney(team.remaining_budget)}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-extrabold text-emerald-400">Spent Total: {formatMoney(computeTeamSpent(players, team))}</p>
                <div className="grid gap-2">
                  {bought.length === 0 && <p className="text-sm italic text-slate-400">No players bought.</p>}
                  {bought.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-xs"
                    >
                      <span className="font-bold text-white">{player.name}</span>
                      <span className="font-semibold text-amber-300">
                        {player.role} • {formatMoney(player.sold_price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        <section className="space-y-6 rounded-[2rem] border border-white/15 bg-slate-900/90 p-5 shadow-xl backdrop-blur-2xl sm:rounded-[2.5rem] sm:p-6">
          <h3 className="text-xl font-extrabold text-white font-display sm:text-2xl">Auction Final Summary</h3>
          <div className="grid gap-3">
            <BigStat label="Most Expensive Player" value={mostExpensive ? mostExpensive.name : 'None'} />
            <BigStat label="Final Price" value={formatMoney(mostExpensive?.sold_price)} highlighted />
            <BigStat label="Total Bids Placed" value={bids.length} />
          </div>
          <h4 className="pt-2 text-lg font-extrabold text-white font-display">Unsold Roster</h4>
          <div className="grid gap-2">
            {unsoldPlayers.length === 0 && <p className="text-sm italic text-slate-400">No unsold players.</p>}
            {unsoldPlayers.map((player) => (
              <p key={player.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-xs font-medium text-slate-300">
                {player.name} ({player.role})
              </p>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function LogoAvatar({
  src,
  label,
  size = 'md',
}: {
  src?: string | null;
  label: string;
  size?: 'xs' | 'sm' | 'md' | 'xl';
}) {
  const sizes = {
    xs: 'h-6 w-6 rounded-full text-[9px]',
    sm: 'h-9 w-9 rounded-xl text-[10px]',
    md: 'h-12 w-12 rounded-2xl text-xs',
    xl: 'h-28 w-28 rounded-[1.5rem] text-2xl sm:h-36 sm:w-36 sm:rounded-[2rem]',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={label}
        loading="lazy"
        className={`${sizes[size]} shrink-0 border border-white/15 object-cover shadow-lg shadow-black/30`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} flex shrink-0 items-center justify-center border border-amber-400/30 bg-amber-400/15 font-extrabold text-amber-300 shadow-md`}
    >
      {initials(label)}
    </div>
  );
}

function BigStat({ label, value, highlighted }: { label: string; value: React.ReactNode; highlighted?: boolean }) {
  return (
    <div className={`rounded-2xl border p-3 sm:p-4 ${highlighted ? 'border-amber-400/30 bg-amber-500/10' : 'border-white/10 bg-slate-950/60'}`}>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">{label}</p>
      <p className={`text-xl font-extrabold font-display sm:text-2xl ${highlighted ? 'text-amber-300' : 'text-white'}`}>{value}</p>
    </div>
  );
}
