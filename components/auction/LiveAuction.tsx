"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Radio, Shield, Trophy, Users, WalletCards } from 'lucide-react';
import { useAuctionRealtime } from '@/hooks/useAuctionRealtime';
import { boughtPlayersForTeam, computeTeamSpent } from '@/lib/auction-utils';
import { formatMoney, initials } from '@/lib/format';
import type { Bid, Player, Team } from '@/lib/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';

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

  if (loading) {
    return (
      <div className="section-shell flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading live auction..." />
      </div>
    );
  }

  return (
    <main className="section-shell space-y-8">
      <section className="glass-card relative overflow-hidden p-6 sm:p-8">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-apl-green/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-apl-gold/25 bg-apl-gold/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-apl-gold">
              <Radio className="h-4 w-4" />
              {auction?.auction_status || 'NOT_STARTED'} Auction
            </p>
            <h1 className="mt-4 text-4xl font-black text-white sm:text-6xl">APL IPL-Style Live Auction</h1>
            <p className="mt-3 max-w-2xl text-white/65">
              Realtime current player, team logos, captain photos, highest bidder, bids, budgets and final squads.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
            <p className="text-sm text-white/50">Highest Bidder</p>
            <div className="mt-2 flex items-center gap-3">
              <Avatar src={highestTeam?.logo_url} label={auction?.highest_team_name || 'No bids'} size="md" />
              <div>
                <p className="font-black text-white">
                  {auction?.highest_team_name
                    ? `${auction.highest_team_name} / ${auction.highest_bidder_captain_name || 'Captain'}`
                    : 'No bids yet'}
                </p>
                <p className="text-sm text-apl-gold">Current bid: {formatMoney(currentBid)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {auction?.auction_status === 'ENDED' ? (
        <FinalReport teams={leaderboard} players={soldPlayers} unsoldPlayers={unsoldPlayers} mostExpensive={mostExpensive} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <CurrentPlayerCard player={currentPlayer} currentBid={currentBid} highestTeam={auction?.highest_team_name || null} />
          <div className="space-y-6">
            <BudgetPanel teams={teams} players={players} />
            <BidHistory bids={bids} teams={teams} />
            <EventPanel events={events} />
            <UnsoldPanel players={unsoldPlayers} />
          </div>
        </div>
      )}

      {mode === 'public' && auction?.auction_status !== 'ENDED' && (
        <Link href="/captain-login" className="btn-primary mx-auto flex max-w-xl justify-center">
          Captain Login to Bid
        </Link>
      )}
    </main>
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
      <div className="glass-card flex min-h-[420px] items-center justify-center p-8">
        <EmptyState title="No current player selected" description="Admin will select the first player or next random player." />
      </div>
    );
  }

  return (
    <article className="glass-card overflow-hidden p-5 sm:p-7">
      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <div className="aspect-square overflow-hidden rounded-[2rem] border border-white/10 bg-black/30">
          {player.photo_url ? (
            <img
              src={player.photo_url}
              alt={player.name}
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-5xl font-black text-apl-gold">{initials(player.name)}</div>
          )}
        </div>

        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-apl-gold">Current Player</p>
          <h2 className="mt-2 text-4xl font-black text-white sm:text-6xl">{player.name}</h2>
          <p className="mt-2 text-white/60">
            {player.role} • Batting: {player.batting_style} • Bowling: {player.bowling_style}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <BigStat label="Base Price" value={formatMoney(player.base_price)} />
            <BigStat label="Current Bid" value={formatMoney(currentBid)} highlighted />
            <BigStat label="Highest Team" value={highestTeam || 'No bids yet'} />
            <BigStat label="Status" value={player.auction_status || player.status} />
          </div>
        </div>
      </div>
    </article>
  );
}

