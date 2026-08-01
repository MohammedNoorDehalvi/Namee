'use client';

import Link from 'next/link';
import { ArrowUpRight, CircleDot, Sparkles } from 'lucide-react';

const navigation = [
  { label: 'Arena', href: '/' },
  { label: 'Player registry', href: '/players' },
  { label: 'Franchises', href: '/teams' },
];

const access = [
  { label: 'Live auction', href: '/auction' },
  { label: 'Captain desk', href: '/captain-login' },
  { label: 'Control room', href: '/admin-login' },
];

export function Footer() {
  return (
    <footer className="liquid-footer">
      <div className="liquid-footer__inner">
        <section className="footer-intro">
          <div className="footer-mark"><Sparkles size={16} /> APL</div>
          <h2>Built for the moments that decide a season.</h2>
          <p>A real-time home for cricket’s next winning combination.</p>
        </section>
        <section>
          <p className="footer-label">Explore</p>
          <div className="footer-links">
            {navigation.map((link) => <Link key={link.href} href={link.href}>{link.label}<ArrowUpRight size={13} /></Link>)}
          </div>
        </section>
        <section>
          <p className="footer-label">Access</p>
          <div className="footer-links">
            {access.map((link) => <Link key={link.href} href={link.href}>{link.label}<ArrowUpRight size={13} /></Link>)}
          </div>
        </section>
      </div>
      <div className="liquid-footer__bottom">
        <span>© {new Date().getFullYear()} Ashoka Premier League</span>
        <span className="footer-live"><CircleDot size={13} /> systems online</span>
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top ↑</button>
      </div>
    </footer>
  );
}
