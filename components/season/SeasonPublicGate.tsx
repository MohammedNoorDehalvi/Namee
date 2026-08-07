'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Archive, Eye, ShieldCheck, Trophy } from 'lucide-react';
import type { Season } from '@/lib/types';
import { GlassCard } from '@/components/ui/liquid-glass';

const allowedWithoutSeason = ['/admin-login', '/admin-dashboard', '/seasons'];
const DISMISS_KEY = 'apl_season_gate_dismissed';

export function SeasonPublicGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [season, setSeason] = useState<Season | null | undefined>(undefined);
  const [isDismissed, setIsDismissed] = useState(false);

  const isAllowed = useMemo(
    () => allowedWithoutSeason.some((path) => pathname === path || pathname.startsWith(`${path}/`)),
    [pathname],
  );

  useEffect(() => {
    try {
      setIsDismissed(sessionStorage.getItem(DISMISS_KEY) === '1');
    } catch {
      // ignore
    }
  }, []);

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

  function dismiss() {
    setIsDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore
    }
  }

  // Loading season: render children to avoid layout flash
  if (season === undefined || isAllowed) {
    return <>{children}</>;
  }

  // Active season
  if (season) {
    return <>{children}</>;
  }

  // No season — full gate unless dismissed
  if (!isDismissed) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4 py-12">
        <GlassCard className="relative w-full rounded-[2rem] border-white/15 p-8 text-center shadow-2xl sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-amber-400/30 bg-amber-400/15 text-amber-300">
            <Trophy size={28} aria-hidden />
          </div>

          <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-amber-300">Season status</p>
          <h1 className="mt-3 text-3xl font-extrabold text-white font-display sm:text-4xl md:text-5xl">
            No active season
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-300 sm:text-base">
            The last APL season has ended. Live registration, bidding, and squad pages open when an admin starts a new
            season. You can still browse archives or explore the site.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Link href="/seasons" className="btn-primary justify-center">
              <Archive size={18} /> Past seasons
            </Link>
            <Link href="/admin-login" className="btn-ghost justify-center">
              <ShieldCheck size={18} /> Admin login
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="btn-ghost justify-center border border-white/15 text-white hover:bg-white/10"
            >
              <Eye size={18} /> Browse site
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Dismissed: show soft residual banner + content
  return (
    <>
      <div
        className="sticky top-[4.5rem] z-30 border-b border-amber-400/25 bg-amber-500/15 px-4 py-2.5 backdrop-blur-md sm:top-[4.75rem]"
        role="status"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-sm">
          <p className="font-semibold text-amber-100">
            No active season — browsing in preview mode. Archives stay available.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/seasons" className="font-bold text-amber-200 underline-offset-2 hover:underline">
              View seasons
            </Link>
            <button
              type="button"
              onClick={() => {
                setIsDismissed(false);
                try {
                  sessionStorage.removeItem(DISMISS_KEY);
                } catch {
                  // ignore
                }
              }}
              className="text-xs font-bold text-white/70 hover:text-white"
            >
              Show notice
            </button>
          </div>
        </div>
      </div>
      {children}
    </>
  );
}
