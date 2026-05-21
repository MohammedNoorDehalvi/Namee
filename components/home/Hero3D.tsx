"use client";

import Link from 'next/link';
import { ArrowRight, BadgeDollarSign, Radio, ShieldCheck, Trophy, Users } from 'lucide-react';
import { useAuctionRealtime } from '@/hooks/useAuctionRealtime';
import { formatMoney } from '@/lib/format';

const heroButtons = [
  ['Register Player', '/player-registration'],
  ['View Players', '/players'],
  ['Captain Login', '/captain-login'],
  ['Admin Login', '/admin-login'],
  ['Live Auction', '/auction'],
  ['Captain Dashboard', '/captain-dashboard'],
  ['Admin Dashboard', '/admin-dashboard'],
  ['Teams', '/teams'],
] as const;

export function Hero3D() {
  const { auction, currentPlayer, currentBid, teams, loading } = useAuctionRealtime({ pollMs: 1200 });

  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl backdrop-blur sm:p-8 lg:p-10">
      <div className="absolute inset-0 bg-grid opacity-70" />
      <div className="absolute -right-20 top-8 h-64 w-64 rounded-full bg-green-400/20 blur-3xl" />
      <div className="absolute -left-20 bottom-8 h-64 w-64 rounded-full bg-yellow-300/20 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="badge border-yellow-300/25 bg-yellow-300/10 text-yellow-200">
            <Trophy size={15} /> Ashoka Premier League
          </p>

          <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-7xl">
            APL Online <span className="bg-gradient-to-r from-yellow-200 via-yellow-400 to-green-300 bg-clip-text text-transparent">Auction</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-white/64 sm:text-lg">
            Register as a player and get selected by captains in a premium IPL-style live cricket auction with realtime bids, budgets, teams, and admin control.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {heroButtons.map(([label, href], index) => (
              <Link key={href} href={href} className={index === 0 ? 'btn-primary col-span-2 sm:col-span-1' : 'btn-ghost'}>
                <span className="truncate">{label}</span>
                {index === 0 && <ArrowRight size={16} />}
              </Link>
            ))}
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <Mini icon={<Radio size={18} />} label="Auction Status" value={loading ? 'Loading' : auction?.auction_status || 'NOT_STARTED'} />
            <Mini icon={<Users size={18} />} label="Teams" value={String(teams.length)} />
            <Mini icon={<BadgeDollarSign size={18} />} label="Current Bid" value={formatMoney(currentBid)} />
          </div>
        </div>

        <div className="relative min-h-[420px]">
          <div className="absolute left-4 top-4 h-28 w-28 rounded-full bg-yellow-300/20 blur-2xl" />
          <div className="absolute bottom-2 right-0 h-36 w-36 rounded-full bg-green-400/20 blur-2xl" />

          <div className="apl-float relative mx-auto max-w-md rounded-[2.2rem] border border-white/12 bg-black/25 p-4 shadow-2xl">
            <div className="overflow-hidden rounded-[1.7rem] border border-white/10 bg-white/[0.06]">
              {currentPlayer?.photo_url ? (
                <img src={currentPlayer.photo_url} alt={currentPlayer.name} className="h-64 w-full object-cover" loading="lazy" />
              ) : (
                <div className="grid h-64 w-full place-items-center bg-gradient-to-br from-yellow-300/18 via-white/5 to-green-300/16">
                  <Trophy className="h-20 w-20 text-yellow-300" />
                </div>
              )}

              <div className="p-5">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-green-300">Live Lot</p>
                <h2 className="mt-2 text-3xl font-black text-white">{currentPlayer?.name || 'Waiting for player'}</h2>
                <p className="mt-2 text-sm text-white/55">
                  {currentPlayer ? `${currentPlayer.role} • ${currentPlayer.batting_style}` : 'Admin will select the first player'}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Mini label="Base" value={formatMoney(currentPlayer?.base_price)} icon={<ShieldCheck size={17} />} compact />
                  <Mini label="Bid" value={formatMoney(currentBid)} icon={<BadgeDollarSign size={17} />} compact />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Mini({ label, value, icon, compact }: { label: string; value: string; icon: React.ReactNode; compact?: boolean }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-black/18 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center gap-2 text-yellow-300">{icon}<span className="text-xs font-black uppercase tracking-wider text-white/45">{label}</span></div>
      <p className={`${compact ? 'text-xl' : 'text-2xl'} mt-2 truncate font-black text-white`}>{value}</p>
    </div>
  );
}
