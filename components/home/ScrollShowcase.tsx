"use client";

import { motion } from 'framer-motion';
import { Gavel, Radio, Shield, Users } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';

const items = [
  { icon: <Users />, title: 'Players Register', body: 'Players submit their phone, role, batting style, bowling style, and photo. Admin approves before auction.' },
  { icon: <Shield />, title: 'Admin Controls', body: 'Admin approves players, starts auction, marks sold or unsold, moves next player, and manages captains.' },
  { icon: <Gavel />, title: 'Captains Bid', body: 'Captains bid only after login and only when the auction is live. Budget protection is built in.' },
  { icon: <Radio />, title: 'Realtime Auction', body: 'Everyone can watch the auction screen. Supabase realtime keeps current player, bid, and status updated.' }
];

export function ScrollShowcase() {
  return (
    <section className="px-4 py-20 sm:px-6">
      <SectionHeading eyebrow="3D Scroll Experience" title="Futuristic IPL-style auction flow" subtitle="Glassmorphism cards, premium dark stadium background, golden highlights, green winning states, and hover-based 3D card motion." />
      <div className="mx-auto mt-12 grid max-w-7xl gap-5 md:grid-cols-2 lg:grid-cols-4">
        {items.map((item, i) => (
          <motion.article key={item.title} className="scroll-3d-card glass-card rounded-[2rem] p-6" initial={{ opacity: 0, y: 50, rotateX: 12 }} whileInView={{ opacity: 1, y: 0, rotateX: 0 }} viewport={{ once: true, amount: .3 }} transition={{ duration: .55, delay: i * .08 }}>
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-apl-gold/15 text-apl-gold">{item.icon}</div>
            <h3 className="mt-5 text-xl font-black">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-white/60">{item.body}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
