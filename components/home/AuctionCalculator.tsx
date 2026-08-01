'use client';

import { useState } from 'react';
import { Calculator, DollarSign, PieChart, Sparkles, Users } from 'lucide-react';
import { formatMoney } from '@/lib/format';

export function AuctionCalculator() {
  const [totalPurse, setTotalPurse] = useState<number>(50000); // ₹50,000 Max Budget
  const [squadSize, setSquadSize] = useState<number>(4); // 4 Players + 1 Captain

  const marqueeBudget = Math.round(totalPurse * 0.40);
  const coreBudget = Math.round(totalPurse * 0.40);
  const depthBudget = Math.round(totalPurse * 0.20);
  const avgPerPlayer = Math.round(totalPurse / (squadSize || 4));

  return (
    <section className="py-24 relative overflow-hidden bg-slate-950/80 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Calculator className="w-3.5 h-3.5" />
            <span>Auction Strategy Tool</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold font-display tracking-tight text-white">
            Franchise Purse & <br />
            <span className="text-gradient-gold">Budget Calculator</span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            Plan your team strategy before auction day. Adjust your total purse (up to ₹50,000) to calculate optimal bid ceilings for marquee stars and squad depth.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Sliders Area (Left 6 Cols) */}
          <div className="lg:col-span-6 bento-card space-y-8 p-6 md:p-8 bg-slate-900/90 border-white/10">
            {/* Slider 1: Total Purse */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  Total Franchise Purse
                </label>
                <span className="text-xl font-extrabold text-amber-400 font-display">
                  {formatMoney(totalPurse)}
                </span>
              </div>
              <input
                type="range"
                min={10000}
                max={50000}
                step={2500}
                value={totalPurse}
                onChange={(e) => setTotalPurse(Number(e.target.value))}
                className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                <span>₹10,000 (Min)</span>
                <span>₹30,000</span>
                <span>₹50,000 (Max Budget)</span>
              </div>
            </div>

            {/* Slider 2: Target Bought Players */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  Squad Format (Bought Players)
                </label>
                <span className="text-xl font-extrabold text-cyan-400 font-display">
                  {squadSize} Players (+ 1 Captain)
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={6}
                step={1}
                value={squadSize}
                onChange={(e) => setSquadSize(Number(e.target.value))}
                className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                <span>2 Players</span>
                <span>4 Players (APL Rule)</span>
                <span>6 Players</span>
              </div>
            </div>

            {/* Strategy Hint */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <p className="text-xs text-slate-300">
                <strong className="text-white">Pro Tip:</strong> In a 4 Players + 1 Captain format with ₹50,000 purse, allocate ~40% (₹20,000) for your top Marquee target to ensure remaining funds for 3 core picks.
              </p>
            </div>
          </div>

          {/* Allocation Breakdown Visualization (Right 6 Cols) */}
          <div className="lg:col-span-6 bento-card space-y-6 p-6 md:p-8 bg-slate-900/90 border-white/10">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                <PieChart className="w-5 h-5 text-amber-400" /> Recommended Strategy Breakdown
              </h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Avg {formatMoney(avgPerPlayer)} / player
              </span>
            </div>

            {/* Visual Bar Stack */}
            <div className="space-y-2">
              <div className="w-full h-4 rounded-full bg-slate-800 overflow-hidden flex p-0.5">
                <div className="h-full bg-amber-400 rounded-l-full" style={{ width: '40%' }} />
                <div className="h-full bg-cyan-400" style={{ width: '40%' }} />
                <div className="h-full bg-emerald-400 rounded-r-full" style={{ width: '20%' }} />
              </div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-400 pt-1">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Marquee Star (40%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" /> 2 Core Picks (40%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Final Slot (20%)</span>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-amber-500/20">
                <span className="text-xs text-slate-400 font-medium block">Marquee Ceiling</span>
                <span className="text-2xl font-extrabold text-amber-400 font-display block mt-1">
                  {formatMoney(marqueeBudget)}
                </span>
                <span className="text-[10px] text-slate-500">Max Bid for Top Pick</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-cyan-500/20">
                <span className="text-xs text-slate-400 font-medium block">Core Pick Pool</span>
                <span className="text-2xl font-extrabold text-cyan-400 font-display block mt-1">
                  {formatMoney(coreBudget)}
                </span>
                <span className="text-[10px] text-slate-500">For 2 Key Players</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-emerald-500/20">
                <span className="text-xs text-slate-400 font-medium block">Final Slot Pool</span>
                <span className="text-2xl font-extrabold text-emerald-400 font-display block mt-1">
                  {formatMoney(depthBudget)}
                </span>
                <span className="text-[10px] text-slate-500">For 4th Squad Slot</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
