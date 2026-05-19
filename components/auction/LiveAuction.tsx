"use client";

import Link from 'next/link';
import { useMemo } from 'react';
import { Radio, Trophy, Users, WalletCards } from 'lucide-react';
import { useAuctionRealtime } from '@/hooks/useAuctionRealtime';
import { boughtPlayersForTeam, computeTeamSpent } from '@/lib/auction-utils';
import { formatMoney, initials } from '@/lib/format';
import type { Player, Team } from '@/lib/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';

export function LiveAuction({ mode = 'public' }: { mode?: 'public' | 'captain' }) {
  const { auction, currentPlayer, players, teams, bids, events, loading, currentBid } = useAuctionRealtime();
  const soldPlayers = players.filter((player) => player.auction_status === 'SOLD' || player.status === 'Sold');
  const unsoldPlayers = players.filter((player) => player.auction_status === 'UNSOLD' || player.status === 'Unsold');
  const mostExpensive = useMemo(() => [...soldPlayers].sort((a, b) => Number(b.sold_price || 0) - Number(a.sold_price || 0))[0] || null, [soldPlayers]);
  const leaderboard = useMemo(() => [...teams].sort((a, b) => computeTeamSpent(soldPlayers, b) - computeTeamSpent(soldPlayers, a)), [teams, soldPlayers]);

  if (loading) {
    return (
      <main className="min-h-screen bg-stadium px-4 py-16">
        <div className="mx-auto flex max-w-6xl justify-center"><LoadingSpinner /></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stadium px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-black/25 p-4 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div>
            <p className="badge inline-flex border-apl-gold/40 bg-apl-gold/10 text-apl-gold">
              {auction?.auction_status || 'NOT_STARTED'} AUCTION
            </p>
            <h1 className="mt-3 text-3xl font-black sm:text-5xl">APL IPL-Style Live Auction</h1>
            <p className="mt-2 text-sm text-white/60">Realtime current player, bids, teams, budgets, events and final squads.</p>
          </div>
          <div className="glass-card rounded-3xl p-4 text-left md:min-w-80">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-apl-gold">Highest Bidder</p>
            <p className="mt-2 text-2xl font-black">
              {auction?.highest_team_name ? `${auction.highest_team_name} / ${auction.highest_bidder_captain_name || 'Captain'}` : 'No bids yet'}
            </p>
            <p className="mt-1 text-white/60">Current bid: {formatMoney(currentBid)}</p>
          </div>
        </div>

        {auction?.auction_status === 'ENDED' ? (
          <FinalReport teams={leaderboard} players={players} unsoldPlayers={unsoldPlayers} mostExpensive={mostExpensive} />
        ) : (
          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <section className="grid gap-5 lg:grid-cols-[1fr_300px]">
              <CurrentPlayerCard player={currentPlayer} currentBid={currentBid} highestTeam={auction?.highest_team_name || null} />
              <div className="space-y-5">
                <BudgetPanel teams={teams} players={players} />
                <BidHistory bids={bids} />
              </div>
            </section>
            <aside className="space-y-5">
              <EventPanel events={events} />
              <UnsoldPanel players={unsoldPlayers} />
              {mode === 'public' && <Link href="/captain-login" className="btn-primary w-full">Captain Login to Bid</Link>}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

function CurrentPlayerCard({ player, currentBid, highestTeam }: { player: Player | null; currentBid: number; highestTeam: string | null }) {
  if (!player) {
    return (
      <div className="glass-card flex min-h-[520px] items-center justify-center rounded-[2rem] p-6">
        <EmptyState title="No current player selected" description="Admin will select the first player or choose next random player." />
      </div>
    );
  }

  return (
    <article className="glass-card relative overflow-hidden rounded-[2rem] p-5 sm:p-8">
      <div className="absolute right-8 top-8 rounded-full bg-apl-gold/20 p-10 blur-3xl" />
      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
          {player.photo_url ? (
            <img src={player.photo_url} alt={player.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-6xl font-black text-apl-gold">{initials(player.name)}</div>
          )}
        </div>
        <div className="flex flex-col justify-between gap-6">
          <div>
            <p className="badge inline-flex border-apl-neon/30 bg-apl-neon/10 text-apl-neon">Current Player</p>
            <h2 className="mt-4 text-4xl font-black sm:text-6xl">{player.name}</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Info label="Role" value={player.role} />
              <Info label="Batting" value={player.batting_style} />
              <Info label="Bowling" value={player.bowling_style} />
              <Info label="Status" value={player.auction_status || player.status} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <BigStat label="Base Price" value={formatMoney(player.base_price)} />
            <BigStat label="Current Bid" value={formatMoney(currentBid)} highlighted />
            <BigStat label="Highest Team" value={highestTeam || 'No bid'} />
          </div>
        </div>
      </div>
    </article>
  );
}

function BudgetPanel({ teams, players }: { teams: Team[]; players: Player[] }) {
  return (
    <div className="glass-card rounded-[2rem] p-5">
      <div className="mb-4 flex items-center gap-2"><WalletCards className="h-5 w-5 text-apl-gold" /><h3 className="font-black">Teams & Points</h3></div>
      <div className="space-y-3">
        {teams.length === 0 && <p className="text-sm text-white/50">No teams created yet.</p>}
        {teams.map((team) => {
          const bought = boughtPlayersForTeam(players, team);
          const full = bought.length >= (team.max_players || 4);
          return (
            <div key={team.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <LogoAvatar src={team.logo_url} label={team.team_name} />
                  <div className="min-w-0">
                    <p className="truncate font-black">{team.team_name}</p>
                    <p className="truncate text-xs text-white/50">Captain: {team.captain_name}</p>
                  </div>
                </div>
                {full && <span className="badge border-green-400/30 bg-green-400/10 text-green-200">Team Full</span>}
              </div>
              <div className="mt-3 flex justify-between text-sm text-white/70">
                <span>Remaining {formatMoney(team.remaining_budget)}</span>
                <span>{bought.length}/{team.max_players || 4} players</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BidHistory({ bids }: { bids: { id: string; team_name: string; captain_name?: string | null; bid_amount: number }[] }) {
  return (
    <div className="glass-card rounded-[2rem] p-5">
      <div className="mb-4 flex items-center gap-2"><Radio className="h-5 w-5 text-apl-neon" /><h3 className="font-black">Last 10 Bids</h3></div>
      <div className="space-y-2">
        {bids.length === 0 && <p className="text-sm text-white/50">No bids yet.</p>}
        {bids.map((bid) => (
          <div key={bid.id} className="flex items-center justify-between rounded-2xl bg-white/[0.05] px-3 py-2 text-sm">
            <span>{bid.team_name}{bid.captain_name ? ` / ${bid.captain_name}` : ''}</span>
            <strong className="text-apl-gold">{formatMoney(bid.bid_amount)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventPanel({ events }: { events: { id: string; message: string; created_at: string }[] }) {
  return (
    <div className="glass-card rounded-[2rem] p-5">
      <div className="mb-4 flex items-center gap-2"><Trophy className="h-5 w-5 text-apl-gold" /><h3 className="font-black">Live Messages</h3></div>
      <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
        {events.length === 0 && <p className="text-sm text-white/50">No auction messages yet.</p>}
        {events.map((event) => <p key={event.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white/75">{event.message}</p>)}
      </div>
    </div>
  );
}

function UnsoldPanel({ players }: { players: Player[] }) {
  return (
    <div className="glass-card rounded-[2rem] p-5">
      <h3 className="font-black">Unsold Players</h3>
      <div className="mt-3 space-y-2">
        {players.length === 0 && <p className="text-sm text-white/50">No unsold players yet.</p>}
        {players.slice(0, 8).map((player) => <p key={player.id} className="rounded-xl bg-white/[0.05] px-3 py-2 text-sm">{player.name}</p>)}
      </div>
    </div>
  );
}

function FinalReport({ teams, players, unsoldPlayers, mostExpensive }: { teams: Team[]; players: Player[]; unsoldPlayers: Player[]; mostExpensive: Player | null }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <section className="space-y-5">
        {teams.map((team, index) => {
          const bought = boughtPlayersForTeam(players, team);
          return (
            <div key={team.id} className="glass-card rounded-[2rem] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex min-w-0 items-center gap-3 text-2xl font-black"><LogoAvatar src={team.logo_url} label={team.team_name} /> <span className="truncate">#{index + 1} {team.team_name}</span></h2>
                <span className="badge">Spent {formatMoney(computeTeamSpent(players, team))}</span>
              </div>
              <p className="mt-1 text-sm text-white/55">Captain: {team.captain_name} • Remaining: {formatMoney(team.remaining_budget)}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {bought.length === 0 && <p className="text-sm text-white/50">No players bought.</p>}
                {bought.map((player) => (
                  <div key={player.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <p className="font-black">{player.name}</p>
                    <p className="text-xs text-white/55">{player.role} • {formatMoney(player.sold_price)}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>
      <aside className="space-y-5">
        <div className="glass-card rounded-[2rem] p-5">
          <h3 className="font-black">Most Expensive Player</h3>
          <p className="mt-3 text-2xl font-black text-apl-gold">{mostExpensive ? mostExpensive.name : 'None'}</p>
          <p className="text-white/60">{formatMoney(mostExpensive?.sold_price)}</p>
        </div>
        <div className="glass-card rounded-[2rem] p-5">
          <h3 className="font-black">Unsold Players</h3>
          <div className="mt-3 space-y-2">
            {unsoldPlayers.length === 0 && <p className="text-sm text-white/50">No unsold players.</p>}
            {unsoldPlayers.map((player) => <p key={player.id} className="rounded-xl bg-white/[0.05] px-3 py-2 text-sm">{player.name}</p>)}
          </div>
        </div>
      </aside>
    </div>
  );
}

function LogoAvatar({ src, label }: { src?: string | null; label: string }) {
  if (src) {
    return <img src={src} alt={label} loading="lazy" decoding="async" className="h-11 w-11 shrink-0 rounded-2xl border border-white/10 bg-white/10 object-cover" />;
  }

  return <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-apl-gold/15 text-sm font-black text-apl-gold">{initials(label)}</div>;
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</p><p className="mt-1 font-black">{value}</p></div>;
}

function BigStat({ label, value, highlighted }: { label: string; value: React.ReactNode; highlighted?: boolean }) {
  return <div className={`rounded-2xl border p-4 ${highlighted ? 'border-apl-gold/40 bg-apl-gold/10' : 'border-white/10 bg-white/[0.04]'}`}><p className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>;
}
