'use client';

import { useMemo } from 'react';
import { ExternalLink, QrCode } from 'lucide-react';
import { formatMoney } from '@/lib/format';

type Props = {
  active: boolean;
  playerName?: string | null;
  currentBid: number;
  highestTeam?: string | null;
  auctionStatus?: string | null;
};

/**
 * Stream-friendly chrome: huge bid type, captain-login QR, minimal chrome.
 * Parent should also set body.theater-mode for full chrome hide.
 */
export function TheaterOverlay({ active, playerName, currentBid, highestTeam, auctionStatus }: Props) {
  const captainUrl = useMemo(() => {
    if (typeof window === 'undefined') return '/captain-login';
    return `${window.location.origin}/captain-login`;
  }, [active]);

  const qrSrc = useMemo(() => {
    const data = encodeURIComponent(captainUrl);
    return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=8&data=${data}`;
  }, [captainUrl]);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex items-end justify-between gap-4 p-4 sm:p-6">
      <div className="pointer-events-auto max-w-xs rounded-2xl border border-white/15 bg-slate-950/90 p-3 shadow-2xl backdrop-blur-xl sm:p-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrSrc}
            alt="QR code to captain login"
            width={88}
            height={88}
            className="rounded-xl border border-white/10 bg-white p-1"
          />
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-300">
              <QrCode className="h-3.5 w-3.5" /> Captains scan to bid
            </p>
            <p className="mt-1 break-all text-[11px] font-medium text-slate-300">{captainUrl}</p>
            <a
              href={captainUrl}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 hover:underline"
            >
              Open login <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="pointer-events-none hidden rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-right backdrop-blur-md sm:block">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50">
          {auctionStatus || 'LIVE'} · Stream mode
        </p>
        <p className="mt-1 max-w-[280px] truncate text-sm font-bold text-white">{playerName || 'Waiting for lot'}</p>
        <p className="text-2xl font-black text-amber-300 font-display">{formatMoney(currentBid)}</p>
        <p className="text-xs text-slate-400">{highestTeam || 'No leading franchise'}</p>
      </div>
    </div>
  );
}
