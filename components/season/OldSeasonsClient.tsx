'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CalendarDays, Trophy } from 'lucide-react';
import type { Season } from '@/lib/types';

export function OldSeasonsClient() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/seasons', { cache: 'no-store' });
      const json = await res.json().catch(() => ({ seasons: [] }));
      setSeasons(json.seasons || []);
      setLoading(false);
    }

    void load();
  }, []);

  if (loading) return <p className="py-20 text-center text-white/60">Loading seasons...</p>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-yellow-300">APL History</p>
        <h1 className="mt-3 text-4xl font-black text-white md:text-6xl">View Old Seasons</h1>
        <p className="mt-3 text-white/60">Read-only archive of APL seasons, teams, players, auction results and stats.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {seasons.map((season) => (
          <Link key={season.id} href={`/seasons/${season.id}`} className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur transition hover:border-yellow-300/40">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-yellow-300/15 text-yellow-300">
                <Trophy size={28} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white">{season.name}</h2>
                <p className="mt-1 flex items-center gap-2 text-sm text-white/55">
                  <CalendarDays size={15} /> {season.status === 'active' ? 'Current active season' : 'Ended season'}
                </p>
              </div>
            </div>
          </Link>
        ))}

        {seasons.length === 0 && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center text-white/60">No seasons saved yet.</div>
        )}
      </div>
    </div>
  );
}
