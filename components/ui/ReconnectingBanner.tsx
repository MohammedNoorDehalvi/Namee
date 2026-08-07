'use client';

import { WifiOff } from 'lucide-react';

export function ReconnectingBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[4.5rem] z-[120] flex justify-center px-3 sm:top-[4.75rem]"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-amber-300/50 bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/30">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-slate-900/40" />
          <WifiOff className="relative h-3.5 w-3.5" />
        </span>
        Reconnecting to live updates…
      </div>
    </div>
  );
}
