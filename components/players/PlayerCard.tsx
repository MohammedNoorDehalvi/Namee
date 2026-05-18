import Image from 'next/image';
import { Trophy } from 'lucide-react';
import type { Player } from '@/lib/types';
import { formatMoney, initials, statusClass } from '@/lib/format';

export function PlayerCard({ player }: { player: Player }) {
  return (
    <article className="scroll-3d-card glass-card overflow-hidden rounded-[2rem]">
      <div className="relative h-56 bg-gradient-to-br from-apl-gold/20 to-apl-green/20">
        {player.photo_url ? <Image src={player.photo_url} alt={player.name} fill className="object-cover" /> : <div className="grid h-full place-items-center text-5xl font-black text-apl-gold">{initials(player.name)}</div>}
        <div className="absolute left-4 top-4"><span className={`badge ${statusClass(player.status)}`}>{player.status}</span></div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black">{player.name}</h3>
            <p className="text-white/60">{player.role}</p>
          </div>
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-apl-gold/15 text-apl-gold"><Trophy size={20} /></div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <Info label="Batting" value={player.batting_style} />
          <Info label="Bowling" value={player.bowling_style} />
          <Info label="Base" value={formatMoney(player.base_price)} />
          <Info label="Current" value={formatMoney(player.current_bid)} />
        </div>
        <div className="mt-4 rounded-2xl bg-white/5 p-3 text-sm text-white/65">
          {player.status === 'Sold' ? <>Sold to <b className="text-apl-gold">{player.sold_to_team}</b> for <b>{formatMoney(player.sold_price)}</b></> : 'Ready for auction selection'}
        </div>
      </div>
    </article>
  );
}
function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><p className="text-xs text-white/45">{label}</p><p className="font-bold">{value}</p></div>;
}
