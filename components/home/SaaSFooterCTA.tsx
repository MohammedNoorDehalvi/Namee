'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Gavel, Sparkles, Trophy, Users } from 'lucide-react';

import { GlassCard, GlassButton } from '@/components/ui/liquid-glass';
import { useCurrentSeason } from '@/hooks/useCurrentSeason';

export function SaaSFooterCTA() {
  const { displayName } = useCurrentSeason();

  return (
    <section className="py-24 relative overflow-hidden bg-transparent">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/15 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <GlassCard variant="dark" className="border border-white/15 p-8 md:p-16 text-center space-y-8 shadow-2xl">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest shadow-lg">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{displayName} · Digital auction</span>
            </div>

            {/* Heading */}
            <h2 className="text-4xl md:text-6xl font-extrabold font-display tracking-tight text-white max-w-3xl mx-auto leading-tight">
              Ready to Build Your <br />
              <span className="text-gradient-gold">Championship Squad?</span>
            </h2>

            <p className="text-slate-300 text-base md:text-xl max-w-2xl mx-auto leading-relaxed">
              Register as a player to enter the draft pool, or log in as a Franchise Captain to lead your team on auction day.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <GlassButton href="/player-registration" variant="amber" className="text-slate-950">
                <Users className="w-5 h-5" />
                <span>Register as Player</span>
                <ArrowUpRight className="w-5 h-5" />
              </GlassButton>

              <GlassButton href="/auction" variant="dark" className="text-white">
                <Gavel className="w-5 h-5 text-cyan-400" />
                <span>Watch Auction Live</span>
              </GlassButton>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}
