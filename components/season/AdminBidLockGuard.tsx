'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export function AdminBidLockGuard() {
  const [locked, setLocked] = useState(false);

  async function load() {
    const { data } = await supabase.from('auction').select('bid_processing,bid_lock_started_at').eq('id', 1).maybeSingle();
    const processing = Boolean(data?.bid_processing);
    const started = data?.bid_lock_started_at ? new Date(data.bid_lock_started_at).getTime() : 0;
    const stale = started ? Date.now() - started > 12_000 : false;

    setLocked(processing && !stale);
  }

  useEffect(() => {
    void load();

    const id = window.setInterval(load, 500);

    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const soldButtons = buttons.filter((button) => button.textContent?.toLowerCase().includes('sold to current bidder'));

    soldButtons.forEach((button) => {
      if (locked) {
        button.setAttribute('disabled', 'true');
        button.classList.add('opacity-40', 'grayscale', 'cursor-not-allowed');
      } else {
        button.removeAttribute('disabled');
        button.classList.remove('opacity-40', 'grayscale', 'cursor-not-allowed');
      }
    });
  }, [locked]);

  if (!locked) return null;

  return (
    <div className="fixed bottom-5 left-4 right-4 z-50 mx-auto max-w-xl rounded-2xl border border-yellow-300/30 bg-black/90 p-4 text-yellow-100 shadow-2xl backdrop-blur">
      <div className="flex items-center gap-3">
        <AlertTriangle className="shrink-0 text-yellow-300" />
        <div>
          <p className="font-black">A captain is bidding, please wait...</p>
          <p className="text-sm text-yellow-100/70">Sold button is locked until the bid is confirmed or safely times out.</p>
        </div>
      </div>
    </div>
  );
}
