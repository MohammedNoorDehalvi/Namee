"use client";

import Link from 'next/link';
import { Shield, Radio, UserRound, Trophy } from 'lucide-react';
import { useAuctionRealtime } from '@/hooks/useAuctionRealtime';

export function HomeAuctionGate({ children }: { children: React.ReactNode }) {
  const { auction, loading } = useAuctionRealtime({ pollMs: 900 });

  if (loading || auction?.auction_status !== 'LIVE') {
    return <>{children}</>;
  }

  return (
    <main className="section-shell py-10 sm:py-16">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-yellow-300/20 bg-white/[0.06] p-6 shadow-2xl backdrop-blur sm:p-10">
        <div className="absolute inset-0 bg-grid opacity-70" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-green-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-yellow-300/20 blur-3xl" />

        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-[1.7rem] border border-yellow-300/30 bg-yellow-300/10 text-yellow-300 shadow-xl shadow-yellow-500/10 apl-pulse">
            <Trophy size={34} />
          </div>

          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-green-300/25 bg-green-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-green-200">
            <Radio size={15} /> Auction is live now
          </p>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-6xl">APL Live Auction Room</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/65">
            The homepage is locked into live auction mode. Choose one option to continue.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <HomeButton href="/captain-login" icon={<UserRound size={19} />} label="Captain Login" />
            <HomeButton href="/admin-login" icon={<Shield size={19} />} label="Admin Login" />
            <HomeButton href="/auction" icon={<Radio size={19} />} label="See Live Auction" primary />
          </div>
        </div>
      </section>
    </main>
  );
}

function HomeButton({ href, icon, label, primary }: { href: string; icon: React.ReactNode; label: string; primary?: boolean }) {
  return (
    <Link href={href} className={primary ? 'btn-primary w-full' : 'btn-ghost w-full'}>
      {icon}
      {label}
    </Link>
  );
}
