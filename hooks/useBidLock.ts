'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

/**
 * True while a captain bid is mid-flight (server bid_processing flag).
 * Used to disable Sold in admin without DOM text scraping.
 */
export function useBidLock(pollMs = 500) {
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const { data } = await supabase
          .from('auction')
          .select('bid_processing,bid_lock_started_at')
          .eq('id', 1)
          .maybeSingle();

        if (!alive) return;

        const processing = Boolean(data?.bid_processing);
        const started = data?.bid_lock_started_at ? new Date(data.bid_lock_started_at).getTime() : 0;
        const stale = started ? Date.now() - started > 12_000 : false;
        setLocked(processing && !stale);
      } catch {
        if (alive) setLocked(false);
      }
    }

    void load();
    const id = window.setInterval(load, Math.max(300, pollMs));
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [pollMs]);

  return locked;
}