function BudgetPanel({ teams, players }: { teams: Team[]; players: Player[] }) {
  return (
    <section className="glass-card p-5">
      <h3 className="flex items-center gap-2 text-lg font-black text-white">
        <WalletCards className="h-5 w-5 text-apl-gold" />
        Teams & Points
      </h3>

      <div className="mt-4 space-y-3">
        {teams.length === 0 && <p className="text-white/50">No teams created yet.</p>}

        {teams.map((team) => {
          const bought = boughtPlayersForTeam(players, team);
          const full = bought.length >= (team.max_players || 4);

          return (
            <div key={team.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-3">
                <Avatar src={team.logo_url} label={team.team_name} size="sm" icon={<Shield className="h-5 w-5" />} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-black text-white">{team.team_name}</p>
                    {full && <span className="rounded-full bg-red-400/15 px-2 py-0.5 text-[10px] font-black text-red-200">Team Full</span>}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-white/55">
                    <Avatar src={team.captain_photo_url} label={team.captain_name} size="xs" />
                    <span>Captain: {team.captain_name}</span>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm text-white/55">
                Remaining <span className="font-bold text-apl-gold">{formatMoney(team.remaining_budget)}</span> • {bought.length}/
                {team.max_players || 4} players
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function BidHistory({ bids, teams }: { bids: Bid[]; teams: Team[] }) {
  return (
    <section className="glass-card p-5">
      <h3 className="flex items-center gap-2 text-lg font-black text-white">
        <Trophy className="h-5 w-5 text-apl-gold" />
        Last 10 Bids
      </h3>

      <div className="mt-4 space-y-3">
        {bids.length === 0 && <p className="text-white/50">No bids yet.</p>}

        {bids.map((bid) => {
          const team = teams.find((item) => item.id === bid.team_id) || teams.find((item) => item.team_name === bid.team_name);

          return (
            <div key={bid.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar src={team?.logo_url} label={bid.team_name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate font-bold text-white">{bid.team_name}</p>
                  <div className="flex items-center gap-2 text-xs text-white/55">
                    <Avatar src={team?.captain_photo_url} label={bid.captain_name || 'Captain'} size="xs" />
                    <span>{bid.captain_name || 'Captain'}</span>
                  </div>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-apl-gold/15 px-3 py-1 text-sm font-black text-apl-gold">
                {formatMoney(bid.bid_amount)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EventPanel({ events }: { events: { id: string; message: string; created_at: string }[] }) {
  return (
    <section className="glass-card p-5">
      <h3 className="flex items-center gap-2 text-lg font-black text-white">
        <Radio className="h-5 w-5 text-apl-green" />
        Live Messages
      </h3>

      <div className="mt-4 space-y-2">
        {events.length === 0 && <p className="text-white/50">No auction messages yet.</p>}
        {events.map((event) => (
          <p key={event.id} className="rounded-2xl bg-white/[0.04] p-3 text-sm text-white/65">
            {event.message}
          </p>
        ))}
      </div>
    </section>
  );
}

function UnsoldPanel({ players }: { players: Player[] }) {
  return (
    <section className="glass-card p-5">
      <h3 className="flex items-center gap-2 text-lg font-black text-white">
        <Users className="h-5 w-5 text-apl-green" />
        Unsold Players
      </h3>

      <div className="mt-4 space-y-2">
        {players.length === 0 && <p className="text-white/50">No unsold players yet.</p>}
        {players.slice(0, 8).map((player) => (
          <div key={player.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-3">
            <Avatar src={player.photo_url} label={player.name} size="sm" />
            <span className="font-bold text-white/80">{player.name}</span>
          </div>
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
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="grid gap-5 md:grid-cols-2">
        {teams.map((team, index) => {
          const bought = boughtPlayersForTeam(players, team);

          return (
            <article key={team.id} className="glass-card p-5">
              <div className="flex items-center gap-3">
                <Avatar src={team.logo_url} label={team.team_name} size="md" />
                <div>
                  <p className="text-sm font-bold text-apl-gold">#{index + 1} by spending</p>
                  <h2 className="text-2xl font-black text-white">{team.team_name}</h2>
                </div>
              </div>
              <p className="mt-3 text-white/55">
                Captain: {team.captain_name} • Remaining: {formatMoney(team.remaining_budget)}
              </p>
              <p className="mt-1 text-apl-gold">Spent {formatMoney(computeTeamSpent(players, team))}</p>

              <div className="mt-4 space-y-2">
                {bought.length === 0 && <p className="text-white/45">No players bought.</p>}
                {bought.map((player) => (
                  <div key={player.id} className="flex items-center justify-between rounded-2xl bg-white/[0.04] p-3">
                    <span className="font-bold text-white">{player.name}</span>
                    <span className="text-apl-gold">{formatMoney(player.sold_price)}</span>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </section>

      <aside className="space-y-5">
        <section className="glass-card p-5">
          <h3 className="text-lg font-black text-white">Most Expensive Player</h3>
          <div className="mt-4 flex items-center gap-3">
            <Avatar src={mostExpensive?.photo_url} label={mostExpensive?.name || 'None'} size="md" />
            <div>
              <p className="font-black text-white">{mostExpensive ? mostExpensive.name : 'None'}</p>
              <p className="text-apl-gold">{formatMoney(mostExpensive?.sold_price)}</p>
            </div>
          </div>
        </section>

        <section className="glass-card p-5">
          <h3 className="text-lg font-black text-white">Unsold Players</h3>
          <div className="mt-3 space-y-2">
            {unsoldPlayers.length === 0 && <p className="text-white/45">No unsold players.</p>}
            {unsoldPlayers.map((player) => (
              <p key={player.id} className="rounded-2xl bg-white/[0.04] p-3 text-white/70">
                {player.name}
              </p>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

function Avatar({
  src,
  label,
  size = 'md',
  icon,
}: {
  src?: string | null;
  label: string;
  size?: 'xs' | 'sm' | 'md';
  icon?: React.ReactNode;
}) {
  const [ok, setOk] = useState(Boolean(src));
  const sizes = {
    xs: 'h-7 w-7 rounded-full text-[10px]',
    sm: 'h-10 w-10 rounded-2xl text-xs',
    md: 'h-14 w-14 rounded-2xl text-sm',
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
        icon || <span>{initials(label)}</span>
      )}
    </div>
  );
}

function BigStat({ label, value, highlighted }: { label: string; value: React.ReactNode; highlighted?: boolean }) {
  return (
    <div className={`rounded-3xl border p-4 ${highlighted ? 'border-apl-gold/40 bg-apl-gold/10' : 'border-white/10 bg-white/[0.04]'}`}>
      <p className="text-sm text-white/45">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}
