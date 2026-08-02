'use client';

import Link from 'next/link';
import { ArrowUp, Radio, Shield, Trophy } from 'lucide-react';

import { GlassCard } from '@/components/ui/liquid-glass';
import { RetroGrid } from '@/components/ui/RetroGrid';

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-transparent text-slate-300 py-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        <GlassCard className="p-8 md:p-12 rounded-[2.5rem] space-y-12 relative overflow-hidden border-white/15">
          {/* 21st.dev Retro Grid overlay */}
          <RetroGrid angle={45} className="opacity-30 pointer-events-none" />

          {/* Top Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start relative z-10">
            {/* Brand & Status */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 font-display">
                  APL
                </div>
                <span className="font-extrabold text-white text-lg font-display tracking-wider">
                  ASHOKA PREMIER LEAGUE
                </span>
              </div>
              <p className="text-sm text-slate-300 max-w-sm leading-relaxed">
                The premier live digital cricket auction platform. Delivering real-time bidding, protected team budgets, and championship team building.
              </p>

              {/* Live Operational Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span>SYSTEMS OPERATIONAL · LIVE WEBSOCKET SYNC</span>
              </div>
            </div>

            {/* Quick Links Column 1 */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider font-display">Navigation</h4>
              <ul className="space-y-2.5 text-sm font-medium">
                <li>
                  <Link href="/" className="hover:text-amber-300 transition-colors">Home Landing</Link>
                </li>
                <li>
                  <Link href="/player-registration" className="hover:text-amber-300 transition-colors">Player Registration</Link>
                </li>
                <li>
                  <Link href="/players" className="hover:text-amber-300 transition-colors">Registered Player Directory</Link>
                </li>
                <li>
                  <Link href="/auction" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 font-bold text-emerald-400">
                    <Radio className="w-3.5 h-3.5 animate-pulse" /> Live Auction Floor
                  </Link>
                </li>
              </ul>
            </div>

            {/* Quick Links Column 2 */}
            <div className="md:col-span-4 space-y-3">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider font-display">Franchise & Admin</h4>
              <ul className="space-y-2.5 text-sm font-medium">
                <li>
                  <Link href="/captain-login" className="hover:text-amber-300 transition-colors">Captain Portal Login</Link>
                </li>
                <li>
                  <Link href="/captain-dashboard" className="hover:text-amber-300 transition-colors">Captain Bidding Desk</Link>
                </li>
                <li>
                  <Link href="/admin-login" className="hover:text-amber-300 transition-colors">Administrator Access</Link>
                </li>
                <li>
                  <Link href="/teams" className="hover:text-amber-300 transition-colors">Franchise Squad Rosters</Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium relative z-10">
            <p>© {new Date().getFullYear()} Ashoka Premier League (APL). All rights reserved.</p>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold transition-all cursor-pointer shadow-lg"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </GlassCard>
      </div>
    </footer>
  );
}
