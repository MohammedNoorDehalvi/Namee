"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Radio, UserRound } from 'lucide-react';
import { useAuctionRealtime } from '@/hooks/useAuctionRealtime';

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const SPRING_BUTTON = { type: 'spring' as const, stiffness: 400, damping: 25, mass: 0.8 };

export function HomeAuctionGate({ children }: { children: React.ReactNode }) {
  const { auction, loading } = useAuctionRealtime();

  if (loading || auction?.auction_status !== 'LIVE') return <>{children}</>;

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-stadium px-4 py-16">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-apl-gold/15 blur-3xl" />
      <div className="absolute right-1/4 bottom-20 h-48 w-48 rounded-full bg-apl-neon/8 blur-3xl" />

      <motion.section
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
        className="relative mx-auto flex max-w-4xl flex-col items-center justify-center text-center"
      >
        {/* Live badge with pulse */}
        <motion.span
          className="inline-flex items-center gap-2 rounded-full border border-apl-gold/30 bg-apl-gold/8 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-apl-gold"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: EASE_OUT_EXPO }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-apl-neon animate-pulse" />
          Auction is live now
        </motion.span>

        <motion.h1
          className="mt-6 text-4xl font-black tracking-tight sm:text-6xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: EASE_OUT_EXPO }}
        >
          APL Live Auction Room
        </motion.h1>

        <motion.p
          className="mt-4 max-w-2xl text-base text-white/55 sm:text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          The homepage is locked into live auction mode. Choose one option to continue.
        </motion.p>

        <motion.div
          className="mt-10 grid w-full gap-3 sm:grid-cols-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: EASE_OUT_EXPO }}
        >
          <GateButton href="/captain-login" icon={<UserRound className="h-5 w-5" />} label="Captain Login" />
          <GateButton href="/admin-login" icon={<Shield className="h-5 w-5" />} label="Admin Login" />
          <GateButton href="/auction" icon={<Radio className="h-5 w-5" />} label="See Live Auction" primary />
        </motion.div>
      </motion.section>
    </main>
  );
}

function GateButton({ href, icon, label, primary }: { href: string; icon: React.ReactNode; label: string; primary?: boolean }) {
  return (
    <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} transition={SPRING_BUTTON}>
      <Link
        href={href}
        className={primary
          ? 'btn-primary min-h-16 w-full text-base'
          : 'btn-ghost min-h-16 w-full text-base'
        }
      >
        {icon}
        {label}
      </Link>
    </motion.div>
  );
}
