"use client";

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Radio, Trophy, Users, WalletCards } from 'lucide-react';
import { useAuctionRealtime } from '@/hooks/useAuctionRealtime';
import { usePlayerSoldCelebration } from '@/hooks/usePlayerSoldCelebration';
import { PlayerSoldCelebrationOverlay } from '@/components/auction/PlayerSoldCelebrationOverlay';
import { boughtPlayersForTeam, computeTeamSpent } from '@/lib/auction-utils';
import { formatMoney, initials } from '@/lib/format';
import type { Player, Team } from '@/lib/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';

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

  return Array.from({ length: 42 }, (_, index) => ({
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

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-yellow-300">
              <Radio size={15} /> {auction?.auction_status || 'NOT_STARTED'} Auction
            </p>
            <h1 className="mt-4 text-4xl font-black text-white md:text-6xl">APL IPL-Style Live Auction</h1>
            <p className="mt-3 max-w-2xl text-white/60">
              Realtime current player, bids, teams, budgets, events and final squads.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm text-white/45">Highest Bidder</p>
            <div className="mt-2 flex items-center gap-3">
              <LogoAvatar src={highestTeam?.logo_url} label={highestTeam?.team_name || 'No bids'} size="md" />
              <div>
                <p className="font-black text-white">
                  {auction?.highest_team_name
                    ? `${auction.highest_team_name} / ${auction.highest_bidder_captain_name || 'Captain'}`
                    : 'No bids yet'}
                </p>
                <p className="text-sm text-white/50">Current bid: {formatMoney(currentBid)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

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
              <Link
                href="/captain"
                className="block rounded-full bg-gradient-to-r from-yellow-300 to-green-400 px-6 py-4 text-center font-black text-black shadow-lg shadow-green-500/20"
              >
                Captain Login to Bid
              </Link>
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
      <div className="flex min-h-[420px] items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center shadow-2xl backdrop-blur">
        <EmptyState title="No current player" description="Waiting for admin to select the next player." />
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur">
      <div className="p-6 md:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <LogoAvatar src={player.photo_url} label={player.name} size="xl" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black uppercase tracking-wider text-green-300">Current Player</p>
            <h2 className="mt-2 break-words text-4xl font-black text-white md:text-6xl">{player.name}</h2>
            <p className="mt-3 text-white/60">
              {player.role} • Batting: {player.batting_style} • Bowling: {player.bowling_style}
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <BigStat label="Base Price" value={formatMoney(player.base_price)} />
          <BigStat label="Current Bid" value={formatMoney(currentBid)} highlighted />
          <BigStat label="Highest Bidder" value={highestTeam || 'No bids'} />
          <BigStat label="Status" value={player.auction_status || player.status} />
        </div>
      </div>
    </section>
  );
}

function BudgetPanel({ teams, players }: { teams: Team[]; players: Player[] }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
      <h3 className="flex items-center gap-2 font-black text-white">
        <WalletCards size={18} className="text-yellow-300" /> Teams & Points
      </h3>
      <div className="mt-4 grid gap-3">
        {teams.length === 0 && <p className="text-sm text-white/50">No teams created yet.</p>}
        {teams.map((team) => {
          const bought = boughtPlayersForTeam(players, team);
          const full = bought.length >= (team.max_players || 4);

          return (
            <div key={team.id} className="rounded-2xl border border-white/10 bg-black/15 p-3">
              <div className="flex items-center gap-3">
                <LogoAvatar src={team.logo_url} label={team.team_name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-white">{team.team_name}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-white/50">
                    <LogoAvatar src={team.captain_photo_url} label={team.captain_name} size="xs" />
                    <span className="truncate">Captain: {team.captain_name}</span>
                  </div>
                </div>
                {full && (
                  <span className="rounded-full bg-green-300 px-2 py-1 text-[10px] font-black text-black">Team Full</span>
                )}
              </div>
              <p className="mt-2 text-xs text-white/55">
                Remaining {formatMoney(team.remaining_budget)} • {bought.length}/{team.max_players || 4} players
              </p>
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
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
      <h3 className="flex items-center gap-2 font-black text-white">
        <Trophy size={18} className="text-yellow-300" /> Last 10 Bids
      </h3>
      <div className="mt-4 grid gap-3">
        {bids.length === 0 && <p className="text-sm text-white/50">No bids yet.</p>}
        {bids.map((bid) => {
          const bidTeam = teams.find((team) => team.id === bid.team_id) || teams.find((team) => team.team_name === bid.team_name);

          return (
            <div key={bid.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/15 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <LogoAvatar src={bidTeam?.logo_url} label={bid.team_name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate font-bold text-white">{bid.team_name}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-white/50">
                    <LogoAvatar src={bidTeam?.captain_photo_url} label={bid.captain_name || bidTeam?.captain_name || 'Captain'} size="xs" />
                    <span className="truncate">{bid.captain_name || bidTeam?.captain_name || 'Captain'}</span>
                  </div>
                </div>
              </div>
              <p className="shrink-0 font-black text-green-300">{formatMoney(bid.bid_amount)}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EventPanel({ events }: { events: { id: string; message: string; created_at: string }[] }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
      <h3 className="flex items-center gap-2 font-black text-white">
        <Users size={18} className="text-green-300" /> Live Messages
      </h3>
      <div className="mt-4 grid gap-2">
        {events.length === 0 && <p className="text-sm text-white/50">No auction messages yet.</p>}
        {events.map((event) => (
          <p key={event.id} className="rounded-2xl bg-black/15 p-3 text-sm text-white/65">
            {event.message}
          </p>
        ))}
      </div>
    </section>
  );
}

function UnsoldPanel({ players }: { players: Player[] }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
      <h3 className="font-black text-white">Unsold Players</h3>
      <div className="mt-4 grid gap-2">
        {players.length === 0 && <p className="text-sm text-white/50">No unsold players yet.</p>}
        {players.slice(0, 8).map((player) => (
          <p key={player.id} className="rounded-2xl bg-black/15 p-3 text-sm text-white/65">
            {player.name}
          </p>
        ))}
      </div>
    </section>
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
            <div key={team.id} className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <LogoAvatar src={team.logo_url} label={team.team_name} size="md" />
                <div>
                  <h2 className="text-2xl font-black text-white">
                    #{index + 1} {team.team_name}
                  </h2>
                  <p className="text-white/55">
                    Captain: {team.captain_name} • Remaining: {formatMoney(team.remaining_budget)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm font-bold text-green-300">Spent {formatMoney(computeTeamSpent(players, team))}</p>
              <div className="mt-3 grid gap-2">
                {bought.length === 0 && <p className="text-sm text-white/50">No players bought.</p>}
                {bought.map((player) => (
                  <div key={player.id} className="flex items-center justify-between rounded-2xl bg-black/15 p-3">
                    <span className="text-white">{player.name}</span>
                    <span className="text-white/55">
                      {player.role} • {formatMoney(player.sold_price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
        <h3 className="text-2xl font-black text-white">Auction Summary</h3>
        <div className="mt-5 grid gap-3">
          <BigStat label="Most Expensive Player" value={mostExpensive ? mostExpensive.name : 'None'} />
          <BigStat label="Price" value={formatMoney(mostExpensive?.sold_price)} highlighted />
        </div>
        <h4 className="mt-6 font-black text-white">Unsold Players</h4>
        <div className="mt-3 grid gap-2">
          {unsoldPlayers.length === 0 && <p className="text-sm text-white/50">No unsold players.</p>}
          {unsoldPlayers.map((player) => (
            <p key={player.id} className="rounded-2xl bg-black/15 p-3 text-sm text-white/65">
              {player.name}
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
        className={`${sizes[size]} shrink-0 border border-white/10 object-cover shadow-lg shadow-black/30`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} flex shrink-0 items-center justify-center border border-yellow-300/20 bg-yellow-300/15 font-black text-yellow-300`}
    >
      {initials(label)}
    </div>
  );
}

function BigStat({ label, value, highlighted }: { label: string; value: React.ReactNode; highlighted?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlighted ? 'border-green-300/30 bg-green-300/10' : 'border-white/10 bg-black/15'}`}>
      <p className="text-sm text-white/45">{label}</p>
      <p className={`mt-1 text-2xl font-black ${highlighted ? 'text-green-300' : 'text-white'}`}>{value}</p>
    </div>
  );
}
