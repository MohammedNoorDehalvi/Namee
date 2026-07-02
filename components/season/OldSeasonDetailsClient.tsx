'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, Gavel, Trophy, Users } from 'lucide-react';
import type { AuctionEvent, Bid, Captain, MatchRow, Player, PointRow, Season, Team } from '@/lib/types';
import { formatMoney } from '@/lib/format';

type Details = {
  season: Season;
  teams: Team[];
  captains: Captain[];
  players: Player[];
  bids: Bid[];
  events: AuctionEvent[];
  matches: MatchRow[];
  pointsTable: PointRow[];
};

export function OldSeasonDetailsClient({ seasonId }: { seasonId: string }) {
  const [data, setData] = useState<Details | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/seasons/${seasonId}`, { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      setData(json);
      setLoading(false);
    }

    void load();
  }, [seasonId]);

  const soldPlayers = useMemo(() => data?.players.filter((player) => player.auction_status === 'SOLD' || player.status === 'Sold') || [], [data]);
  const unsoldPlayers = useMemo(() => data?.players.filter((player) => player.auction_status === 'UNSOLD' || player.status === 'Unsold') || [], [data]);
  const mostExpensive = useMemo(() => [...soldPlayers].sort((a, b) => Number(b.sold_price || 0) - Number(a.sold_price || 0))[0] || null, [soldPlayers]);

  if (loading) return <p className="py-20 text-center text-white/60">Loading old season...</p>;
  if (!data?.season) return <p className="py-20 text-center text-white/60">Season not found.</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Link href="/seasons" className="mb-6 inline-flex items-center gap-2 text-sm font-black text-yellow-300">
        <ArrowLeft size={16} /> Back to old seasons
      </Link>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-7 shadow-2xl backdrop-blur">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-yellow-300">Read-only archive</p>
        <h1 className="mt-3 text-5xl font-black text-white">{data.season.name}</h1>
        <p className="mt-3 text-white/60">Teams, captains, players, sold/unsold results, bids, points table and match results if available.</p>

        <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Mini label="Teams" value={data.teams.length} icon={<Users />} />
          <Mini label="Players" value={data.players.length} icon={<Trophy />} />
          <Mini label="Sold" value={soldPlayers.length} icon={<Gavel />} />
          <Mini label="Unsold" value={unsoldPlayers.length} icon={<BarChart3 />} />
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-2xl font-black text-white">Teams & Captains</h2>
          <div className="mt-5 grid gap-4">
            {data.teams.map((team) => {
              const teamPlayers = soldPlayers.filter((player) => player.sold_to_team_id === team.id || player.sold_to_team === team.team_name);
              return (
                <div key={team.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-3">
                    {team.logo_url ? <img src={team.logo_url} alt={team.team_name} className="h-14 w-14 rounded-2xl object-cover" /> : null}
                    <div>
                      <h3 className="text-xl font-black text-white">{team.team_name}</h3>
                      <p className="text-sm text-white/55">Captain: {team.captain_name}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2">
                    {teamPlayers.length === 0 ? (
                      <p className="text-sm text-white/50">No sold players saved.</p>
                    ) : (
                      teamPlayers.map((player) => (
                        <p key={player.id} className="rounded-2xl bg-white/[0.04] p-3 text-sm text-white/75">
                          {player.name} • {player.role} • {formatMoney(player.sold_price)}
                        </p>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-2xl font-black text-white">Auction Results</h2>
            <p className="mt-3 text-white/60">Most expensive: {mostExpensive ? `${mostExpensive.name} (${formatMoney(mostExpensive.sold_price)})` : 'Not available yet'}</p>
            <p className="mt-2 text-white/60">Total bids: {data.bids.length}</p>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-2xl font-black text-white">Unsold Players</h2>
            <div className="mt-3 grid gap-2">
              {unsoldPlayers.length === 0 ? <p className="text-white/50">No unsold players.</p> : unsoldPlayers.map((player) => <p key={player.id} className="rounded-2xl bg-black/20 p-3 text-sm text-white/75">{player.name}</p>)}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-2xl font-black text-white">Matches / Points</h2>
            <p className="mt-3 text-white/60">{data.matches.length ? `${data.matches.length} matches saved.` : 'Match results not available yet.'}</p>
            <p className="mt-2 text-white/60">{data.pointsTable.length ? `${data.pointsTable.length} points rows saved.` : 'Points table not available yet.'}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Mini({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="text-yellow-300">{icon}</div>
      <p className="mt-3 text-sm text-white/45">{label}</p>
      <p className="text-3xl font-black text-white">{value}</p>
    </div>
  );
}
