'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight, CircleDot, Gavel, ShieldCheck, Trophy, Users } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

const TrophyScene = dynamic(
  () => import('@/components/home/TrophyScene').then((module) => module.TrophyScene),
  { ssr: false, loading: () => <div className="hero-scene-loading" /> },
);

const metrics = [
  { label: 'Live bidding', value: 'Realtime', icon: CircleDot },
  { label: 'Team purse', value: '₹50,000', icon: Gavel },
  { label: 'Squad format', value: '4 + captain', icon: Users },
];

export function Hero3D() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="liquid-hero">
      <div className="liquid-hero__beam liquid-hero__beam--left" aria-hidden="true" />
      <div className="liquid-hero__beam liquid-hero__beam--right" aria-hidden="true" />
      <div className="liquid-hero__inner">
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="liquid-hero__copy"
        >
          <div className="hero-kicker"><CircleDot size={14} /> season 08 · the live auction</div>
          <p className="hero-overline">Ashoka Premier League</p>
          <h1>Where every<br /><em>bid becomes</em><br />a headline.</h1>
          <p className="hero-description">The stadium-grade auction experience for the people building the next unforgettable cricket squad.</p>
          <div className="hero-actions">
            <Link href="/auction" className="hero-primary-action">Enter the live room <ArrowUpRight size={18} /></Link>
            <Link href="/player-registration" className="hero-secondary-action">Register as player <ArrowDownRight size={18} /></Link>
          </div>
          <div className="hero-trust"><ShieldCheck size={16} /> protected budgets · verified captains · instant updates</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="hero-trophy-stage"
        >
          <div className="hero-trophy-stage__halo" aria-hidden="true" />
          <div className="hero-trophy-stage__caption"><Trophy size={14} /> APL championship trophy</div>
          <TrophyScene />
          <div className="hero-trophy-stage__orb hero-trophy-stage__orb--one" aria-hidden="true" />
          <div className="hero-trophy-stage__orb hero-trophy-stage__orb--two" aria-hidden="true" />
        </motion.div>
      </div>
      <div className="hero-metric-rail">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="hero-metric">
            <span><Icon size={15} /></span>
            <div><strong>{value}</strong><small>{label}</small></div>
          </div>
        ))}
      </div>
    </section>
  );
}
