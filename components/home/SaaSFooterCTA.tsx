'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Gavel, Sparkles, Trophy, Users } from 'lucide-react';

export function SaaSFooterCTA() {
  return (
    <section className="py-24 relative overflow-hidden bg-slate-950">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/15 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl overflow-hidden border border-white/15 bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-950 p-8 md:p-16 text-center space-y-8 shadow-2xl shadow-amber-500/10"
        >
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>APL Season 8 Digital Auction</span>
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
            <Link
              href="/player-registration"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-extrabold text-base shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              <span>Register as Player</span>
              <ArrowUpRight className="w-5 h-5" />
            </Link>

            <Link
              href="/auction"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-white/15 text-white font-bold text-base shadow-xl hover:scale-[1.02] active:scale-[0.97] transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Gavel className="w-5 h-5 text-cyan-400" />
              <span>Watch Auction Live</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
