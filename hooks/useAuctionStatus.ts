'use client';

import { useEffect, useState } from 'react';
import type { AuctionStatus } from '@/lib/types';

/**
 * Lightweight poll for global chrome (navbar).
 * Uses live-state endpoint but only keeps status — longer interval than arena.
 */
export function useAuctionStatus(pollMs = 4000) {
  const [status, setStatus] = useState<AuctionStatus | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const res = await fetch(`/api/auction/live-state?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        const json = await res.json().catch(() => ({}));
        if (!alive) return;
        const next = (json?.auction?.auction_status as AuctionStatus | undefined) || null;
        setStatus(next);
      } catch {
        if (!alive) return;
        // keep last known status
      } finally {
        if (alive) setReady(true);
      }
    }

    void load();
    const id = window.setInterval(load, Math.max(2000, pollMs));
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [pollMs]);

  return { status, ready };
}
