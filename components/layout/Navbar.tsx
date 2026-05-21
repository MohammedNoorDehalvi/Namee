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
  ['Admin', '/admin-dashboard'],
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { session } = useSession();

  function logout() {
    clearSession();
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#040806]/80 backdrop-blur-2xl">
      <nav className="section-shell flex min-h-[72px] items-center justify-between gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-yellow-300/30 bg-yellow-300/10 text-yellow-300 shadow-lg shadow-yellow-500/10">
            <Trophy size={22} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-lg font-black tracking-tight text-white">APL Auction</span>
            <span className="block truncate text-xs font-bold uppercase tracking-[0.22em] text-green-300/80">Ashoka Premier League</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-full px-4 py-2 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white">
              {label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          {session ? (
            <button onClick={logout} className="btn-ghost max-w-[220px] truncate">
              Logout {session.name}
            </button>
          ) : (
            <Link href="/captain-login" className="btn-primary">
              Captain Login
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-white lg:hidden"
          aria-label="Open menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {open && (
        <div className="section-shell pb-4 lg:hidden">
          <div className="glass-card grid gap-2 rounded-[1.5rem] p-3">
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 font-bold text-white/80 hover:bg-white/10 hover:text-white"
              >
                {label}
              </Link>
            ))}
            {session ? (
              <button onClick={logout} className="btn-ghost w-full">
                Logout {session.name}
              </button>
            ) : (
              <Link onClick={() => setOpen(false)} href="/captain-login" className="btn-primary w-full">
                Captain Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
