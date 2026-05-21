"use client";

import { Gavel, Radio, Shield, Sparkles, Users } from 'lucide-react';

const items = [
  {
    icon: <Users size={22} />,
    title: 'Players Register',
    body: 'Players submit role, style, phone and a required gallery photo. Admin approves them before auction.',
  },
  {
    icon: <Shield size={22} />,
    title: 'Admin Controls',
    body: 'Admin creates teams, approves players, starts auction, marks sold or unsold, and fixes teams if needed.',
  },
  {
    icon: <Gavel size={22} />,
    title: 'Captains Bid',
    body: 'Captains bid with protected budgets, team limits, live highest bidder, and clean mobile controls.',
  },
  {
    icon: <Radio size={22} />,
    title: 'Realtime Auction',
    body: 'Public users, captains and admin see live player, bid history, logos, captain photos and reports.',
  },
];

export function ScrollShowcase() {
  return (
    <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <article key={item.title} className="premium-card premium-hover rounded-[1.7rem] p-5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-yellow-300/25 bg-yellow-300/10 text-yellow-300">
            {item.icon}
          </div>
          <h3 className="mt-5 text-xl font-black text-white">{item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-white/58">{item.body}</p>
        </article>
      ))}

      <div className="sm:col-span-2 lg:col-span-4">
        <div className="glass-card flex flex-col gap-4 rounded-[1.7rem] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.22em] text-green-300">
              <Sparkles size={17} /> Premium APL Experience
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">Dark futuristic cricket auction UI made for mobile and live screens.</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-white/55">
            Lightweight Tailwind-only interface, lazy loaded images, and fast Supabase sync for the Render free instance.
          </p>
        </div>
      </div>
    </section>
  );
}
