'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'What are the team budget and squad size rules in APL?',
    answer:
      'Each franchise team operates with a maximum budget of ₹50,000. Each complete squad consists of 4 bought Players + 1 Captain.',
  },
  {
    question: 'How do player registrations and approvals work in APL?',
    answer:
      'Players submit their profile details, role (Batter, Bowler, All-Rounder, Wicketkeeper), and experience via the online registration page. League administrators review and approve entries into the official live auction pool.',
  },
  {
    question: 'How do Captains place bids during the live auction?',
    answer:
      'Captains log in with their secure credentials into the Captain Portal. During an active player lot, captains can place instant counter-bids with live purse validation.',
  },
  {
    question: 'Can fans and spectators watch the auction live?',
    answer:
      'Yes! The public Live Auction page provides real-time WebSocket updates, hammer alerts, and squad roster tracking for spectators without requiring any account login.',
  },
  {
    question: 'What happens if a franchise runs out of purse budget?',
    answer:
      'The automated Budget Shield instantly prevents captains from placing bids higher than their remaining purse balance out of their ₹50,000 max budget.',
  },
  {
    question: 'Can admins pause or modify an auction lot in real time?',
    answer:
      'The Admin Dashboard gives league managers full control to start lots, pause bidding, handle disputes, re-auction unsold players, and export final contract sheets.',
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 relative overflow-hidden bg-slate-950/90 border-t border-white/5">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold font-display tracking-tight text-white">
            Frequently Asked <span className="text-gradient-cyan">Questions</span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            Everything you need to know about the APL Digital Auction platform.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className="bento-card p-0 border border-white/10 overflow-hidden bg-slate-900/60 hover:bg-slate-900/90 transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="text-lg font-bold text-white font-display">{faq.question}</span>
                  <div
                    className={`w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : ''
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="px-6 pb-6 text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
