"use client";

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { BadgeDollarSign, Radio, Trophy, Users, WalletCards } from 'lucide-react';
import { useAuctionRealtime } from '@/hooks/useAuctionRealtime';
import { boughtPlayersForTeam, computeTeamSpent } from '@/lib/auction-utils';
import { formatMoney, initials } from '@/lib/format';
import type { Bid, Player, Team } from '@/lib/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';

export function LiveAuction({ mode = 'public' }: { mode?: 'public' | 'captain' }) {
  const { auction, currentPlayer, players, teams, bids, events, loading, currentBid } = useAuctionRealtime({ pollMs: 700 });

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

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading live auction..." />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <section className="glass-card relative overflow-hidden rounded-[2.3rem] p-5 sm:p-7 lg:p-8">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-green-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="badge border-yellow-300/25 bg-yellow-300/10 text-yellow-200">
              <Radio size={15} /> {auction?.auction_status || 'NOT_STARTED'} Auction
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-6xl">APL Live Auction</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
              Realtime current player, bid history, team budgets, captain photos, logos and final team-wise squads.
            </p>
          </div>

          <div className="rounded-[1.6rem] border border-white/10 bg-black/22 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/45">Highest Bidder</p>
            <div className="mt-3 flex items-center gap-3">
              <Avatar src={highestTeam?.logo_url} label={highestTeam?.team_name || 'No bids'} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-black text-white">
                  {auction?.highest_team_name
                    ? `${auction.highest_team_name} / ${auction.highest_bidder_captain_name || 'Captain'}`
                    : 'No bids yet'}
                </p>
                <p className="mt-1 text-sm text-green-300">Current bid: {formatMoney(currentBid)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {auction?.auction_status === 'ENDED' ? (
        <FinalReport teams={leaderboard} players={soldPlayers} unsoldPlayers={unsoldPlayers} mostExpensive={mostExpensive} />
      ) : (
        <div className="grid gap-7 xl:grid-cols-[1.35fr_0.85fr]">
          <CurrentPlayerCard player={currentPlayer} currentBid={currentBid} highestTeam={highestTeam} auctionStatus={auction?.auction_status || 'NOT_STARTED'} />

          <div className="grid gap-5">
            <BudgetPanel teams={teams} players={soldPlayers} />
            <BidHistory bids={bids} teams={teams} />
            <EventPanel events={events} />
            <UnsoldPanel players={unsoldPlayers} />

            {mode === 'public' && (
              <Link href="/captain-login" className="btn-primary w-full">
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
  auctionStatus,
}: {
  player: Player | null;
  currentBid: number;
  highestTeam: Team | null;
  auctionStatus: string;
}) {
  if (!player) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-[2.3rem] border border-white/10 bg-white/[0.055] p-6 text-center shadow-2xl backdrop-blur">
        <EmptyState title="No current player" description="Waiting for admin to select the next player." />
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-[2.3rem] border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur">
      <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative min-h-[320px] bg-black/20">
          {player.photo_url ? (
            <img src={player.photo_url} alt={player.name} loading="lazy" className="h-full min-h-[320px] w-full object-cover" />
          ) : (
            <div className="grid h-full min-h-[320px] place-items-center bg-gradient-to-br from-yellow-300/15 via-white/5 to-green-300/15">
              <span className="text-6xl font-black text-yellow-300">{initials(player.name)}</span>
            </div>
          )}
          <span className="absolute left-4 top-4 rounded-full border border-green-300/25 bg-green-300/12 px-3 py-1 text-xs font-black uppercase tracking-wider text-green-200">
            {auctionStatus}
          </span>
        </div>

        <div className="p-5 sm:p-7 lg:p-8">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-green-300">Current Auction Player</p>
          <h2 className="mt-3 break-words text-4xl font-black tracking-tight text-white sm:text-6xl">{player.name}</h2>
          <p className="mt-3 text-sm leading-6 text-white/60 sm:text-base">
            {player.role} • Batting: {player.batting_style} • Bowling: {player.bowling_style}
          </p>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <BigStat label="Base Price" value={formatMoney(player.base_price)} />
            <BigStat label="Current Bid" value={formatMoney(currentBid)} highlighted />
            <BigStat label="Highest Team" value={highestTeam?.team_name || 'No bids'} />
            <BigStat label="Status" value={player.auction_status || player.status} />
          </div>
        </div>
      </div>
    </section>
  );
}

function BudgetPanel({ teams, players }: { teams: Team[]; players: Player[] }) {
  return (
    <Panel title="Teams & Points" icon={<WalletCards size={18} className="text-yellow-300" />}>
      <div className="grid gap-3">
        {teams.length === 0 && <p className="text-sm text-white/50">No teams created yet.</p>}

        {teams.map((team) => {
          const bought = boughtPlayersForTeam(players, team);
          const full = bought.length >= (team.max_players || 4);

          return (
            <div key={team.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center gap-3">
                <Avatar src={team.logo_url} label={team.team_name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-white">{team.team_name}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-white/50">
                    <Avatar src={team.captain_photo_url} label={team.captain_name} size="xs" />
                    <span className="truncate">Captain: {team.captain_name}</span>
                  </div>
                </div>
                {full && <span className="rounded-full bg-green-300 px-2 py-1 text-[10px] font-black text-black">Full</span>}
              </div>
              <p className="mt-3 text-xs text-white/55">
                Remaining {formatMoney(team.remaining_budget)} • {bought.length}/{team.max_players || 4} players
              </p>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function BidHistory({ bids, teams }: { bids: Bid[]; teams: Team[] }) {
  return (
    <Panel title="Last 10 Bids" icon={<Trophy size={18} className="text-yellow-300" />}>
      <div className="grid gap-3">
        {bids.length === 0 && <p className="text-sm text-white/50">No bids yet.</p>}

        {bids.map((bid) => {
          const bidTeam = teams.find((team) => team.id === bid.team_id) || teams.find((team) => team.team_name === bid.team_name);
          const captainName = bid.captain_name || bidTeam?.captain_name || 'Captain';

          return (
            <div key={bid.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar src={bidTeam?.logo_url} label={bid.team_name} size="md" />
                <div className="min-w-0">
                  <p className="truncate font-bold text-white">{bid.team_name}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-white/50">
                    <Avatar src={bidTeam?.captain_photo_url} label={captainName} size="xs" />
                    <span className="truncate">{captainName}</span>
                  </div>
                </div>
              </div>
              <p className="shrink-0 text-lg font-black text-green-300">{formatMoney(bid.bid_amount)}</p>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function EventPanel({ events }: { events: { id: string; message: string }[] }) {
  return (
    <Panel title="Live Messages" icon={<Users size={18} className="text-green-300" />}>
      <div className="grid max-h-64 gap-2 overflow-y-auto pr-1 soft-scrollbar">
        {events.length === 0 && <p className="text-sm text-white/50">No auction messages yet.</p>}
        {events.map((event) => (
          <p key={event.id} className="rounded-2xl bg-black/20 p-3 text-sm leading-5 text-white/65">
            {event.message}
          </p>
        ))}
      </div>
    </Panel>
  );
}

function UnsoldPanel({ players }: { players: Player[] }) {
  return (
    <Panel title="Unsold Players" icon={<BadgeDollarSign size={18} className="text-red-200" />}>
      <div className="grid gap-2">
        {players.length === 0 && <p className="text-sm text-white/50">No unsold players yet.</p>}
        {players.slice(0, 8).map((player) => (
          <p key={player.id} className="rounded-2xl bg-black/20 p-3 text-sm text-white/65">
            {player.name}
          </p>
        ))}
      </div>
    </Panel>
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
    <div className="grid gap-7 lg:grid-cols-[1fr_0.75fr]">
      <section className="grid gap-4">
        {teams.map((team, index) => {
          const bought = boughtPlayersForTeam(players, team);

          return (
            <article key={team.id} className="premium-card rounded-[2rem] p-5">
              <div className="flex items-center gap-3">
                <Avatar src={team.logo_url} label={team.team_name} size="lg" />
                <div className="min-w-0">
                  <h2 className="truncate text-2xl font-black text-white">
                    #{index + 1} {team.team_name}
                  </h2>
                  <p className="mt-1 text-sm text-white/55">
                    Captain: {team.captain_name} • Remaining: {formatMoney(team.remaining_budget)}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm font-bold text-green-300">Spent {formatMoney(computeTeamSpent(players, team))}</p>

              <div className="mt-4 grid gap-2">
                {bought.length === 0 && <p className="text-sm text-white/50">No players bought.</p>}
                {bought.map((player) => (
                  <div key={player.id} className="flex items-center justify-between gap-3 rounded-2xl bg-black/20 p-3">
                    <span className="min-w-0 truncate text-white">{player.name}</span>
                    <span className="shrink-0 text-sm text-white/55">
                      {player.role} • {formatMoney(player.sold_price)}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </section>

      <section className="premium-card rounded-[2rem] p-5">
        <h3 className="text-2xl font-black text-white">Auction Summary</h3>
        <div className="mt-5 grid gap-3">
          <BigStat label="Most Expensive Player" value={mostExpensive ? mostExpensive.name : 'None'} />
          <BigStat label="Price" value={formatMoney(mostExpensive?.sold_price)} highlighted />
        </div>

        <h4 className="mt-6 font-black text-white">Unsold Players</h4>
        <div className="mt-3 grid gap-2">
          {unsoldPlayers.length === 0 && <p className="text-sm text-white/50">No unsold players.</p>}
          {unsoldPlayers.map((player) => (
            <p key={player.id} className="rounded-2xl bg-black/20 p-3 text-sm text-white/65">
              {player.name}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="premium-card rounded-[1.8rem] p-5">
      <h3 className="mb-4 flex items-center gap-2 font-black text-white">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function Avatar({ src, label, size = 'md' }: { src?: string | null; label: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizes = {
    xs: 'h-6 w-6 rounded-full text-[9px]',
    sm: 'h-9 w-9 rounded-xl text-[10px]',
    md: 'h-12 w-12 rounded-2xl text-xs',
    lg: 'h-14 w-14 rounded-2xl text-sm',
    xl: 'h-36 w-36 rounded-[2rem] text-2xl',
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

function BigStat({ label, value, highlighted }: { label: string; value: ReactNode; highlighted?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlighted ? 'border-green-300/30 bg-green-300/10' : 'border-white/10 bg-black/20'}`}>
      <p className="text-sm text-white/45">{label}</p>
      <p className={`mt-1 break-words text-2xl font-black ${highlighted ? 'text-green-300' : 'text-white'}`}>{value}</p>
    </div>
  );
}
