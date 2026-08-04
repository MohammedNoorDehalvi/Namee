"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Radio, Trophy, Users, WalletCards, Zap } from 'lucide-react';
import { useAuctionRealtime } from '@/hooks/useAuctionRealtime';
import { usePlayerSoldCelebration } from '@/hooks/usePlayerSoldCelebration';
import { PlayerSoldCelebrationOverlay } from '@/components/auction/PlayerSoldCelebrationOverlay';
import { boughtPlayersForTeam, computeTeamSpent } from '@/lib/auction-utils';
import { formatMoney, initials } from '@/lib/format';
import type { Player, Team } from '@/lib/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassCard, GlassButton } from '@/components/ui/liquid-glass';
import { TiltCard } from '@/components/ui/TiltCard';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { ReconnectingBanner } from '@/components/ui/ReconnectingBanner';
import { BidFlash } from '@/components/ui/BidFlash';
import { AutoScrollList } from '@/components/ui/AutoScrollList';
import { AuctionPageSkeleton } from '@/components/ui/AuctionSkeleton';
import { downloadCsv, playBidSound, printSummaryHtml } from '@/lib/auction-ui';

type SaleCelebration = {
  id: string;
  playerName: string;
  teamName: string;
  teamLogo?: string | null;
};

export function LiveAuction({ mode = 'public' }: { mode?: 'public' | 'captain' }) {
  const { auction, currentPlayer, players, teams, bids, events, loading, currentBid, realtimeDisconnected } =
    useAuctionRealtime();

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
  const seenSoldIdsRef = useRef<Set<string>>(new Set());
  const hasPrimedSoldSnapshotRef = useRef(false);
  const prevBidRef = useRef<number | null>(null);
  const latestBidId = bids[0]?.id || '';

  // Bid animation + sound
  useEffect(() => {
    if (prevBidRef.current !== null && currentBid > prevBidRef.current) {
      playBidSound();
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
    <div className="relative space-y-6 sm:space-y-8">
      <ReconnectingBanner visible={Boolean(realtimeDisconnected)} />
      <PlayerSoldCelebrationOverlay celebration={soldCelebration} />

      <GlassCard className="rounded-3xl border-white/15 p-4 sm:p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-300 sm:px-4 sm:py-2 sm:text-xs">
              <Radio size={15} className="animate-pulse text-emerald-400" /> {auction?.auction_status || 'NOT_STARTED'}{' '}
              AUCTION ARENA
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white font-display sm:mt-4 sm:text-4xl md:text-6xl">
              APL Live Auction
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-200 sm:mt-3 sm:text-base">
              Real-time player lot stream, franchise bidding history, purse analytics, and live team squad rosters.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-slate-900/90 p-4 shadow-xl sm:p-5">
            <BidFlash triggerKey={latestBidId || currentBid} />
            <p className="text-xs font-extrabold uppercase tracking-wider text-amber-400">Current Leading Franchise</p>
            <div className="mt-2.5 flex items-center gap-3.5">
              <LogoAvatar src={highestTeam?.logo_url} label={highestTeam?.team_name || 'No bids'} size="md" />
              <div>
                <p className="text-base font-extrabold text-white font-display">
                  {auction?.highest_team_name ? `${auction.highest_team_name}` : 'No bids placed yet'}
                </p>
                <p className="mt-0.5 text-xs font-bold text-amber-300">Highest Bid: {formatMoney(currentBid)}</p>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {auction?.auction_status === 'ENDED' ? (
        <FinalReport
          teams={leaderboard}
          players={soldPlayers}
          unsoldPlayers={unsoldPlayers}
          mostExpensive={mostExpensive}
          bids={bids}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr] lg:gap-8">
          <CurrentPlayerCard
            player={currentPlayer}
            currentBid={currentBid}
            highestTeam={auction?.highest_team_name || null}
            flashKey={latestBidId || currentBid}
          />
          <div className="space-y-5 sm:space-y-6">
            <BudgetPanel teams={teams} players={soldPlayers} />
            <BidHistory bids={bids} teams={teams} />
            <EventPanel events={events} />
            <UnsoldPanel players={unsoldPlayers} />
            {mode === 'public' && (
              <GlassButton
                href="/captain-login"
                variant="emerald"
                className="w-full rounded-full py-4 text-center font-extrabold text-slate-950"
              >
                <span>Captain Login to Place Bids</span>
              </GlassButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CurrentPlayerCard({
  player,
  currentBid,
  highestTeam,
  flashKey,
}: {
  player: Player | null;
  currentBid: number;
  highestTeam: string | null;
  flashKey: string | number;
}) {
  if (!player) {
    return (
      <GlassCard className="flex min-h-[320px] items-center justify-center border-white/15 p-6 text-center sm:min-h-[420px]">
        <EmptyState title="No active player on lot" description="Waiting for administrator to initiate the next player lot." />
      </GlassCard>
    );
  }

  return (
    <TiltCard tiltMaxAngle={8}>
      <SpotlightCard
        spotlightColor="rgba(245, 158, 11, 0.2)"
        className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-slate-900/90 p-5 shadow-2xl sm:rounded-[2.5rem] sm:p-6 md:p-8"
      >
        <BidFlash triggerKey={flashKey} />
        <div className="space-y-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
            <LogoAvatar src={player.photo_url} label={player.name} size="xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                  ACTIVE AUCTION LOT
                </span>
              </div>
              <h2 className="break-words text-3xl font-extrabold text-white font-display sm:text-4xl md:text-6xl">{player.name}</h2>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-300 sm:text-sm">
                {player.role} • Batting: {player.batting_style || 'N/A'} • Bowling: {player.bowling_style || 'N/A'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 sm:gap-4">
            <BigStat label="Base Price" value={formatMoney(player.base_price)} />
            <BigStat label="Current Bid" value={formatMoney(currentBid)} highlighted />
            <BigStat label="Highest Bidder" value={highestTeam || 'No bids yet'} />
            <BigStat label="Lot Status" value={player.auction_status || player.status} />
          </div>
        </div>
      </SpotlightCard>
    </TiltCard>
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
          const remainingPct = Math.min(
            100,
            Math.max(0, (Number(team.remaining_budget || 0) / Number(team.budget || 50000)) * 100),
          );

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

              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                  <span>Purse: {formatMoney(team.remaining_budget)}</span>
                  <span>
                    {bought.length}/{maxP} Squad
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
                    style={{ width: `${remainingPct}%` }}
                  />
                </div>
              </div>
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
