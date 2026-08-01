'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Trophy } from 'lucide-react';
import type { Season } from '@/lib/types';

const allowedWithoutSeason = ['/admin-login', '/admin-dashboard', '/seasons'];

export function SeasonPublicGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [season, setSeason] = useState<Season | null | undefined>(undefined);

  const isAllowed = useMemo(
    () => allowedWithoutSeason.some((path) => pathname === path || pathname.startsWith(`${path}/`)),
    [pathname],
  );

  useEffect(() => {
    let alive = true;

    async function load() {
      const res = await fetch('/api/season/current', { cache: 'no-store' });
      const json = await res.json().catch(() => ({ season: null }));

      if (alive) setSeason(json.season || null);
    }

    void load();

    const id = window.setInterval(load, 5000);

    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  if (season === undefined || season || isAllowed) {
    return <>{children}</>;
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-4 py-16">
      <section className="w-full rounded-[2rem] border border-white/10 bg-white/[0.06] p-7 text-center shadow-2xl backdrop-blur md:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-yellow-300/15 text-yellow-300">
          <Trophy size={36} />
        </div>

        <p className="mt-6 text-sm font-black uppercase tracking-[0.35em] text-yellow-300">APL Season Status</p>
        <h1 className="mt-3 text-4xl font-black text-white md:text-6xl">NO CURRENT SEASON GOING</h1>
        <p className="mx-auto mt-4 max-w-2xl text-white/60">
          The last APL season has ended. Current season pages are hidden until admin starts a new season.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link href="/admin-login" className="btn-primary justify-center">
            <ShieldCheck size={18} /> Admin Login
          </Link>
          <Link href="/seasons" className="btn-ghost justify-center">
            <Trophy size={18} /> View Old Seasons
          </Link>
        </div>
      </section>
    </main>
  );
}
