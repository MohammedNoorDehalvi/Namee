'use client';

import { useEffect, useState } from 'react';
import type { Season } from '@/lib/types';

/**
 * Current active season for marketing copy and registration labels.
 */
export function useCurrentSeason(pollMs = 30_000) {
  const [season, setSeason] = useState<Season | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const res = await fetch('/api/season/current', { cache: 'no-store' });
        const json = await res.json().catch(() => ({ season: null }));
        if (!alive) return;
        setSeason(json.season || null);
      } catch {
        if (!alive) return;
      } finally {
        if (alive) setReady(true);
      }
    }

    void load();
    const id = window.setInterval(load, Math.max(10_000, pollMs));
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [pollMs]);

  const label = season?.name || (season?.season_number != null ? `Season ${season.season_number}` : null);
  const displayName = label || 'APL Auction';

  return { season, ready, label, displayName };
}
