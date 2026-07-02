"use client";

import Link from 'next/link';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { clearSession, useSession } from '@/hooks/useSession';

const links = [
  ['Home', '/'],
  ['Register', '/player-registration'],
  ['Players', '/players'],
  ['Auction', '/auction'],
  ['Teams', '/teams'],
  ['Captain', '/captain-dashboard'],
  ['Admin', '/admin-dashboard']
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { session } = useSession();
  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Primary navigation">
        <Link href="/" className="site-brand" aria-label="APL Auction home">
          <span className="site-brand__mark">A</span>
          <span>ASHOKA<br />PREMIER LEAGUE</span>
        </Link>
        <div className="site-nav__links">
          {links.map(([label, href], index) => (
            <Link key={href} href={href}><small>0{index + 1}</small>{label}</Link>
          ))}
          {session ? (
            <button onClick={clearSession} className="site-nav__session">Logout {session.name}</button>
          ) : (
            <Link href="/captain-login" className="site-nav__entry">Captain login <ArrowUpRight size={15} /></Link>
          )}
        </div>
        <button className="site-nav__toggle" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      {open && (
        <div className="mobile-menu">
          {links.map(([label, href], index) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}><small>0{index + 1}</small>{label}<ArrowUpRight size={18} /></Link>
          ))}
          {session ? <button onClick={() => { clearSession(); setOpen(false); }}>Logout {session.name}</button> : <Link onClick={() => setOpen(false)} href="/captain-login">Captain Login <ArrowUpRight size={18} /></Link>}
        </div>
      )}
    </header>
  );
}
