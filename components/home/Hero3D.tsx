'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRef } from 'react';
import { ArrowUpRight, Gavel, Radio, Users, Zap } from 'lucide-react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';

import { GlassCard, GlassButton, GlassEffect } from '@/components/ui/liquid-glass';
import { FlipWords } from '@/components/ui/FlipWords';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { SparklesCore } from '@/components/ui/SparklesCore';

const SplineRobotScene = dynamic(
  () => import('@/components/home/SplineRobotScene').then((m) => m.SplineRobotScene),
  { ssr: false, loading: () => <div className="w-full h-full min-h-[380px]" /> },
);

/* ── Animation constants ──────────────────────────── */
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const HEADLINE_WORDS = [
  'NEXT GENERATION',
  'REAL-TIME DIGITAL',
  'HIGH-STAKES FRANCHISE',
  'SEATED CHAMPIONSHIP',
];

export function Hero3D() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  const titleY = useTransform(scrollYProgress, [0, 0.9], ['0%', reduceMotion ? '0%' : '15%']);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0.1]);

  return (
    <section ref={sectionRef} className="relative min-h-screen pt-28 pb-16 flex flex-col justify-between overflow-hidden bg-transparent">
      {/* Background Sparkles Effect */}
      <div className="absolute inset-0 z-0 opacity-60 pointer-events-none">
        <SparklesCore
          background="transparent"
          minSize={0.6}
          maxSize={2.2}
          particleDensity={70}
          particleColor="#F59E0B"
        />
      </div>

      {/* Ambient Radial Lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-cyan-500/20 via-amber-500/20 to-violet-500/20 blur-[160px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 w-full flex-1 flex flex-col justify-center">
        {/* Top Floating Liquid Glass Badge */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
            className="inline-block"
          >
            <GlassEffect className="px-5 py-2 rounded-full border border-amber-400/30">
              <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-widest text-amber-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                </span>
                <span>APL SEASON 8 · DIGITAL CRICKET AUCTION</span>
              </div>
            </GlassEffect>
          </motion.div>
        </div>

        {/* Main Kinetic SaaS Title with 21st.dev FlipWords */}
        <motion.div
          style={{ y: titleY, opacity: titleOpacity }}
          className="text-center max-w-5xl mx-auto space-y-6"
        >
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.15 }}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold font-display tracking-tight text-white leading-[1.08]"
          >
            THE{' '}
            <FlipWords words={HEADLINE_WORDS} className="text-gradient-gold" />
            <br />
            <span className="text-gradient-cyan">CRICKET AUCTION</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.3 }}
            className="text-slate-200 text-base sm:text-xl md:text-2xl font-normal max-w-3xl mx-auto leading-relaxed"
          >
            Real-time bidding, protected team purses, and the high-stakes drama of building a championship squad — all in one arena.
          </motion.p>

          {/* Liquid Glass CTA Actions */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4"
          >
            <GlassButton href="/player-registration" variant="amber" className="px-10 py-5 rounded-full text-slate-950 font-extrabold text-base">
              <span>Enter Player Draft</span>
              <ArrowUpRight className="w-5 h-5" />
            </GlassButton>

            <GlassButton href="/auction" variant="emerald" className="px-10 py-5 rounded-full text-white font-extrabold text-base">
              <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
              <span>Watch Live Bidding</span>
            </GlassButton>
          </motion.div>
        </motion.div>

        {/* 3D Robot Spline Scene (Stadium Background) */}
        <div className="relative w-full max-w-5xl mx-auto h-[380px] sm:h-[480px] md:h-[540px] my-8">
          <SplineRobotScene />
        </div>

        {/* Live Stats Ticker Bar with 21st.dev AnimatedNumbers */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.6 }}
          className="max-w-5xl mx-auto w-full"
        >
          <GlassCard className="rounded-3xl p-6 border-white/20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/10">
                <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-300">
                  <Gavel className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xl font-extrabold text-white font-display leading-none">
                    <AnimatedNumber value={50000} prefix="₹" />
                  </span>
                  <span className="text-xs text-slate-300 font-medium">Max Team Purse</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/10">
                <div className="p-2.5 rounded-xl bg-cyan-400/20 text-cyan-300">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xl font-extrabold text-white font-display leading-none">
                    4 + 1 Capt.
                  </span>
                  <span className="text-xs text-slate-300 font-medium">Squad Format</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/10">
                <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-300">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xl font-extrabold text-white font-display leading-none">
                    <AnimatedNumber value={4} suffix=" Teams" />
                  </span>
                  <span className="text-xs text-slate-300 font-medium">Franchise Squads</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/10">
                <div className="p-2.5 rounded-xl bg-emerald-400/20 text-emerald-300">
                  <Zap className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <span className="block text-xl font-extrabold text-emerald-400 font-display leading-none">
                    Live Sync
                  </span>
                  <span className="text-xs text-slate-300 font-medium">WebSocket Engine</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}
