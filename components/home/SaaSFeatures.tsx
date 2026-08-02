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
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { AnimatedBeam } from '@/components/ui/AnimatedBeam';
import { TiltCard } from '@/components/ui/TiltCard';

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export function SaaSFeatures() {
  return (
    <section className="py-24 relative overflow-hidden bg-transparent">
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
          <p className="text-slate-300 text-base md:text-lg">
            Everything you need to organize, run, and broadcast professional sports league auctions with total security, zero lag, and instant validation.
          </p>
        </div>

        {/* Bento Grid with 3D Tilt Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-6">
          {/* Bento 1: Real-Time Engine (Large 7 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
            className="lg:col-span-7 h-full"
          >
            <TiltCard tiltMaxAngle={8}>
              <SpotlightCard spotlightColor="rgba(6, 182, 212, 0.22)" className="h-full border border-white/15 flex flex-col justify-between p-8 rounded-3xl bg-slate-900/90">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                    <Radio className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold text-white font-display">Real-Time Bidding Engine</h3>
                  <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
                    Powered by high-throughput WebSockets. Every counter-bid updates instantly across all captains, administrators, and spectator displays without page refreshes.
                  </p>
                </div>

                {/* Animated Beam Connection Visual */}
                <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
                    <span>Captain Portal</span>
                    <span className="text-cyan-400">APL WebSocket Engine</span>
                    <span>Stadium Screen</span>
                  </div>
                  <AnimatedBeam duration={2.5} gradientStartColor="#06B6D4" gradientStopColor="#F59E0B" />
                  <div className="grid grid-cols-3 gap-3 pt-1 text-center">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                      <span className="block text-xl font-extrabold text-white font-display">₹50,000</span>
                      <span className="text-[11px] text-slate-400 font-medium">Max Purse</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                      <span className="block text-xl font-extrabold text-cyan-400 font-display">&lt; 10ms</span>
                      <span className="text-[11px] text-slate-400 font-medium">Sync Latency</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                      <span className="block text-xl font-extrabold text-amber-400 font-display">4 + 1</span>
                      <span className="text-[11px] text-slate-400 font-medium">Squad Format</span>
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            </TiltCard>
          </motion.div>

          {/* Bento 2: Budget Shield (5 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT_EXPO }}
            className="lg:col-span-5 h-full"
          >
            <TiltCard tiltMaxAngle={8}>
              <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.22)" className="h-full border border-white/15 flex flex-col justify-between p-8 rounded-3xl bg-slate-900/90">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-white font-display">Budget Shield Guard</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Automated validation rules prevent invalid bids. Franchise purse limits (₹50,000 max), squad size rules (4 Players + 1 Captain), and bidding limits are enforced automatically.
                  </p>
                </div>

                <div className="mt-8 space-y-2.5">
                  {[
                    'Purse Balance Auto-Deduction (₹50,000)',
                    'Squad Limit: 4 Players + 1 Captain',
                    'Anti-Overbid Protection System',
                  ].map((rule) => (
                    <div key={rule} className="flex items-center gap-2.5 text-xs font-semibold text-slate-200 p-3 rounded-2xl bg-white/5 border border-white/10">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </SpotlightCard>
            </TiltCard>
          </motion.div>

          {/* Bento 3: Captain Command Desk (4 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease: EASE_OUT_EXPO }}
            className="lg:col-span-4 h-full"
          >
            <TiltCard tiltMaxAngle={10}>
              <SpotlightCard spotlightColor="rgba(245, 158, 11, 0.22)" className="h-full border border-white/15 space-y-4 p-8 rounded-3xl bg-slate-900/90">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
                  <Gavel className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white font-display">Captain Command Desk</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Designed specifically for fast decision-making during bidding wars with quick-increment hotkeys, target squad wishlist, and remaining purse gauges.
                </p>
              </SpotlightCard>
            </TiltCard>
          </motion.div>

          {/* Bento 4: Live Broadcast Display (4 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3, ease: EASE_OUT_EXPO }}
            className="lg:col-span-4 h-full"
          >
            <TiltCard tiltMaxAngle={10}>
              <SpotlightCard spotlightColor="rgba(139, 92, 246, 0.22)" className="h-full border border-white/15 space-y-4 p-8 rounded-3xl bg-slate-900/90">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300">
                  <MonitorPlay className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white font-display">Broadcast & Stadium Display</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Full-screen live stream overlay mode for big stadium screens, YouTube live streams, and fan viewing hubs with audio hammer drop sound effects.
                </p>
              </SpotlightCard>
            </TiltCard>
          </motion.div>

          {/* Bento 5: Analytics & Export (4 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.4, ease: EASE_OUT_EXPO }}
            className="lg:col-span-4 h-full"
          >
            <TiltCard tiltMaxAngle={10}>
              <SpotlightCard spotlightColor="rgba(59, 130, 246, 0.22)" className="h-full border border-white/15 space-y-4 p-8 rounded-3xl bg-slate-900/90">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white font-display">Instant Export & Archives</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Export official final squad rosters, captain bidding audit trails, and contract summaries to PDF & Excel immediately when the auction closes.
                </p>
              </SpotlightCard>
            </TiltCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
