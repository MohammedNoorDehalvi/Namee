"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, CircleDot, Menu, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { clearSession, useSession } from '@/hooks/useSession';

const links = [
  { label: 'Arena', href: '/' },
  { label: 'Players', href: '/players' },
  { label: 'Franchises', href: '/teams' },
  { label: 'Live room', href: '/auction', live: true },
  { label: 'Register', href: '/player-registration' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { session } = useSession();

  return (
    <header className="liquid-header">
      <nav className="liquid-nav" aria-label="Primary navigation">
        <Link href="/" className="arena-brand" aria-label="APL Auction home">
          <span className="arena-brand__mark"><Sparkles size={15} /></span>
          <span>
            <strong>APL</strong>
            <small>auction house</small>
          </span>
        </Link>

        <div className="arena-links">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} className={`arena-link ${active ? 'is-active' : ''}`}>
                {link.live && <CircleDot size={12} className="arena-link__signal" />}
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="arena-actions">
          <span className="arena-status"><i /> LIVE</span>
          {session ? (
            <button type="button" onClick={clearSession} className="session-chip">
              <span>{session.name}</span> Sign out
            </button>
          ) : (
            <Link href="/captain-login" className="nav-entry">
              Captain desk <ArrowUpRight size={15} />
            </Link>
          )}
        </div>

        <button
          type="button"
          className="arena-menu-button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(8px)' }}
            transition={{ duration: 0.22 }}
            className="arena-mobile-menu"
          >
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="arena-mobile-link">
                <span>{link.label}</span>
                {link.live ? <CircleDot size={15} className="text-emerald-300" /> : <ArrowUpRight size={15} />}
              </Link>
            ))}
            <Link href={session ? '/captain-dashboard' : '/captain-login'} onClick={() => setOpen(false)} className="arena-mobile-entry">
              {session ? 'Open captain desk' : 'Captain desk'} <ArrowUpRight size={15} />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
