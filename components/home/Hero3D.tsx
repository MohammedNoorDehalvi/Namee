'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Gavel, Lock, Radio, Shield, Trophy, Users, Zap } from 'lucide-react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';

import { GlassCard, GlassEffect } from '@/components/ui/liquid-glass';
import { FlipWords } from '@/components/ui/FlipWords';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { SparklesCore } from '@/components/ui/SparklesCore';
import { RetroGrid } from '@/components/ui/RetroGrid';
import { ShimmerButton } from '@/components/ui/ShimmerButton';
import { OrbitingCircles } from '@/components/ui/OrbitingCircles';
import { Meteors } from '@/components/ui/Meteors';
import { useCurrentSeason } from '@/hooks/useCurrentSeason';

const SplineRobotScene = dynamic(
  () => import('@/components/home/SplineRobotScene').then((m) => m.SplineRobotScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[380px] w-full items-center justify-center rounded-3xl border border-white/10 bg-slate-950/40">
        <div className="h-12 w-12 animate-pulse rounded-full border-2 border-amber-400/30 border-t-amber-400" />
      </div>
    ),
  },
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
  const splineHostRef = useRef<HTMLDivElement>(null);
  const [loadSpline, setLoadSpline] = useState(false);
  const reduceMotion = useReducedMotion();
  const { displayName } = useCurrentSeason();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  const titleY = useTransform(scrollYProgress, [0, 0.9], ['0%', reduceMotion ? '0%' : '15%']);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0.1]);

  useEffect(() => {
    if (reduceMotion) return;
    const el = splineHostRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setLoadSpline(true);
          obs.disconnect();
        }
      },
      { rootMargin: '120px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [reduceMotion]);

  const particleDensity = reduceMotion ? 0 : 28;
  const meteorCount = reduceMotion ? 0 : 8;

  return (
    <section ref={sectionRef} className="relative min-h-screen pt-28 pb-16 flex flex-col justify-between overflow-hidden bg-transparent">
      {/* 21st.dev Retro Grid Background */}
      <RetroGrid angle={60} className="z-0 opacity-40" />

      {!reduceMotion && meteorCount > 0 && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <Meteors number={meteorCount} />
        </div>
      )}

      {!reduceMotion && particleDensity > 0 && (
        <div className="absolute inset-0 z-0 opacity-50 pointer-events-none">
          <SparklesCore
            background="transparent"
            minSize={0.6}
            maxSize={2}
            particleDensity={particleDensity}
            particleColor="#F59E0B"
          />
        </div>
      )}

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
                <span className="uppercase tracking-widest">
                  {displayName} · Digital cricket auction
                </span>
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
            {reduceMotion ? (
              <span className="text-gradient-gold">LIVE DIGITAL</span>
            ) : (
              <FlipWords words={HEADLINE_WORDS} className="text-gradient-gold" />
            )}
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

          {/* Primary decision row */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4"
          >
            <ShimmerButton href="/auction" shimmerColor="#10B981" className="px-7 py-3.5">
              <Radio className="w-5 h-5 text-emerald-400" />
              <span>Watch live</span>
            </ShimmerButton>

            <ShimmerButton href="/captain-login" shimmerColor="#F59E0B" className="px-7 py-3.5">
              <Lock className="w-5 h-5 text-amber-300" />
              <span>Captain login</span>
            </ShimmerButton>

            <ShimmerButton href="/player-registration" shimmerColor="#22D3EE" className="px-7 py-3.5">
              <span>Register player</span>
              <ArrowUpRight className="w-5 h-5 text-cyan-300" />
            </ShimmerButton>
          </motion.div>
        </motion.div>

        {/* 3D Robot — lazy when in view; static placeholder if reduced motion */}
        <div
          ref={splineHostRef}
          className="relative w-full max-w-5xl mx-auto h-[380px] sm:h-[480px] md:h-[540px] my-8 flex items-center justify-center overflow-hidden"
        >
          {reduceMotion ? (
            <div className="flex h-full w-full items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/90">
              <div className="text-center space-y-2 px-6">
                <Trophy className="mx-auto h-10 w-10 text-amber-300" />
                <p className="text-sm font-bold text-white">{displayName}</p>
                <p className="text-xs text-slate-400">3D scene paused for reduced motion</p>
              </div>
            </div>
          ) : loadSpline ? (
            <SplineRobotScene />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-3xl border border-white/10 bg-slate-950/50">
              <div className="h-12 w-12 animate-pulse rounded-full border-2 border-amber-400/30 border-t-amber-400" />
            </div>
          )}

          {!reduceMotion && (
            <>
              <OrbitingCircles radius={180} duration={25} delay={0}>
                <div className="w-8 h-8 rounded-full bg-slate-900 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-lg">
                  <Trophy className="w-4 h-4" />
                </div>
              </OrbitingCircles>
              <OrbitingCircles radius={180} duration={25} delay={12}>
                <div className="w-8 h-8 rounded-full bg-slate-900 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-lg">
                  <Zap className="w-4 h-4" />
                </div>
              </OrbitingCircles>
              <OrbitingCircles radius={280} duration={35} reverse delay={5}>
                <div className="w-8 h-8 rounded-full bg-slate-900 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shadow-lg">
                  <Shield className="w-4 h-4" />
                </div>
              </OrbitingCircles>
            </>
          )}
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
