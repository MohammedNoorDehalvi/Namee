'use client';

import Link from 'next/link';
import { ArrowUpRight, Gavel, Radio, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { LiveBidSimulator } from './LiveBidSimulator';
import { SaaSFeatures } from './SaaSFeatures';
import { AuctionCalculator } from './AuctionCalculator';
import { FaqSection } from './FaqSection';
import { SaaSFooterCTA } from './SaaSFooterCTA';
import { GlassCard } from '@/components/ui/liquid-glass';

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const journeys = [
  {
    number: '01',
    title: 'Declare Your Game',
    body: 'Register your role, batting style, bowling style, and story. Every approved player enters the official live selection pool.',
    href: '/player-registration',
    label: 'Player Registration',
    icon: Users,
  },
  {
    number: '02',
    title: 'Command The Auction Floor',
    body: 'Franchise captains bid against the clock with protected budgets, real-time purse validation, and a clear tactical view of rival squads.',
    href: '/captain-login',
    label: 'Captain Portal Access',
    icon: Gavel,
  },
  {
    number: '03',
    title: 'Watch The Drama Unfold',
    body: 'One public stadium arena updated in real-time—from base price call out to the season-defining final hammer drop.',
    href: '/auction',
    label: 'Watch Live Auction',
    icon: Radio,
  },
];

const RIBBON_GOLD = 'Man Of The Match · Man Of The Tournament · APL 8 · The Grand Season · Tehmeed · Naved · Anas · ';
const RIBBON_WHITE = 'Live Bidding · Real-Time Engine · Sub-10ms Latency · Budget Shield · Championship Strategy · Digital Cricket · ';

export function ScrollShowcase() {
  const reduceMotion = useReducedMotion();

  return (
    <main id="experience" className="home-experience bg-transparent text-white">
      {/* ── 1. MANIFESTO SECTION IN LIQUID GLASS ─────── */}
      <section className="py-24 px-4 md:px-6 max-w-7xl mx-auto">
        <GlassCard className="p-8 md:p-14 rounded-3xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-4 space-y-3">
              <span className="px-3.5 py-1.5 rounded-full bg-amber-400/20 text-amber-300 font-extrabold text-xs tracking-widest uppercase font-display inline-block">
                02 / LEAGUE MANIFESTO
              </span>
              <p className="text-slate-200 text-sm leading-relaxed">
                A championship is built one high-stakes decision at a time.
              </p>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold font-display tracking-tight leading-tight text-white">
                ONE ARENA. <br />
                EVERY BID. <br />
                <span className="text-gradient-cyan">IN REAL TIME.</span>
              </h2>
              <p className="text-slate-100 text-base md:text-xl leading-relaxed max-w-2xl">
                APL turns team building into a live digital spectacle—precise enough for franchise captains, transparent enough for spectators, and dramatic enough to define the whole season.
              </p>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* ── 2. INTERACTIVE LIVE BID SIMULATOR ───────── */}
      <LiveBidSimulator />

      {/* ── 3. BENTO GRID SAAS FEATURES ─────────────── */}
      <SaaSFeatures />

      {/* ── 4. DUAL TRACK MARQUEE RIBBON ─────────────── */}
      <div className="py-8 bg-slate-950/40 border-y border-white/10 overflow-hidden select-none backdrop-blur-md">
        <div className="flex whitespace-nowrap text-sm font-bold tracking-widest uppercase animate-marquee">
          <span className="text-amber-400 mx-4">{RIBBON_GOLD}{RIBBON_GOLD}</span>
        </div>
        <div className="flex whitespace-nowrap text-sm font-semibold tracking-widest uppercase text-cyan-400 opacity-90 mt-2 animate-marquee-reverse">
          <span className="mx-4">{RIBBON_WHITE}{RIBBON_WHITE}</span>
        </div>
      </div>

      {/* ── 5. THE AUCTION JOURNEY TIMELINE ──────────── */}
      <section className="py-24 max-w-7xl mx-auto px-4 md:px-6">
        <GlassCard className="p-8 mb-12 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-400/20 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Radio className="w-3.5 h-3.5" />
            <span>HOW IT WORKS</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold font-display tracking-tight text-white">
            The Journey From Player to <br />
            <span className="text-gradient-gold">Household Name</span>
          </h2>
        </GlassCard>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {journeys.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.number}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay: index * 0.15 }}
                className="h-full"
              >
                <GlassCard className="h-full flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-extrabold text-slate-400 font-display">{item.number}</span>
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white font-display">{item.title}</h3>
                    <p className="text-slate-200 text-sm leading-relaxed">{item.body}</p>
                  </div>

                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-2 text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors pt-2 group"
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── 6. STRATEGY & PURSE CALCULATOR ──────────── */}
      <AuctionCalculator />

      {/* ── 7. FAQ ACCORDION ────────────────────────── */}
      <FaqSection />

      {/* ── 8. HIGH-IMPACT SAAS CTA ──────────────────── */}
      <SaaSFooterCTA />
    </main>
  );
}
