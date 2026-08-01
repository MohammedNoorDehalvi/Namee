'use client';

import { motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Bot,
  CheckCircle2,
  Cpu,
  FileSpreadsheet,
  Gavel,
  Lock,
  MonitorPlay,
  Radio,
  ShieldCheck,
  Zap,
} from 'lucide-react';

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export function SaaSFeatures() {
  return (
    <section className="py-24 relative overflow-hidden bg-slate-950">
      {/* Ambient Blobs */}
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-violet-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-cyan-600/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-white/10 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>ENTERPRISE-GRADE INFRASTRUCTURE</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold font-display tracking-tight text-white">
            Built for High-Stakes <br />
            <span className="text-gradient-gold">Championship Auctions</span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            Everything you need to organize, run, and broadcast professional sports league auctions with total security, zero lag, and instant validation.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-6">
          {/* Bento 1: Real-Time Engine (Large 7 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
            className="lg:col-span-7 bento-card flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold text-white font-display">Real-Time Bidding Engine</h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                Powered by high-throughput WebSockets. Every counter-bid updates instantly across all captains, administrators, and spectator displays without page refreshes.
              </p>
            </div>

            {/* Visual Graphic */}
            <div className="mt-8 p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-semibold text-cyan-400">
                  <Activity className="w-4 h-4" /> LATENCY SPECS
                </span>
                <span className="text-emerald-400 font-bold">REAL-TIME SYNC</span>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-1 text-center">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="block text-xl font-bold text-white font-display">₹50,000</span>
                  <span className="text-[11px] text-slate-400">Max Purse</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="block text-xl font-bold text-cyan-400 font-display">&lt; 10ms</span>
                  <span className="text-[11px] text-slate-400">Sync Latency</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="block text-xl font-bold text-amber-400 font-display">4 + 1</span>
                  <span className="text-[11px] text-slate-400">Squad Format</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bento 2: Budget Shield (5 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT_EXPO }}
            className="lg:col-span-5 bento-card flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white font-display">Budget Shield Guard</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Automated validation rules prevent invalid bids. Franchise purse limits (₹50,000 max), squad size rules (4 Players + 1 Captain), and bidding limits are enforced automatically.
              </p>
            </div>

            <div className="mt-8 space-y-2">
              {[
                'Purse Balance Auto-Deduction (₹50,000)',
                'Squad Limit: 4 Players + 1 Captain',
                'Anti-Overbid Protection System',
              ].map((rule) => (
                <div key={rule} className="flex items-center gap-2.5 text-xs font-semibold text-slate-300 p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Bento 3: Captain Command Desk (4 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease: EASE_OUT_EXPO }}
            className="lg:col-span-4 bento-card space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Gavel className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white font-display">Captain Command Desk</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Designed specifically for fast decision-making during bidding wars with quick-increment hotkeys, target squad wishlist, and remaining purse gauges.
            </p>
          </motion.div>

          {/* Bento 4: Live Broadcast Display (4 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3, ease: EASE_OUT_EXPO }}
            className="lg:col-span-4 bento-card space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <MonitorPlay className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white font-display">Broadcast & Stadium Display</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Full-screen live stream overlay mode for big stadium screens, YouTube live streams, and fan viewing hubs with audio hammer drop sound effects.
            </p>
          </motion.div>

          {/* Bento 5: Analytics & Export (4 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.4, ease: EASE_OUT_EXPO }}
            className="lg:col-span-4 bento-card space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white font-display">Instant Export & Archives</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Export official final squad rosters, captain bidding audit trails, and contract summaries to PDF & Excel immediately when the auction closes.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
