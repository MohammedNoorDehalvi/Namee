'use client';

import type { ReactNode } from 'react';
import { Pause, Radio } from 'lucide-react';
import type { Player } from '@/lib/types';
import { formatMoney, initials } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassCard } from '@/components/ui/liquid-glass';
import { TiltCard } from '@/components/ui/TiltCard';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { BidFlash } from '@/components/ui/BidFlash';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';

type LotCardProps = {
  player: Player | null;
  currentBid: number;
  highestTeam?: string | null;
  flashKey?: string | number;
  auctionStatus?: string | null;
  /** Optional next bid amount (captain desk). */
  nextBid?: number | null;
  theaterMode?: boolean;
  className?: string;
  /** Extra stats row (e.g. your budget / squad). */
  extraStats?: Array<{ label: string; value: ReactNode; highlighted?: boolean }>;
  footer?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function LotCard({
  player,
  currentBid,
  highestTeam,
  flashKey,
  auctionStatus,
  nextBid,
  theaterMode = false,
  className,
  extraStats,
  footer,
  emptyTitle = 'No active player on lot',
  emptyDescription = 'Waiting for the administrator to call the next player.',
}: LotCardProps) {
  if (!player) {
    return (
      <GlassCard
        className={cn(
          'relative flex min-h-[320px] items-center justify-center overflow-hidden border-white/15 p-6 text-center sm:min-h-[380px]',
          className,
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08),transparent_60%)]" />
        <div className="relative space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-300">
            <Radio className="h-6 w-6 animate-pulse" aria-hidden />
          </div>
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      </GlassCard>
    );
  }

  const stats: Array<{ label: string; value: ReactNode; highlighted?: boolean }> = [
    { label: 'Base price', value: formatMoney(player.base_price) },
    { label: 'Current bid', value: formatMoney(currentBid), highlighted: true },
    { label: 'Highest bidder', value: highestTeam || 'No bids yet' },
    ...(nextBid != null
      ? [{ label: 'Next bid', value: formatMoney(nextBid) }]
      : [{ label: 'Lot status', value: player.auction_status || player.status }]),
    ...(extraStats || []),
  ];

  return (
    <TiltCard tiltMaxAngle={theaterMode ? 4 : 8}>
      <SpotlightCard
        spotlightColor="rgba(245, 158, 11, 0.2)"
        className={cn(
          'relative overflow-hidden border border-white/15 bg-slate-900/90 shadow-2xl',
          theaterMode ? 'rounded-[2rem] p-6 sm:p-10 md:p-12' : 'rounded-[2rem] p-5 sm:rounded-[2.5rem] sm:p-6 md:p-8',
          className,
        )}
      >
        {flashKey != null && <BidFlash triggerKey={flashKey} />}

        {auctionStatus === 'PAUSED' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/55 backdrop-blur-[2px]">
            <div className="flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/20 px-5 py-2.5 text-sm font-extrabold uppercase tracking-wider text-amber-100">
              <Pause className="h-4 w-4" aria-hidden /> Auction paused
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
            <LotAvatar src={player.photo_url} label={player.name} large={theaterMode} />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="success">Active lot</StatusBadge>
                <StatusBadge tone="gold">{player.role}</StatusBadge>
              </div>
              <h2
                className={cn(
                  'break-words font-extrabold text-white font-display',
                  theaterMode ? 'text-4xl sm:text-5xl md:text-7xl' : 'text-3xl sm:text-4xl md:text-5xl',
                )}
              >
                {player.name}
              </h2>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/90 sm:text-sm">
                Batting: {player.batting_style || 'N/A'} • Bowling: {player.bowling_style || 'N/A'}
              </p>
            </div>
          </div>

          <div className={cn('grid gap-3 pt-1 sm:gap-4', stats.length > 4 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2')}>
            {stats.map((stat) => (
              <LotStat key={stat.label} label={stat.label} value={stat.value} highlighted={stat.highlighted} />
            ))}
          </div>

          {footer && <div className="pt-1">{footer}</div>}
        </div>
      </SpotlightCard>
    </TiltCard>
  );
}

function LotAvatar({ src, label, large }: { src?: string | null; label: string; large?: boolean }) {
  const size = large ? 'h-36 w-36 sm:h-44 sm:w-44' : 'h-28 w-28 sm:h-36 sm:w-36';
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={label}
        className={cn(size, 'shrink-0 rounded-[1.75rem] border border-white/15 object-cover shadow-xl')}
        loading="eager"
        decoding="async"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div
      className={cn(
        size,
        'grid shrink-0 place-items-center rounded-[1.75rem] border border-amber-400/30 bg-gradient-to-br from-amber-500/20 to-slate-900 text-4xl font-black text-amber-300 font-display sm:text-5xl',
      )}
      aria-hidden
    >
      {initials(label)}
    </div>
  );
}

function LotStat({
  label,
  value,
  highlighted,
}: {
  label: string;
  value: ReactNode;
  highlighted?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-3 sm:p-4',
        highlighted
          ? 'border-amber-400/35 bg-amber-400/10 shadow-lg shadow-amber-500/10'
          : 'border-white/10 bg-white/[0.04]',
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p
        className={cn(
          'mt-1 truncate text-base font-extrabold sm:text-lg',
          highlighted ? 'text-amber-200 font-display' : 'text-white',
        )}
      >
        {value}
      </p>
    </div>
  );
}
