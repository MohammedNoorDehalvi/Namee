"use client";

import { useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Hammer, PartyPopper, Sparkles } from 'lucide-react';

import type { SaleCelebration } from '@/hooks/usePlayerSoldCelebration';
import { initials } from '@/lib/format';

type CelebrationParticle = {
  id: string;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  rotate: number;
  color: string;
};

type Props = {
  celebration: SaleCelebration | null;
  particles?: CelebrationParticle[];
};

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

function mulberry32(seed: number) {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createCelebrationParticles(seed: string): CelebrationParticle[] {
  const random = mulberry32(hashString(seed));

  const colors = [
    'linear-gradient(135deg, rgba(255,221,87,1), rgba(255,255,255,1))',
    'linear-gradient(135deg, rgba(74,222,128,1), rgba(255,255,255,1))',
    'linear-gradient(135deg, rgba(96,165,250,1), rgba(255,255,255,1))',
    'linear-gradient(135deg, rgba(244,114,182,1), rgba(255,255,255,1))',
    'linear-gradient(135deg, rgba(251,146,60,1), rgba(255,255,255,1))',
    'linear-gradient(135deg, rgba(167,139,250,1), rgba(255,255,255,1))',
  ];

  return Array.from({ length: 48 }, (_, index) => ({
    id: `${seed}-${index}`,
    left: 4 + random() * 92,
    top: -18 - random() * 14,
    size: 5 + random() * 9,
    duration: 2.1 + random() * 0.75,
    delay: random() * 0.45,
    drift: (random() - 0.5) * 240,
    rotate: 180 + random() * 600,
    color: colors[index % colors.length],
  }));
}

function TeamLogo({
  logoUrl,
  label,
}: {
  logoUrl?: string | null;
  label: string;
}) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={label}
        loading="eager"
        decoding="async"
        referrerPolicy="no-referrer"
        className="h-full w-full object-cover"
      />
    );
  }

  return <span className="text-2xl font-black uppercase tracking-tight text-white/85">{initials(label)}</span>;
}

