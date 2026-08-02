"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Radio, UserRound, Sparkles } from 'lucide-react';
import { useAuctionRealtime } from '@/hooks/useAuctionRealtime';
import { GlassEffect, GlassButton, GlassFilter, GlassCard } from '@/components/ui/liquid-glass';

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const SPRING_BUTTON = { type: 'spring' as const, stiffness: 350, damping: 22, mass: 0.8 };

export function HomeAuctionGate({ children }: { children: React.ReactNode }) {
  const { auction, loading } = useAuctionRealtime();

  if (loading || auction?.auction_status !== 'LIVE') return <>{children}</>;

  return (
    <main
      className="relative min-h-[calc(100vh-4rem)] w-full flex items-center justify-center overflow-hidden px-4 py-16 font-light"
      style={{
        background: `url("https://images.unsplash.com/photo-1432251407527-504a6b4174a2?q=80&w=1480&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D") center center / cover no-repeat`,
        animation: 'moveBackground 60s linear infinite',
      }}
    >
      {/* Liquid Glass Filter for SVG Distortion */}
      <GlassFilter />

      {/* Dark overlay for optimal text contrast */}
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-md pointer-events-none" />

      {/* Ambient glowing light orbs */}
      <div className="absolute left-1/2 top-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-500/20 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

      <motion.section
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
        className="relative z-10 mx-auto flex max-w-4xl flex-col items-center justify-center text-center space-y-8 w-full"
      >
        {/* Liquid Glass Live Badge */}
        <GlassEffect className="rounded-full px-6 py-2.5 shadow-2xl">
          <div className="flex items-center gap-2.5 text-xs font-black uppercase tracking-[0.2em] text-amber-300">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
            </span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Auction is Live Now</span>
          </div>
        </GlassEffect>

        {/* Liquid Glass Main Content Box */}
        <GlassCard className="w-full p-8 sm:p-12 md:p-14 rounded-4xl flex flex-col items-center text-center shadow-2xl border border-white/20">
          <motion.h1
            className="text-4xl font-black tracking-tight sm:text-6xl text-white font-display leading-tight"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: EASE_OUT_EXPO }}
          >
            APL Live Auction Room
          </motion.h1>

          <motion.p
            className="mt-4 max-w-2xl text-base text-slate-200 sm:text-lg font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            The homepage is locked into live auction mode. Choose one option to continue.
          </motion.p>

          {/* Liquid Glass Navigation Buttons */}
          <motion.div
            className="mt-10 grid w-full gap-4 sm:grid-cols-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: EASE_OUT_EXPO }}
          >
            <LiquidGateButton
              href="/captain-login"
              icon={<UserRound className="h-5 w-5 text-amber-300" />}
              label="Captain Login"
            />
            <LiquidGateButton
              href="/admin-login"
              icon={<Shield className="h-5 w-5 text-cyan-300" />}
              label="Admin Login"
            />
            <LiquidGateButton
              href="/auction"
              icon={<Radio className="h-5 w-5 text-emerald-300" />}
              label="See Live Auction"
              primary
            />
          </motion.div>
        </GlassCard>
      </motion.section>
    </main>
  );
}

function LiquidGateButton({
  href,
  icon,
  label,
  primary,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }} transition={SPRING_BUTTON} className="w-full">
      <Link href={href} className="block w-full">
        <GlassButton
          variant={primary ? 'gold' : 'dark'}
          className={`w-full min-h-16 rounded-3xl px-6 py-4 flex items-center justify-center gap-3 transition-all duration-700 text-base font-bold ${
            primary
              ? 'bg-amber-400/25 text-amber-200 border border-amber-300/40 shadow-lg shadow-amber-500/20'
              : 'text-white border border-white/20 hover:border-white/40'
          }`}
        >
          {icon}
          <span>{label}</span>
        </GlassButton>
      </Link>
    </motion.div>
  );
}
