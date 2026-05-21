"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Radio, UserRound } from 'lucide-react';
import { useAuctionRealtime } from '@/hooks/useAuctionRealtime';

export function HomeAuctionGate({ children }: { children: React.ReactNode }) {
  const { auction, loading } = useAuctionRealtime();

  if (loading || auction?.auction_status !== 'LIVE') return <>{children}</>;

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-stadium px-4 py-16">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-apl-gold/20 blur-3xl" />
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mx-auto flex max-w-4xl flex-col items-center justify-center text-center"
      >
        <span className="badge border-apl-gold/40 bg-apl-gold/10 text-apl-gold">Auction is live now</span>
        <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">
          APL Live Auction Room
        </h1>
        <p className="mt-4 max-w-2xl text-base text-white/70 sm:text-lg">
          The homepage is locked into live auction mode. Choose one option to continue.
        </p>

        <div className="mt-10 grid w-full gap-4 sm:grid-cols-3">
          <HomeButton href="/captain-login" icon={<UserRound className="h-5 w-5" />} label="Captain Login" />
          <HomeButton href="/admin-login" icon={<Shield className="h-5 w-5" />} label="Admin Login" />
          <HomeButton href="/auction" icon={<Radio className="h-5 w-5" />} label="See Live Auction" primary />
        </div>
      </motion.section>
    </main>
  );
}

function HomeButton({ href, icon, label, primary }: { href: string; icon: React.ReactNode; label: string; primary?: boolean }) {
  return (
    <Link href={href} className={primary ? 'btn-primary min-h-16 text-base' : 'btn-ghost min-h-16 text-base'}>
      {icon}
      {label}
    </Link>
  );
}
