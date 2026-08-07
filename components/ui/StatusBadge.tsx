'use client';

import { cn } from '@/lib/utils';
import type { AuctionStatus } from '@/lib/types';

const AUCTION_STYLES: Record<
  string,
  { label: string; className: string; pulse?: boolean }
> = {
  LIVE: {
    label: 'Live',
    className: 'border-emerald-400/40 bg-emerald-400/15 text-emerald-200',
    pulse: true,
  },
  PAUSED: {
    label: 'Paused',
    className: 'border-amber-400/40 bg-amber-400/15 text-amber-100',
  },
  ENDED: {
    label: 'Ended',
    className: 'border-slate-400/30 bg-slate-400/10 text-slate-200',
  },
  NOT_STARTED: {
    label: 'Not started',
    className: 'border-white/15 bg-white/10 text-slate-300',
  },
};

export function AuctionStatusBadge({
  status,
  className,
  showDot = true,
}: {
  status?: AuctionStatus | string | null;
  className?: string;
  showDot?: boolean;
}) {
  const key = (status || 'NOT_STARTED').toUpperCase();
  const style = AUCTION_STYLES[key] || AUCTION_STYLES.NOT_STARTED;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider',
        style.className,
        className,
      )}
    >
      {showDot && (
        <span className="relative flex h-1.5 w-1.5">
          {style.pulse && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          )}
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {style.label}
    </span>
  );
}

export function StatusBadge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'gold';
  className?: string;
}) {
  const tones = {
    neutral: 'border-white/15 bg-white/10 text-white/80',
    success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
    warning: 'border-amber-400/35 bg-amber-400/15 text-amber-100',
    danger: 'border-red-400/30 bg-red-400/10 text-red-200',
    info: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
    gold: 'border-amber-400/30 bg-amber-400/15 text-amber-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
