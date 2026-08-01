'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRef } from 'react';
import { ArrowDown, ArrowUpRight, Flame, Gavel, Radio, ShieldCheck, Sparkles, Trophy, Users, Zap } from 'lucide-react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';

const SplineTrophyScene = dynamic(
  () => import('@/components/home/SplineTrophyScene').then((m) => m.SplineTrophyScene),
  { ssr: false, loading: () => <div className="w-full h-full min-h-[350px]" /> },
);

/* ── Animation constants ──────────────────────────── */
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const SPRING_BUTTON = { type: 'spring' as const, stiffness: 400, damping: 25, mass: 0.8 };

const STATS = [
  { label: 'Max Team Budget', value: '₹50,000', icon: Gavel },
  { label: 'Squad Format', value: '4 + 1 Capt.', icon: Users },
  { label: 'Franchise Squads', value: '4 Teams', icon: Trophy },
  { label: 'Live Bidding', value: 'Real-Time', icon: Zap },
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
    <section ref={sectionRef} className="relative min-h-screen pt-28 pb-16 flex flex-col justify-between overflow-hidden bg-slate-950">
      {/* Background Radial Lights & Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-500/15 via-amber-500/15 to-violet-500/15 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 w-full flex-1 flex flex-col justify-center">
        {/* Top Floating Badge */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-white/10 text-xs font-bold uppercase tracking-widest text-slate-200 shadow-xl backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
            </span>
            <span className="text-gradient-amber">APL SEASON 8 · DIGITAL CRICKET AUCTION</span>
          </motion.div>
        </div>

        {/* Main Kinetic SaaS Title */}
        <motion.div
          style={{ y: titleY, opacity: titleOpacity }}
          className="text-center max-w-5xl mx-auto space-y-6"
        >
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.15 }}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold font-display tracking-tight text-white leading-[1.05]"
          >
            THE NEXT GENERATION <br />
            <span className="text-gradient-cyan">CRICKET AUCTION</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.3 }}
            className="text-slate-300 text-base sm:text-xl md:text-2xl font-normal max-w-3xl mx-auto leading-relaxed"
          >
            Real-time bidding, protected team purses, and the high-stakes drama of building a championship squad — all in one arena.
          </motion.p>

          {/* CTA Actions */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
          >
            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} transition={SPRING_BUTTON}>
              <Link
                href="/player-registration"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-extrabold text-base shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Enter Player Draft</span>
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} transition={SPRING_BUTTON}>
              <Link
                href="/auction"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-white/15 text-white font-bold text-base shadow-xl backdrop-blur-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                <span>Watch Live Bidding</span>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Interactive 3D Showcase Canvas */}
        <div className="relative w-full max-w-5xl mx-auto h-[360px] sm:h-[480px] md:h-[540px] my-6">
          <SplineTrophyScene />
        </div>

        {/* Live Stats Ticker Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-3xl backdrop-blur-xl bg-slate-900/60 border border-white/10 max-w-5xl mx-auto w-full shadow-2xl"
        >
          {STATS.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-lg font-extrabold text-white font-display leading-none">{value}</span>
                <span className="text-xs text-slate-400 font-medium">{label}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom Scroll Indicator */}
      <div className="text-center pt-8">
        <a
          href="#experience"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <span>EXPLORE PLATFORM</span>
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </a>
      </div>
    </section>
  );
}
