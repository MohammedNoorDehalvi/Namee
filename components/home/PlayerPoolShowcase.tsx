'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles, Trophy, Zap, User } from 'lucide-react';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { TiltCard } from '@/components/ui/TiltCard';
import { useApprovedPlayers } from '@/hooks/usePlayers';
import { formatMoney, initials, statusClass } from '@/lib/format';
import type { PlayerRole } from '@/lib/types';
import Image from 'next/image';

type RoleFilter = 'All' | PlayerRole;

export function PlayerPoolShowcase() {
  const [activeTab, setActiveTab] = useState<RoleFilter>('All');
  const { players, loading } = useApprovedPlayers();

  const filtered = activeTab === 'All'
    ? players
    : players.filter((p) => p.role.toLowerCase().includes(activeTab.toLowerCase()));

  return (
    <section className="py-20 px-4 md:px-6 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
          <Trophy className="w-3.5 h-3.5" />
          <span>Official Talent Pool</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold font-display tracking-tight text-white">
          Registered <span className="text-gradient-gold">Player Pool</span> Showcase
        </h2>
        <p className="text-slate-300 text-sm md:text-base">
          Browse verified registered players in the official auction pool.
        </p>

        {/* Category Toggles */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
          {[
            { id: 'All', label: 'All Players' },
            { id: 'Batter', label: 'Batters' },
            { id: 'Bowler', label: 'Bowlers' },
            { id: 'All-rounder', label: 'All-Rounders' },
            { id: 'Wicketkeeper', label: 'Wicketkeepers' },
          ].map((cat) => {
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id as RoleFilter)}
                className={`relative px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                  isActive
                    ? 'text-slate-950 shadow-lg shadow-amber-500/30 font-extrabold scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-player-tab"
                    className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-16 text-center text-slate-400 font-medium">
          Loading live player pool...
        </div>
      )}

      {/* Empty state when no players exist */}
      {!loading && filtered.length === 0 && (
        <div className="py-16 px-6 text-center rounded-3xl border border-white/10 bg-slate-900/60 max-w-xl mx-auto space-y-3">
          <User className="w-10 h-10 text-amber-400 mx-auto opacity-70" />
          <h3 className="text-xl font-bold text-white font-display">No Approved Players Found</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            {activeTab === 'All'
              ? 'No approved players in the current season pool yet. They appear here after admin approval.'
              : `No approved players registered under the "${activeTab}" category.`}
          </p>
        </div>
      )}

      {/* Grid of Interactive Real Player Cards */}
      {!loading && filtered.length > 0 && (
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
                <TiltCard tiltMaxAngle={12} glareOpacity={0.12}>
                  <SpotlightCard className="h-full flex flex-col justify-between space-y-4 border-white/15 bg-slate-900/90 hover:border-amber-500/40 p-6 rounded-3xl">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
                          {player.role}
                        </span>
                        <span className={`badge ${statusClass(player.status)} uppercase text-[10px] tracking-wider font-extrabold px-3 py-1 rounded-full`}>
                          {player.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3.5 pt-1">
                        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-white/15 flex items-center justify-center text-amber-400 overflow-hidden shrink-0">
                          {player.photo_url ? (
                            <Image src={player.photo_url} alt={player.name} fill className="object-cover" />
                          ) : (
                            <span className="font-extrabold text-sm">{initials(player.name)}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg font-bold text-white font-display truncate">{player.name}</h3>
                          <p className="text-xs text-slate-300">Base Price: <span className="text-amber-300 font-bold">{formatMoney(player.base_price)}</span></p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/10">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Batting</span>
                        <span className="font-bold text-white truncate block">{player.batting_style || 'N/A'}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/10">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Bowling</span>
                        <span className="font-bold text-white truncate block">{player.bowling_style || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/10 flex items-center justify-between text-xs text-slate-300 font-medium">
                      {player.status === 'Sold' ? (
                        <span>
                          Sold to <b className="text-amber-400">{player.sold_to_team}</b> for <b className="text-emerald-400">{formatMoney(player.sold_price)}</b>
                        </span>
                      ) : (
                        <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5" /> Approved for Bidding
                        </span>
                      )}
                    </div>
                  </SpotlightCard>
                </TiltCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  );
}
