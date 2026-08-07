'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, Gavel, Trophy, Users } from 'lucide-react';
import type { AuctionEvent, Bid, Captain, MatchRow, Player, PointRow, Season, Team } from '@/lib/types';
import { formatMoney } from '@/lib/format';
import { PageShell } from '@/components/ui/PageShell';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

type Squad = {
  team: Team;
  soldPlayers: Player[];
  soldCount: number;
  spent: number;
};

type Details = {
  season: Season;
  teams: Team[];
  captains: Captain[];
  players: Player[];
  soldPlayers?: Player[];
  squads?: Squad[];
  bids: Bid[];
  events: AuctionEvent[];
  matches: MatchRow[];
  pointsTable: PointRow[];
  meta?: {
    soldCount?: number;
    soldViaTeamId?: number;
    soldViaSeasonId?: number;
  };
};

function isSoldPlayer(player: Player) {
  const statusUpper = (player.status || '').toUpperCase();
  const auctionStatusUpper = (player.auction_status || '').toUpperCase();
  const hasTeam = Boolean(player.sold_to_team_id || player.sold_to_team || player.sold_to_captain_id);
  const hasPrice = Number(player.sold_price || 0) > 0;
  return auctionStatusUpper === 'SOLD' || statusUpper === 'SOLD' || hasTeam || hasPrice;
}

