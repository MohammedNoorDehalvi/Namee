'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CalendarDays, Trophy } from 'lucide-react';
import type { Season } from '@/lib/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { PageHeader, PageShell } from '@/components/ui/PageShell';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function OldSeasonsClient() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/seasons', { cache: 'no-store' });
        const json = await res.json().catch(() => ({ seasons: [] }));
        if (!res.ok) throw new Error(json.error || 'Could not load seasons.');
        setSeasons(json.seasons || []);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load seasons.');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <PageShell className="py-4">
      <PageHeader
        eyebrow="APL history"
        title="View old seasons"
        description="Read-only archive of teams, players, auction results, and stats."
      />

      <div className="mt-10">
        {loading && (
          <div className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && error && (
          <EmptyState title="Could not load seasons" description={error} />
        )}

        {!loading && !error && seasons.length === 0 && (
          <EmptyState
            title="No seasons saved yet"
            description="When an admin starts and ends seasons, they appear here as archives."
            actionHref="/"
            actionLabel="Back home"
          />
        )}

        {!loading && !error && seasons.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2">
            {seasons.map((season) => (
              <Link
                key={season.id}
                href={`/seasons/${season.id}`}
                className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur transition hover:border-amber-300/40"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-amber-400/25 bg-amber-400/15 text-amber-300">
                    <Trophy size={28} aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <div className="mb-1">
                      <StatusBadge tone={season.status === 'active' ? 'success' : 'neutral'}>
                        {season.status === 'active' ? 'Active' : 'Ended'}
                      </StatusBadge>
                    </div>
                    <h2 className="truncate text-2xl font-extrabold text-white font-display sm:text-3xl">{season.name}</h2>
                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-300">
                      <CalendarDays size={15} aria-hidden />
                      {season.status === 'active' ? 'Current season' : 'Archive'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
