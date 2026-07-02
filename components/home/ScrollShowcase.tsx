'use client';

import Link from 'next/link';
import { ArrowUpRight, Gavel, Radio, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

const journeys = [
  {
    number: '01',
    title: 'Declare your game',
    body: 'Register your role, style and story. Every approved player enters the live selection pool.',
    href: '/player-registration',
    label: 'Player registration',
    icon: Users,
  },
  {
    number: '02',
    title: 'Read the room',
    body: 'Captains bid against the clock with protected budgets and a clear view of every move.',
    href: '/captain-login',
    label: 'Captain access',
    icon: Gavel,
  },
  {
    number: '03',
    title: 'Watch it unfold',
    body: 'One public arena, updated in real time—from first call to the season-defining final bid.',
    href: '/auction',
    label: 'Live auction',
    icon: Radio,
  },
];

const capabilities = [
  { title: 'Realtime', body: 'Every bid lands instantly across the room.', icon: Radio },
  { title: 'Protected', body: 'Team budgets and access are enforced by design.', icon: ShieldCheck },
  { title: 'Human', body: 'Simple controls keep attention on the contest.', icon: Sparkles },
];

export function ScrollShowcase() {
  const reduceMotion = useReducedMotion();
  const reveal = {
    initial: { opacity: 0, y: reduceMotion ? 0 : 42 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.22 },
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <main id="experience" className="home-experience">
      <section className="home-manifesto section-shell">
        <motion.div {...reveal} className="home-manifesto__eyebrow">
          <span>02</span>
          <p>A league is built<br />one decision at a time.</p>
        </motion.div>
        <motion.h2 {...reveal} transition={{ ...reveal.transition, delay: 0.08 }}>
          ONE ARENA.<br />EVERY BID.<br /><em>IN REAL TIME.</em>
        </motion.h2>
        <motion.p {...reveal} className="home-manifesto__copy">
          APL turns the ritual of team building into a live digital spectacle—precise enough for captains,
          transparent enough for everyone, and dramatic enough to remember.
        </motion.p>
      </section>

      <div className="word-ribbon" aria-hidden="true">
        <div>Man Of The Match · Man Of The Tournament · 1st Turf Tournament · APL 8 · The Grand Season · Tehmeed · Naved · Anas ·</div>
      </div>

      <section className="journey section-shell" aria-labelledby="journey-title">
        <div className="journey__intro">
          <p className="kicker"><span /> THE AUCTION JOURNEY</p>
          <h2 id="journey-title">From hopeful<br />to <em>household name.</em></h2>
        </div>

        <div className="journey__list">
          {journeys.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.number}
                {...reveal}
                transition={{ ...reveal.transition, delay: index * 0.08 }}
                className="journey-card"
              >
                <div className="journey-card__number">{item.number}</div>
                <div className="journey-card__icon"><Icon size={21} /></div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
                <Link href={item.href} aria-label={item.label} className="journey-card__link">
                  <span>{item.label}</span><ArrowUpRight size={20} />
                </Link>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="capabilities section-shell" aria-label="Platform strengths">
        {capabilities.map(({ title, body, icon: Icon }, index) => (
          <motion.article key={title} {...reveal} transition={{ ...reveal.transition, delay: index * 0.08 }}>
            <div><Icon size={20} /></div>
            <p>{title}</p>
            <span>{body}</span>
          </motion.article>
        ))}
      </section>

      <section className="home-cta section-shell">
        <motion.div {...reveal} className="home-cta__inner">
          <p className="kicker"><span /> YOUR SEASON STARTS HERE</p>
          <h2>READY WHEN<br /><em>YOU ARE.</em></h2>
          <div className="home-cta__actions">
            <Link href="/player-registration" className="btn-primary">Register now <ArrowUpRight size={18} /></Link>
            <Link href="/players" className="btn-ghost">Meet the players</Link>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