export function PlayerSoldCelebrationOverlay({ celebration, particles: providedParticles }: Props) {
  const reduceMotion = useReducedMotion();

  const particles = useMemo(
    () => providedParticles || (celebration ? createCelebrationParticles(celebration.id) : []),
    [celebration, providedParticles],
  );

  return (
    <AnimatePresence>
      {celebration && (
        <motion.div
          key={celebration.id}
          className="pointer-events-none fixed inset-0 z-[80] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px] sm:backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="absolute left-1/2 top-1/2 h-[clamp(16rem,48vw,38rem)] w-[clamp(16rem,48vw,38rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/15 blur-[clamp(70px,14vw,120px)]"
            initial={{ scale: 0.82, opacity: 0.18 }}
            animate={reduceMotion ? { opacity: 0.22 } : { scale: [0.82, 1.06, 0.95], opacity: [0.18, 0.4, 0.26] }}
            transition={{ duration: 3, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute right-[-8vw] top-[-8vw] h-[clamp(10rem,26vw,22rem)] w-[clamp(10rem,26vw,22rem)] rounded-full bg-yellow-300/10 blur-[clamp(60px,12vw,100px)]"
            initial={{ scale: 0.7, opacity: 0.12 }}
            animate={reduceMotion ? { opacity: 0.18 } : { scale: [0.7, 1, 0.85], opacity: [0.12, 0.32, 0.18] }}
            transition={{ duration: 3, ease: 'easeInOut' }}
          />

          <motion.div
            className="absolute left-1/2 top-[max(8svh,1.5rem)] -translate-x-1/2 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.34em] text-yellow-200 shadow-[0_0_40px_rgba(250,204,21,0.2)] sm:px-5 sm:py-2.5 sm:text-xs"
            initial={{ y: -18, opacity: 0, scale: 0.86 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -16, opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.35 }}
          >
            <PartyPopper size={14} className="mr-2 inline-block" />
            Player Sold
          </motion.div>

          {particles.map((particle) => (
            <motion.span
              key={particle.id}
              className="absolute rounded-sm shadow-[0_0_16px_rgba(255,255,255,0.35)]"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                width: `${particle.size}px`,
                height: `${particle.size * 0.7}px`,
                background: particle.color,
              }}
              initial={{ opacity: 0, y: -10, x: 0, rotate: 0 }}
              animate={
                reduceMotion
                  ? { opacity: [0, 1, 0], y: [0, 120], x: [0, particle.drift * 0.35], rotate: [0, particle.rotate * 0.3] }
                  : {
                      opacity: [0, 1, 1, 0],
                      y: [0, 180, 420],
                      x: [0, particle.drift * 0.55, particle.drift],
                      rotate: [0, particle.rotate * 0.5, particle.rotate],
                    }
              }
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: 'easeOut',
              }}
            />
          ))}

          <motion.div
            className="absolute left-1/2 top-1/2 w-[min(94vw,46rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[1.6rem] border border-white/15 bg-black/80 px-4 py-5 shadow-[0_24px_100px_rgba(0,0,0,0.68)] backdrop-blur-2xl sm:rounded-[2rem] sm:px-5 sm:py-6 md:px-8 md:py-8"
            initial={{ scale: 0.72, y: 26, opacity: 0 }}
            animate={reduceMotion ? { scale: 1, y: 0, opacity: 1 } : { scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 16, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 20 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.12),transparent_50%),radial-gradient(circle_at_bottom_right,rgba(74,222,128,0.12),transparent_38%)]" />
            <div className="relative z-10 grid gap-5 md:grid-cols-[auto,1fr,auto] md:items-center md:gap-7">
              <motion.div
                className="relative flex h-20 w-20 items-center justify-center rounded-[1.4rem] border border-orange-300/30 bg-orange-300/10 text-orange-200 shadow-[0_0_35px_rgba(251,146,60,0.28)] sm:h-24 sm:w-24 md:h-28 md:w-28"
                animate={reduceMotion ? undefined : { rotate: [0, -14, 12, -8, 0], y: [0, -8, 0] }}
                transition={{ duration: 1.9, repeat: Infinity, repeatType: 'mirror' }}
              >
                <span className="absolute inset-0 rounded-[1.4rem] bg-orange-300/10 blur-xl" />
                <Hammer size={reduceMotion ? 30 : 40} strokeWidth={2.1} />
              </motion.div>

              <div className="min-w-0 text-center md:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-green-300/20 bg-green-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-green-200 sm:text-[11px]">
                  <Sparkles size={14} />
                  SOLD TO
                </div>
                <h3 className="mt-4 break-words text-[clamp(2rem,6.2vw,4.75rem)] font-black uppercase tracking-tight text-white leading-[0.92]">
                  {celebration.playerName}
                </h3>
                <p className="mt-3 text-base font-semibold text-white/72 sm:text-lg md:text-xl">{celebration.teamName}</p>
                <p className="mt-2 text-sm font-medium text-white/45">
                  Celebration stays on screen for 3 seconds and does not block the interface.
                </p>
              </div>

              <motion.div
                className="mx-auto flex flex-col items-center gap-3 md:mx-0"
                animate={reduceMotion ? undefined : { y: [0, -10, 0], scale: [1, 1.02, 1] }}
                transition={{ duration: 2.3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="relative h-[4.5rem] w-[4.5rem] overflow-hidden rounded-full border border-white/12 bg-white/5 sm:h-20 sm:w-20 md:h-24 md:w-24">
                  <span className="absolute inset-0 rounded-full bg-green-300/20 blur-2xl" />
                  <TeamLogo logoUrl={celebration.teamLogo} label={celebration.teamName} />
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-green-200 sm:text-xs">
                  {celebration.teamName}
                </div>
              </motion.div>
            </div>

            <motion.div
              className="relative z-10 mt-5 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.28em] text-white/55 sm:text-xs"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <span className="h-px w-8 bg-white/15 sm:w-10" />
              Auction Moment
              <span className="h-px w-8 bg-white/15 sm:w-10" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
