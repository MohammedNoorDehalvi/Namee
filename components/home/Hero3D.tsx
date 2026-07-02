'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRef } from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

const TrophyScene = dynamic(
  () => import('@/components/home/TrophyScene').then((module) => module.TrophyScene),
  { ssr: false, loading: () => <div className="trophy-scene" /> },
);

export function Hero3D() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });
  const titleY = useTransform(scrollYProgress, [0, 0.9], ['0%', reduceMotion ? '0%' : '20%']);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.72], [1, 0.08]);
  const detailsY = useTransform(scrollYProgress, [0, 0.75], [0, reduceMotion ? 0 : -70]);

  return (
    <section ref={sectionRef} className="home-hero" aria-labelledby="hero-title">
      <div className="home-hero__sticky">
        <div className="home-hero__wash" />
        <div className="home-hero__grid" />

        <motion.h1 id="hero-title" className="home-hero__title" style={{ y: titleY, opacity: titleOpacity }}>
          <span>ASHOKA</span>
          <span>PREMIER LEAGUE</span>
        </motion.h1>

        <div className="home-hero__scene">
          <TrophyScene />
        </div>

        <motion.div
          className="home-hero__meta home-hero__meta--left"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          style={{ y: detailsY }}
        >
          <p className="kicker"><span /> APL · DIGITAL AUCTION</p>
          <p className="home-hero__lede">The next name called could change the whole season.</p>
          <div className="home-hero__actions">
            <Link href="/player-registration" className="btn-primary">Enter the league <ArrowUpRight size={17} /></Link>
            <Link href="/auction" className="text-link">Watch auction <ArrowUpRight size={16} /></Link>
          </div>
        </motion.div>

        <motion.div
          className="home-hero__meta home-hero__meta--right"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.42 }}
          style={{ y: detailsY }}
        >
          <p className="home-hero__index">01 <span>/</span> THE PRIZE</p>
          <p>Built for players, captains<br />and every impossible bid.</p>
        </motion.div>

        <motion.a
          className="home-hero__scroll"
          href="#experience"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          aria-label="Scroll to explore"
        >
          <span>Explore</span><ArrowDown size={15} />
        </motion.a>
      </div>
    </section>
  );
}
