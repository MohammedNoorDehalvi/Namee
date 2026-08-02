'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles, Trophy, Zap, User } from 'lucide-react';
import { SpotlightCard } from '@/components/ui/SpotlightCard';

type Category = 'all' | 'batsman' | 'bowler' | 'allrounder' | 'wicketkeeper';

interface PlayerSample {
  id: string;
  name: string;
  category: Category;
  roleLabel: string;
  basePrice: string;
  stat: string;
  statLabel: string;
  rating: string;
}

const SAMPLE_PLAYERS: PlayerSample[] = [
  {
    id: '1',
    name: 'Tehmeed Patel',
    category: 'allrounder',
    roleLabel: 'Pace All-Rounder',
    basePrice: '₹5,000',
    stat: '154.2 SR',
    statLabel: 'T20 Batting Strike Rate',
    rating: '98.5',
  },
  {
    id: '2',
    name: 'Naved Khan',
    category: 'batsman',
    roleLabel: 'Opener / Power hitter',
    basePrice: '₹4,500',
    stat: '62.4 Avg',
    statLabel: 'Season Batting Average',
    rating: '96.8',
  },
  {
    id: '3',
    name: 'Anas Shaikh',
    category: 'bowler',
    roleLabel: 'Right-arm Express',
    basePrice: '₹4,000',
    stat: '6.45 Econ',
    statLabel: 'Economy Rate',
    rating: '95.2',
  },
  {
    id: '4',
    name: 'Zaid Siddiqui',
    category: 'wicketkeeper',
    roleLabel: 'Keeper / Finisher',
    basePrice: '₹3,500',
    stat: '18 Dis',
    statLabel: 'Season Dismissals',
    rating: '93.7',
  },
  {
    id: '5',
    name: 'Hamza Farooqui',
    category: 'batsman',
    roleLabel: 'Middle Order Anchor',
    basePrice: '₹3,000',
    stat: '142.8 SR',
    statLabel: 'Strike Rate vs Spin',
    rating: '91.4',
  },
  {
    id: '6',
    name: 'Rehan Qureshi',
    category: 'bowler',
    roleLabel: 'Left-Arm Mystery',
    basePrice: '₹3,500',
    stat: '14.2 SR',
    statLabel: 'Bowling Strike Rate',
    rating: '94.1',
  },
];

export function PlayerPoolShowcase() {
  const [activeTab, setActiveTab] = useState<Category>('all');

  const filtered = activeTab === 'all'
    ? SAMPLE_PLAYERS
    : SAMPLE_PLAYERS.filter((p) => p.category === activeTab);

  return (
    <section className="py-20 px-4 md:px-6 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
          <Trophy className="w-3.5 h-3.5" />
          <span>Registered Talent Pool</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold font-display tracking-tight text-white">
          Interactive <span className="text-gradient-gold">Player Pool</span> Showcase
        </h2>
        <p className="text-slate-400 text-sm md:text-base">
          Filter through elite registered players entering the upcoming auction pool.
        </p>

        {/* Category Toggles */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
          {[
            { id: 'all', label: 'All Players' },
            { id: 'batsman', label: 'Batsmen' },
            { id: 'bowler', label: 'Bowlers' },
            { id: 'allrounder', label: 'All-Rounders' },
            { id: 'wicketkeeper', label: 'Wicketkeepers' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id as Category)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
                activeTab === cat.id
                  ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 scale-105'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Interactive Spotlight Cards */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filtered.map((player) => (
            <motion.div
              key={player.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <SpotlightCard className="h-full flex flex-col justify-between space-y-4 border-white/10 bg-slate-900/90 hover:border-amber-500/40">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                      {player.roleLabel}
                    </span>
                    <span className="text-xs font-extrabold text-cyan-400 font-display flex items-center gap-1">
                      <Zap className="w-3 h-3" /> {player.rating} Rating
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-amber-400">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white font-display">{player.name}</h3>
                      <p className="text-xs text-slate-400">Base Price: <span className="text-white font-semibold">{player.basePrice}</span></p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">{player.statLabel}</span>
                    <span className="text-base font-extrabold text-white font-display">{player.stat}</span>
                  </div>
                  <Sparkles className="w-4 h-4 text-amber-400 opacity-60" />
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
