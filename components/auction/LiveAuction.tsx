"use client";

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Radio, Trophy, Users, WalletCards, Zap } from 'lucide-react';
import { useAuctionRealtime } from '@/hooks/useAuctionRealtime';
import { usePlayerSoldCelebration } from '@/hooks/usePlayerSoldCelebration';
import { PlayerSoldCelebrationOverlay } from '@/components/auction/PlayerSoldCelebrationOverlay';
import { boughtPlayersForTeam, computeTeamSpent } from '@/lib/auction-utils';
import { formatMoney, initials } from '@/lib/format';
import type { Player, Team } from '@/lib/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassCard, GlassButton } from '@/components/ui/liquid-glass';
import { TiltCard } from '@/components/ui/TiltCard';
import { SpotlightCard } from '@/components/ui/SpotlightCard';

type SaleCelebration = {
  id: string;
  playerName: string;
  teamName: string;
  teamLogo?: string | null;
};

type CelebrationParticle = {
  id: string;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  rotate: number;
  color: string;
};

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

function createCelebrationParticles(seed: string): CelebrationParticle[] {
  const random = mulberry32(hashString(seed));

  const colors = [
    'linear-gradient(135deg, rgba(255,221,87,1), rgba(255,255,255,1))',
    'linear-gradient(135deg, rgba(74,222,128,1), rgba(255,255,255,1))',
    'linear-gradient(135deg, rgba(96,165,250,1), rgba(255,255,255,1))',
    'linear-gradient(135deg, rgba(244,114,182,1), rgba(255,255,255,1))',
    'linear-gradient(135deg, rgba(251,146,60,1), rgba(255,255,255,1))',
    'linear-gradient(135deg, rgba(167,139,250,1), rgba(255,255,255,1))',
  ];

  return Array.from({ length: 72 }, (_, index) => ({
    id: `${seed}-${index}`,
    left: random() * 100,
    top: -12 - random() * 20,
    size: 6 + random() * 10,
    duration: 2.2 + random() * 1.4,
    delay: random() * 0.55,
    drift: (random() - 0.5) * 260,
    rotate: 180 + random() * 540,
    color: colors[index % colors.length],
  }));
}