export function OldSeasonDetailsClient({ seasonId }: { seasonId: string }) {
  const [data, setData] = useState<Details | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/seasons/${seasonId}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        const json = await res.json().catch(() => null);
        if (!alive) return;
        if (!res.ok) {
          setError(json?.error || 'Could not load season.');
          setData(null);
          return;
        }
        setData(json);
      } catch {
        if (!alive) return;
        setError('Network error loading season.');
        setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, [seasonId]);

  const soldPlayers = useMemo(() => {
    if (data?.soldPlayers?.length) return data.soldPlayers;
    if (!data?.players) return [];
    return data.players.filter(isSoldPlayer);
  }, [data]);

  const squads = useMemo(() => {
    if (data?.squads?.length) return data.squads;
    if (!data?.teams) return [];
    return data.teams.map((team) => {
      const sold = soldPlayers
        .filter(
          (p) =>
            (p.sold_to_team_id && p.sold_to_team_id === team.id) ||
            (p.sold_to_team &&
              team.team_name &&
              p.sold_to_team.trim().toLowerCase() === team.team_name.trim().toLowerCase()) ||
            (p.sold_to_captain_id && team.captain_id && p.sold_to_captain_id === team.captain_id),
        )
        .sort((a, b) => Number(b.sold_price || 0) - Number(a.sold_price || 0));
      return {
        team,
        soldPlayers: sold,
        soldCount: sold.length,
        spent: sold.reduce((s, p) => s + Number(p.sold_price || 0), 0),
      };
    });
  }, [data, soldPlayers]);

  const unsoldPlayers = useMemo(() => {
    if (!data?.players) return [];
    const soldIds = new Set(soldPlayers.map((p) => p.id));
    return data.players.filter((player) => {
      if (soldIds.has(player.id)) return false;
      const statusUpper = (player.status || '').toUpperCase();
      const auctionStatusUpper = (player.auction_status || '').toUpperCase();
      return auctionStatusUpper === 'UNSOLD' || statusUpper === 'UNSOLD';
    });
  }, [data, soldPlayers]);

  const mostExpensive = useMemo(
    () => [...soldPlayers].sort((a, b) => Number(b.sold_price || 0) - Number(a.sold_price || 0))[0] || null,
    [soldPlayers],
  );

  const totalSpent = useMemo(
    () => soldPlayers.reduce((sum, p) => sum + Number(p.sold_price || 0), 0),
    [soldPlayers],
  );

  if (loading) {
    return (
      <PageShell className="space-y-6 py-8">
        <CardSkeleton />
        <div className="grid gap-4 md:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </PageShell>
    );
  }

  if (error || !data?.season) {
    return (
      <PageShell className="py-12">
        <EmptyState
          title={error || 'Season not found'}
          description="Check the season link or return to the archive list."
          actionHref="/seasons"
          actionLabel="Back to seasons"
        />
      </PageShell>
    );
  }

  return (
    <PageShell className="py-8">
      <Link href="/seasons" className="mb-6 inline-flex items-center gap-2 text-sm font-black text-amber-300 hover:underline">
        <ArrowLeft size={16} /> Back to old seasons
      </Link>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-7 shadow-2xl backdrop-blur">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-amber-300">Read-only archive</p>
        <h1 className="mt-3 text-4xl font-black text-white font-display sm:text-5xl">{data.season.name}</h1>
        <p className="mt-3 text-slate-300">
          Loaded by season → teams → sold players (<code className="text-amber-200/90">season_id</code> +{' '}
          <code className="text-amber-200/90">sold_to_team_id</code>) and price.
        </p>

        <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Mini label="Teams" value={data.teams.length} icon={<Users />} />
          <Mini label="Players" value={data.players.length} icon={<Trophy />} />
          <Mini label="Sold" value={soldPlayers.length} icon={<Gavel />} />
          <Mini label="Unsold" value={unsoldPlayers.length} icon={<BarChart3 />} />
        </div>

        {soldPlayers.length === 0 && data.players.length > 0 && (
          <p className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            This season has a player pool ({data.players.length}) but no sold rows with this season&apos;s team ids.
            Sales may never have been stamped with this season, or were cleared by an old full auction reset. Only
            seasons that still have <strong>Sold</strong> players in the database can show results (e.g. APL 8).
          </p>
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-2xl font-black text-white font-display">Teams &amp; captains</h2>
          {squads.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">No teams saved for this season.</p>
          ) : (
            <div className="mt-5 grid gap-4">
              {squads.map(({ team, soldPlayers: teamPlayers, soldCount, spent }) => (
                <div key={team.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-3">
                    {team.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={team.logo_url} alt={team.team_name} className="h-14 w-14 rounded-2xl object-cover" />
                    ) : (
                      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-400/15 text-sm font-black text-amber-300">
                        {team.team_name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="truncate text-xl font-black text-white">{team.team_name}</h3>
                      <p className="text-sm text-slate-400">Captain: {team.captain_name}</p>
                      <p className="text-xs text-amber-300/90">
                        {soldCount} sold · spent {formatMoney(spent)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2">
                    {teamPlayers.length === 0 ? (
                      <p className="text-sm text-slate-500">No sold players for this team id in this season.</p>
                    ) : (
                      teamPlayers.map((player) => (
                        <div
                          key={player.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/[0.04] px-3 py-2.5 text-sm text-slate-200"
                        >
                          <span>
                            <span className="font-semibold text-white">{player.name}</span>
                            <span className="text-slate-500"> · {player.role}</span>
                          </span>
                          <span className="font-bold text-amber-300">{formatMoney(player.sold_price)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-2xl font-black text-white font-display">Auction results</h2>
            <p className="mt-3 text-slate-300">
              Most expensive:{' '}
              {mostExpensive ? (
                <strong className="text-white">
                  {mostExpensive.name} ({formatMoney(mostExpensive.sold_price)})
                </strong>
              ) : (
                'Not available'
              )}
            </p>
            <p className="mt-2 text-slate-300">
              Total spent: <strong className="text-amber-300">{formatMoney(totalSpent)}</strong>
            </p>
            <p className="mt-2 text-slate-300">Total bids logged: {data.bids.length}</p>
            <p className="mt-2 text-slate-300">Sold players: {soldPlayers.length}</p>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-2xl font-black text-white font-display">All sold players</h2>
            <div className="mt-3 grid max-h-80 gap-2 overflow-y-auto pr-1">
              {soldPlayers.length === 0 ? (
                <p className="text-slate-500">No sold players for this season.</p>
              ) : (
                [...soldPlayers]
                  .sort((a, b) => Number(b.sold_price || 0) - Number(a.sold_price || 0))
                  .map((player) => (
                    <p key={player.id} className="rounded-2xl bg-black/20 px-3 py-2 text-sm text-slate-200">
                      <span className="font-semibold text-white">{player.name}</span>
                      <span className="text-slate-500"> → {player.sold_to_team || 'Team'}</span>
                      <span className="float-right font-bold text-amber-300">{formatMoney(player.sold_price)}</span>
                    </p>
                  ))
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-2xl font-black text-white font-display">Unsold players</h2>
            <div className="mt-3 grid gap-2">
              {unsoldPlayers.length === 0 ? (
                <p className="text-slate-500">No unsold players.</p>
              ) : (
                unsoldPlayers.map((player) => (
                  <p key={player.id} className="rounded-2xl bg-black/20 p-3 text-sm text-slate-200">
                    {player.name}
                  </p>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-2xl font-black text-white font-display">Matches / points</h2>
            <p className="mt-3 text-slate-300">
              {data.matches.length ? `${data.matches.length} matches saved.` : 'Match results not available yet.'}
            </p>
            <p className="mt-2 text-slate-300">
              {data.pointsTable.length ? `${data.pointsTable.length} points rows saved.` : 'Points table not available yet.'}
            </p>
          </section>
        </aside>
      </div>
    </PageShell>
  );
}

function Mini({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="text-amber-300">{icon}</div>
      <p className="mt-3 text-sm text-slate-400">{label}</p>
      <p className="text-3xl font-black text-white">{value}</p>
    </div>
  );
}
