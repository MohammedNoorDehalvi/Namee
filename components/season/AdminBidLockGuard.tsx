'use client';

import { AlertTriangle } from 'lucide-react';
import { useBidLock } from '@/hooks/useBidLock';

/**
 * Visual banner only — sold button lock is state-driven in AdminPanel via useBidLock.
 */
export function AdminBidLockGuard() {
  const locked = useBidLock(500);

  if (!locked) return null;

  return (
    <div
      className="fixed bottom-5 left-4 right-4 z-50 mx-auto max-w-xl rounded-2xl border border-amber-300/35 bg-slate-950/95 p-4 text-amber-50 shadow-2xl backdrop-blur-xl"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-300" />
        <div>
          <p className="font-extrabold text-white">A captain is bidding — please wait</p>
          <p className="text-sm text-amber-100/70">
            Sold is locked until the bid confirms or the lock safely times out.
          </p>
        </div>
      </div>
    </div>
  );
}
