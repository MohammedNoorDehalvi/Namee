"use client";

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, BadgeDollarSign, ShieldCheck, Trophy } from 'lucide-react';

const heroButtons = [
  ['Register Player', '/player-registration'],
  ['View Players', '/players'],
  ['Captain Login', '/captain-login'],
  ['Admin Login', '/admin-login'],
  ['Auction Dashboard', '/auction'],
  ['Captain Dashboard', '/captain-dashboard'],
  ['Admin Dashboard', '/admin-dashboard'],
  ['Teams', '/teams']
];

export function Hero3D() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 700], [0, 120]);
  const rotate = useTransform(scrollY, [0, 700], [0, 18]);
  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(246,195,67,.2),transparent_35%)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.02fr_.98fr]">
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}>
          <div className="inline-flex rounded-full border border-apl-gold/30 bg-apl-gold/10 px-4 py-2 text-sm font-black uppercase tracking-[.25em] text-apl-gold">Ashoka Premier League</div>
          <h1 className="mt-6 text-5xl font-black leading-[.95] tracking-tight sm:text-7xl lg:text-8xl">
            APL Online <span className="bg-gradient-to-r from-apl-gold to-apl-neon bg-clip-text text-transparent">Auction</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
            Register as a player and get selected by captains in the APL auction. A mini IPL-style live cricket auction system for players, captains, teams, and admin control.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {heroButtons.map(([label, href], index) => (
              <Link key={href} href={href} className={index === 0 ? 'btn-primary' : 'btn-ghost'}>{label}<ArrowRight size={16} /></Link>
            ))}
          </div>
        </motion.div>

        <motion.div className="perspective-stage relative min-h-[520px]" style={{ y, rotateZ: rotate }}>
          <div className="orbit-ball left-1/2 top-1/2" />
          <div className="float-3d glass-card absolute left-1/2 top-1/2 w-[330px] -translate-x-1/2 -translate-y-1/2 rounded-[2.4rem] p-6 sm:w-[420px]">
            <div className="rounded-[2rem] border border-apl-gold/20 bg-gradient-to-br from-apl-panel to-black/80 p-6 shadow-glow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[.22em] text-apl-gold">Live Lot</p>
                  <h2 className="mt-2 text-3xl font-black">Kabir</h2>
                  <p className="text-white/60">Batter • Right Hand</p>
                </div>
                <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-apl-gold to-apl-neon text-apl-dark"><Trophy size={34} /></div>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <Mini label="Base Price" value="100" icon={<BadgeDollarSign size={18} />} />
                <Mini label="Highest Bid" value="450" icon={<Trophy size={18} />} />
                <Mini label="Winning Team" value="Faiz XI" icon={<ShieldCheck size={18} />} />
                <Mini label="Status" value="Live" icon={<span className="h-3 w-3 rounded-full bg-apl-neon" />} />
              </div>
              <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="h-3 rounded-full bg-white/10"><div className="h-3 w-3/4 rounded-full bg-gradient-to-r from-apl-gold to-apl-neon" /></div>
                <p className="mt-3 text-xs font-bold uppercase tracking-[.2em] text-white/45">Realtime bidding energy</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Mini({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <div className="rounded-3xl border border-white/10 bg-white/5 p-4"><div className="text-apl-gold">{icon}</div><p className="mt-2 text-xs text-white/45">{label}</p><p className="font-black">{value}</p></div>;
}