function mulberry32(seed: number) {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function LiveAuction({ mode = 'public' }: { mode?: 'public' | 'captain' }) {
  const { auction, currentPlayer, players, teams, bids, events, loading, currentBid } = useAuctionRealtime();

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

  const celebrationParticles = useMemo(
    () => (celebration ? createCelebrationParticles(celebration.id) : []),
    [celebration],
  );

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
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading live auction..." />
      </div>
    );
  }

  return (
    <div className="relative space-y-8">
      <PlayerSoldCelebrationOverlay celebration={soldCelebration} />

      <GlassCard className="p-6 md:p-8 rounded-3xl border-white/15">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-400/20 border border-emerald-400/30 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-300">
              <Radio size={15} className="animate-pulse text-emerald-400" /> {auction?.auction_status || 'NOT_STARTED'} AUCTION ARENA
            </p>
            <h1 className="mt-4 text-4xl font-extrabold text-white md:text-6xl font-display tracking-tight">APL Live Auction</h1>
            <p className="mt-3 max-w-2xl text-slate-200 text-sm md:text-base leading-relaxed">
              Real-time player lot stream, franchise bidding history, purse analytics, and live team squad rosters.
            </p>
          </div>

          <div className="rounded-3xl bg-slate-900/90 p-5 border border-white/15 shadow-xl">
            <p className="text-xs uppercase font-extrabold tracking-wider text-amber-400">Current Leading Franchise</p>
            <div className="mt-2.5 flex items-center gap-3.5">
              <LogoAvatar src={highestTeam?.logo_url} label={highestTeam?.team_name || 'No bids'} size="md" />
              <div>
                <p className="font-extrabold text-white text-base font-display">
                  {auction?.highest_team_name
                    ? `${auction.highest_team_name}`
                    : 'No bids placed yet'}
                </p>
                <p className="text-xs text-amber-300 font-bold mt-0.5">Highest Bid: {formatMoney(currentBid)}</p>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {auction?.auction_status === 'ENDED' ? (
        <FinalReport teams={leaderboard} players={soldPlayers} unsoldPlayers={unsoldPlayers} mostExpensive={mostExpensive} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.9fr]">
          <CurrentPlayerCard player={currentPlayer} currentBid={currentBid} highestTeam={auction?.highest_team_name || null} />
          <div className="space-y-6">
            <BudgetPanel teams={teams} players={soldPlayers} />
            <BidHistory bids={bids} teams={teams} />
            <EventPanel events={events} />
            <UnsoldPanel players={unsoldPlayers} />
            {mode === 'public' && (
              <GlassButton
                href="/captain-login"
                variant="emerald"
                className="w-full py-4 text-center font-extrabold text-slate-950 rounded-full"
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
}: {
  player: Player | null;
  currentBid: number;
  highestTeam: string | null;
}) {
  if (!player) {
    return (
      <GlassCard className="flex min-h-[420px] items-center justify-center p-6 text-center border-white/15">
        <EmptyState title="No active player on lot" description="Waiting for administrator to initiate the next player lot." />
      </GlassCard>
    );
  }

  return (
    <TiltCard tiltMaxAngle={8}>
      <SpotlightCard spotlightColor="rgba(245, 158, 11, 0.2)" className="overflow-hidden p-6 md:p-8 rounded-[2.5rem] border border-white/15 bg-slate-900/90 shadow-2xl">
        <div className="space-y-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <LogoAvatar src={player.photo_url} label={player.name} size="xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
                  ACTIVE AUCTION LOT
                </span>
              </div>
              <h2 className="break-words text-4xl font-extrabold text-white md:text-6xl font-display">{player.name}</h2>
              <p className="text-sm font-semibold text-amber-300 uppercase tracking-wider">
                {player.role} • Batting: {player.batting_style || 'N/A'} • Bowling: {player.bowling_style || 'N/A'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
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
    <section className="rounded-[2rem] border border-white/15 bg-slate-900/80 p-6 backdrop-blur-xl space-y-4 shadow-xl">
      <h3 className="flex items-center gap-2 font-extrabold text-white font-display text-lg">
        <WalletCards size={20} className="text-amber-400" /> Franchise Purses & Squads
      </h3>
      <div className="grid gap-3">
        {teams.length === 0 && <p className="text-sm text-slate-400">No teams created yet.</p>}
        {teams.map((team) => {
          const bought = boughtPlayersForTeam(players, team);
          const maxP = team.max_players || 4;
          const full = bought.length >= maxP;
          const remainingPct = Math.min(100, Math.max(0, (Number(team.remaining_budget || 0) / Number(team.budget || 50000)) * 100));

          return (
            <div key={team.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 space-y-2.5">
              <div className="flex items-center gap-3">
                <LogoAvatar src={team.logo_url} label={team.team_name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-extrabold text-white text-sm">{team.team_name}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-300">
                    <LogoAvatar src={team.captain_photo_url} label={team.captain_name} size="xs" />
                    <span className="truncate">Captain: {team.captain_name}</span>
                  </div>
                </div>
                {full && (
                  <span className="rounded-full bg-emerald-400/20 border border-emerald-400/30 px-2.5 py-1 text-[10px] font-extrabold text-emerald-300 uppercase">
                    Squad Full
                  </span>
                )}
              </div>

              {/* Purse meter bar */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                  <span>Purse: {formatMoney(team.remaining_budget)}</span>
                  <span>{bought.length}/{maxP} Squad</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
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
  return (
    <section className="rounded-[2rem] border border-white/15 bg-slate-900/80 p-6 backdrop-blur-xl space-y-4 shadow-xl">
      <h3 className="flex items-center gap-2 font-extrabold text-white font-display text-lg">
        <Trophy size={20} className="text-amber-400" /> Recent Bids
      </h3>
      <div className="grid gap-3">
        {bids.length === 0 && <p className="text-sm text-slate-400">No bids placed in this lot yet.</p>}
        {bids.map((bid, index) => {
          const bidTeam = teams.find((team) => team.id === bid.team_id) || teams.find((team) => team.team_name === bid.team_name);

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
                  <p className="truncate font-extrabold text-white text-sm">{bid.team_name}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-300">
                    <LogoAvatar src={bidTeam?.captain_photo_url} label={bid.captain_name || bidTeam?.captain_name || 'Captain'} size="xs" />
                    <span className="truncate">{bid.captain_name || bidTeam?.captain_name || 'Captain'}</span>
                  </div>
                </div>
              </div>
              <p className="shrink-0 font-extrabold text-emerald-400 text-base font-display">{formatMoney(bid.bid_amount)}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EventPanel({ events }: { events: { id: string; message: string; created_at: string }[] }) {
  return (
    <GlassCard className="p-6 rounded-3xl space-y-4 border-white/15">
      <h3 className="flex items-center gap-2 font-extrabold text-white font-display text-lg">
        <Zap size={20} className="text-cyan-400" /> Auction Event Log
      </h3>
      <div className="grid gap-2.5">
        {events.length === 0 && <p className="text-sm text-slate-400">No auction event logs yet.</p>}
        {events.map((event) => (
          <p key={event.id} className="rounded-2xl bg-white/5 border border-white/10 p-3 text-xs text-slate-200 leading-relaxed font-medium">
            {event.message}
          </p>
        ))}
      </div>
    </GlassCard>
  );
}

function UnsoldPanel({ players }: { players: Player[] }) {
  return (
    <GlassCard className="p-6 rounded-3xl space-y-4 border-white/15">
      <h3 className="font-extrabold text-white font-display text-lg">Unsold Players</h3>
      <div className="grid gap-2">
        {players.length === 0 && <p className="text-sm text-slate-400">No unsold players in this session.</p>}
        {players.slice(0, 8).map((player) => (
          <div key={player.id} className="rounded-2xl bg-white/5 border border-white/10 p-3 text-xs text-slate-300 font-semibold flex items-center justify-between">
            <span>{player.name} ({player.role})</span>
            <span className="text-slate-400 font-medium">{formatMoney(player.base_price)}</span>
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
}: {
  teams: Team[];
  players: Player[];
  unsoldPlayers: Player[];
  mostExpensive: Player | null;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
      <section className="space-y-4">
        {teams.map((team, index) => {
          const bought = boughtPlayersForTeam(players, team);

          return (
            <div key={team.id} className="rounded-[2.5rem] border border-white/15 bg-slate-900/90 p-6 backdrop-blur-2xl space-y-4 shadow-xl">
              <div className="flex items-center gap-4">
                <LogoAvatar src={team.logo_url} label={team.team_name} size="md" />
                <div>
                  <h2 className="text-2xl font-extrabold text-white font-display">
                    #{index + 1} {team.team_name}
                  </h2>
                  <p className="text-xs text-slate-300 font-medium">
                    Captain: {team.captain_name} • Remaining: {formatMoney(team.remaining_budget)}
                  </p>
                </div>
              </div>
              <p className="text-sm font-extrabold text-emerald-400">Spent Total: {formatMoney(computeTeamSpent(players, team))}</p>
              <div className="grid gap-2">
                {bought.length === 0 && <p className="text-sm text-slate-400 italic">No players bought.</p>}
                {bought.map((player) => (
                  <div key={player.id} className="flex items-center justify-between rounded-2xl bg-slate-950/70 border border-white/10 p-3 text-xs">
                    <span className="font-bold text-white">{player.name}</span>
                    <span className="text-amber-300 font-semibold">
                      {player.role} • {formatMoney(player.sold_price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <section className="rounded-[2.5rem] border border-white/15 bg-slate-900/90 p-6 backdrop-blur-2xl space-y-6 shadow-xl">
        <h3 className="text-2xl font-extrabold text-white font-display">Auction Final Summary</h3>
        <div className="grid gap-3">
          <BigStat label="Most Expensive Player" value={mostExpensive ? mostExpensive.name : 'None'} />
          <BigStat label="Final Price" value={formatMoney(mostExpensive?.sold_price)} highlighted />
        </div>
        <h4 className="font-extrabold text-white font-display text-lg pt-2">Unsold Roster</h4>
        <div className="grid gap-2">
          {unsoldPlayers.length === 0 && <p className="text-sm text-slate-400 italic">No unsold players.</p>}
          {unsoldPlayers.map((player) => (
            <p key={player.id} className="rounded-2xl bg-slate-950/70 border border-white/10 p-3 text-xs text-slate-300 font-medium">
              {player.name} ({player.role})
            </p>
          ))}
        </div>
      </section>
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
    xl: 'h-36 w-36 rounded-[2rem] text-2xl',
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
    <div className={`rounded-2xl border p-4 ${highlighted ? 'border-amber-400/30 bg-amber-500/10' : 'border-white/10 bg-slate-950/60'}`}>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-extrabold font-display ${highlighted ? 'text-amber-300' : 'text-white'}`}>{value}</p>
    </div>
  );
}
