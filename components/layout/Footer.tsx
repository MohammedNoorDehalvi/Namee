'use client';

import Link from 'next/link';
import { ArrowUp, Radio, Shield, Trophy } from 'lucide-react';

import { GlassCard } from '@/components/ui/liquid-glass';

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-transparent text-slate-300 py-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <GlassCard className="p-8 md:p-12 rounded-3xl space-y-12">
        {/* Top Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Brand & Status */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-xs">
                APL
              </div>
              <span className="font-extrabold text-white text-lg font-display tracking-wider">
                ASHOKA PREMIER LEAGUE
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              The premier live digital cricket auction platform. Delivering real-time bidding, protected team budgets, and championship team building.
            </p>

            {/* Live Operational Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span>ALL SYSTEMS OPERATIONAL · LIVE WEBSOCKET SYNC</span>
            </div>
          </div>

          {/* Quick Links Column 1 */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">Home Landing</Link>
              </li>
              <li>
                <Link href="/player-registration" className="hover:text-white transition-colors">Player Registration</Link>
              </li>
              <li>
                <Link href="/players" className="hover:text-white transition-colors">Registered Player Directory</Link>
              </li>
              <li>
                <Link href="/auction" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" /> Live Auction Floor
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links Column 2 */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">Franchise & Admin</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/captain-login" className="hover:text-amber-400 transition-colors">Captain Portal Login</Link>
              </li>
              <li>
                <Link href="/captain-dashboard" className="hover:text-white transition-colors">Captain Bidding Desk</Link>
              </li>
              <li>
                <Link href="/admin-login" className="hover:text-white transition-colors">Administrator Access</Link>
              </li>
              <li>
                <Link href="/teams" className="hover:text-white transition-colors">Franchise Squad Rosters</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} Ashoka Premier League (APL). All rights reserved.</p>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
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
