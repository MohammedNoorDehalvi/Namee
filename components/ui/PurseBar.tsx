'use client';

import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/format';

type PurseBarProps = {
  remaining?: number | null;
  budget?: number | null;
  squadCount?: number;
  maxPlayers?: number;
  className?: string;
  compact?: boolean;
  /** Show danger styling when remaining is low or squad full */
  showWarning?: boolean;
};

export function PurseBar({
  remaining = 0,
  budget = 0,
  squadCount,
  maxPlayers = 4,
  className,
  compact = false,
  showWarning = true,
}: PurseBarProps) {
  const rem = Number(remaining || 0);
  const bud = Math.max(1, Number(budget || 0));
  const remainingPct = Math.min(100, Math.max(0, (rem / bud) * 100));
  const spentPct = 100 - remainingPct;
  const lowPurse = showWarning && remainingPct <= 20;
  const squadFull = showWarning && squadCount != null && squadCount >= maxPlayers;

  return (
    <div className={cn('space-y-1.5', className)} aria-label="Team purse">
      <div className={cn('flex flex-wrap items-center justify-between gap-2', compact ? 'text-[11px]' : 'text-xs')}>
        <span className={cn('font-semibold', lowPurse ? 'text-red-300' : 'text-slate-300')}>
          Purse {formatMoney(rem)}
          <span className="text-slate-500"> / {formatMoney(bud)}</span>
        </span>
        {squadCount != null && (
          <span className={cn('font-semibold', squadFull ? 'text-amber-300' : 'text-slate-400')}>
            Squad {squadCount}/{maxPlayers}
            {squadFull ? ' · Full' : ''}
          </span>
        )}
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-800/90"
        role="progressbar"
        aria-valuenow={Math.round(remainingPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Remaining budget ${Math.round(remainingPct)} percent`}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            lowPurse
              ? 'bg-gradient-to-r from-red-500 to-amber-500'
              : 'bg-gradient-to-r from-amber-400 to-emerald-400',
          )}
          style={{ width: `${remainingPct}%` }}
        />
      </div>
      {!compact && (
        <p className="text-[10px] font-medium text-slate-500">
          Spent {formatMoney(bud - rem)} ({Math.round(spentPct)}%)
        </p>
      )}
    </div>
  );
}
