"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Gavel, Menu, Shield, Trophy, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clearSession, useSession } from '@/hooks/useSession';
import { GlassEffect, GlassButton, GlassCard } from '@/components/ui/liquid-glass';

const links = [
  { label: 'Home', href: '/' },
  { label: 'Register', href: '/player-registration' },
  { label: 'Players', href: '/players' },
  { label: 'Live Auction', href: '/auction', highlight: true },
  { label: 'Teams', href: '/teams' },
  { label: 'Captain Portal', href: '/captain-dashboard' },
  { label: 'Admin', href: '/admin-dashboard' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { session } = useSession();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 transition-all duration-300">
      <div className="max-w-7xl mx-auto">
        <GlassEffect
          className="rounded-full shadow-2xl shadow-black/40"
        >
          <div
            className="flex items-center justify-between h-14 px-4 md:px-6 w-full"
            aria-label="Primary navigation"
          >
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group" aria-label="APL Auction Home">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-cyan-500 p-[1px] shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Trophy className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-wider bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent font-display leading-tight">
                ASHOKA PREMIER
              </span>
              <span className="text-[10px] font-semibold tracking-widest text-cyan-400 uppercase leading-none">
                LEAGUE AUCTION
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? 'text-white font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-white/10 rounded-full border border-white/15"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                  {link.highlight && (
                    <span className="relative z-10 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Action CTAs & Session */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Live Auction Badge Pill */}
            <Link
              href="/auction"
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-900/60 transition-colors"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span className="tracking-wide uppercase">LIVE BIDDING</span>
            </Link>

            {session ? (
              <button
                onClick={clearSession}
                className="px-4 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                Logout ({session.name})
              </button>
            ) : (
              <Link
                href="/captain-login"
                className="relative inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <span>Captain Login</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          <button
            className="lg:hidden p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </GlassEffect>

        {/* Mobile Navigation Drawer in Liquid Glass */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden mt-2"
            >
              <GlassCard className="p-5 rounded-3xl space-y-2.5 shadow-2xl">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/10 text-slate-100 font-semibold text-sm transition-all"
                  >
                    <span className="flex items-center gap-2">
                      {link.label}
                      {link.highlight && (
                        <span className="px-2.5 py-0.5 text-[10px] uppercase font-extrabold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 rounded-full">
                          Live
                        </span>
                      )}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-slate-300" />
                  </Link>
                ))}

                <div className="pt-3 border-t border-white/10">
                  {session ? (
                    <button
                      onClick={() => {
                        clearSession();
                        setOpen(false);
                      }}
                      className="w-full text-center py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-100 font-bold text-sm transition-all"
                    >
                      Logout ({session.name})
                    </button>
                  ) : (
                    <GlassButton
                      href="/captain-login"
                      variant="amber"
                      onClick={() => setOpen(false)}
                      className="w-full py-3.5 text-slate-950 font-extrabold text-sm rounded-full text-center justify-center"
                    >
                      <span>Captain Login</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </GlassButton>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
