'use client';

import Image from 'next/image';
import { Trophy, User, Zap } from 'lucide-react';
import type { Player } from '@/lib/types';
import { formatMoney, initials, statusClass } from '@/lib/format';
import { TiltCard } from '@/components/ui/TiltCard';
import { SpotlightCard } from '@/components/ui/SpotlightCard';

export function PlayerCard({ player }: { player: Player }) {
  return (
    <TiltCard tiltMaxAngle={10} glareOpacity={0.15}>
      <SpotlightCard
        spotlightColor="rgba(245, 158, 11, 0.18)"
        className="h-full overflow-hidden rounded-[2rem] border border-white/15 bg-slate-900/90 flex flex-col justify-between"
      >
        <div>
          <div className="relative h-60 w-full bg-gradient-to-br from-amber-500/20 via-slate-900 to-cyan-500/20">
            {player.photo_url ? (
              <Image src={player.photo_url} alt={player.name} fill className="object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-6xl font-black text-amber-400 font-display">
                {initials(player.name)}
              </div>
            )}
            <div className="absolute left-4 top-4">
              <span className={`badge ${statusClass(player.status)} uppercase text-[10px] tracking-wider font-extrabold px-3 py-1 rounded-full shadow-lg`}>
                {player.status}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-extrabold text-white font-display leading-tight">{player.name}</h3>
                <p className="text-sm font-semibold text-amber-300 uppercase tracking-wider mt-0.5">{player.role}</p>
              </div>
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-400/20 border border-amber-400/30 text-amber-300">
                <Trophy className="w-5 h-5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm pt-2">
              <Info label="Batting Style" value={player.batting_style} />
              <Info label="Bowling Style" value={player.bowling_style} />
              <Info label="Base Price" value={formatMoney(player.base_price)} />
              <Info label="Current Bid" value={formatMoney(player.current_bid)} />
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-2">
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3.5 text-xs text-slate-300 font-medium">
            {player.status === 'Sold' ? (
              <>
                Sold to <b className="text-amber-400 font-bold">{player.sold_to_team}</b> for{' '}
                <b className="text-emerald-400 font-bold">{formatMoney(player.sold_price)}</b>
              </>
            ) : (
              <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <Zap className="w-3.5 h-3.5" /> Approved for Live Auction Pool
              </span>
            )}
          </div>
        </div>
      </SpotlightCard>
    </TiltCard>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">{label}</p>
      <p className="font-bold text-white text-sm truncate">{value || 'N/A'}</p>
    </div>
  );
}
