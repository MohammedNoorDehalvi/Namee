"use client";

import Link from 'next/link';
import { Menu, Trophy, X } from 'lucide-react';
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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-apl-dark/75 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-black tracking-tight">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-apl-gold to-apl-neon text-apl-dark shadow-glow"><Trophy size={20} /></span>
          <span className="text-lg">APL <span className="text-apl-gold">Auction</span></span>
        </Link>
        <div className="hidden items-center gap-2 lg:flex">
          {links.map(([label, href]) => <Link key={href} href={href} className="rounded-full px-3 py-2 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white">{label}</Link>)}
          {session ? <button onClick={clearSession} className="btn-ghost !py-2 text-sm">Logout {session.name}</button> : <Link href="/captain-login" className="btn-primary !py-2 text-sm">Captain Login</Link>}
        </div>
        <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Open menu">{open ? <X /> : <Menu />}</button>
      </nav>
      {open && (
        <div className="border-t border-white/10 bg-apl-dark/95 px-4 py-3 lg:hidden">
          <div className="grid gap-2">
            {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="rounded-2xl px-4 py-3 font-semibold hover:bg-white/10">{label}</Link>)}
            {session ? <button onClick={() => { clearSession(); setOpen(false); }} className="btn-ghost">Logout {session.name}</button> : <Link onClick={() => setOpen(false)} href="/captain-login" className="btn-primary">Captain Login</Link>}
          </div>
        </div>
      )}
    </header>
  );
}
