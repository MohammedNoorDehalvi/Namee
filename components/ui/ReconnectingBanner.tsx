'use client';

import { WifiOff } from 'lucide-react';

export function ReconnectingBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[100] flex justify-center px-3 pt-3 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/95 px-4 py-2 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/30 animate-pulse">
        <WifiOff className="h-4 w-4" />
        Reconnecting to live updates…
      </div>
    </div>
  );
}
