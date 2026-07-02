"use client";

import { useEffect, useMemo, useState } from 'react';
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

function useViewportMetrics() {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth || 0,
        height: window.innerHeight || 0,
      });
    };

    updateViewport();

    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener('resize', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
      visualViewport?.removeEventListener('resize', updateViewport);
    };
  }, []);

  return viewport;
}

function createCelebrationParticles(seed: string, count: number, viewportScale: number): CelebrationParticle[] {
  const random = mulberry32(hashString(seed));

  const colors = [
    'linear-gradient(135deg, rgba(255,221,87,1), rgba(255,255,255,1))',
    'linear-gradient(135deg, rgba(74,222,128,1), rgba(255,255,255,1))',
    'linear-gradient(135deg, rgba(96,165,250,1), rgba(255,255,255,1))',
    'linear-gradient(135deg, rgba(244,114,182,1), rgba(255,255,255,1))',
    'linear-gradient(135deg, rgba(251,146,60,1), rgba(255,255,255,1))',
    'linear-gradient(135deg, rgba(167,139,250,1), rgba(255,255,255,1))',
  ];

  return Array.from({ length: count }, (_, index) => ({
    id: `${seed}-${index}`,
    left: 2 + random() * 96,
    top: -22 - random() * 12,
    size: (4.5 + random() * 8.5) * viewportScale,
    duration: 2.1 + random() * 0.9,
    delay: random() * 0.45,
    drift: (random() - 0.5) * (220 + viewportScale * 70),
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
  const viewport = useViewportMetrics();

  const viewportScale = useMemo(() => {
    const width = viewport.width || 1440;
    const height = viewport.height || 900;
    const rawScale = Math.min(width / 1280, height / 840);
    return Math.max(0.72, Math.min(1.08, rawScale));
  }, [viewport.height, viewport.width]);

  const particleCount = useMemo(() => {
    return Math.max(24, Math.min(48, Math.round(24 + viewportScale * 18)));
  }, [viewportScale]);

  const particles = useMemo(
    () => providedParticles || (celebration ? createCelebrationParticles(celebration.id, particleCount, viewportScale) : []),
    [celebration, particleCount, providedParticles, viewportScale],
  );

  const cardWidth = useMemo(() => `min(92vw, ${Math.min(46, 46 * viewportScale).toFixed(2)}rem)`, [viewportScale]);
  const cardMaxHeight = useMemo(() => `min(86svh, ${Math.min(44, 44 * viewportScale).toFixed(2)}rem)`, [viewportScale]);

  return (
    <AnimatePresence mode="wait">
      {celebration && (
        <motion.div
          key={celebration.id}
          role="presentation"
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[80] overflow-hidden"
          style={{
            paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
            paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
            paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px] sm:backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          <motion.div
            className="absolute left-1/2 top-1/2 rounded-full bg-emerald-400/15 blur-[clamp(64px,14vw,120px)]"
            style={{
              width: `min(52vw, ${Math.min(34, 34 * viewportScale).toFixed(2)}rem)`,
              height: `min(52vw, ${Math.min(34, 34 * viewportScale).toFixed(2)}rem)`,
            }}
            initial={{ scale: 0.82, opacity: 0.18, x: '-50%', y: '-50%' }}
            animate={reduceMotion ? { opacity: 0.22, x: '-50%', y: '-50%' } : { scale: [0.82, 1.06, 0.95], opacity: [0.18, 0.42, 0.26], x: '-50%', y: '-50%' }}
            transition={{ duration: 3, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute right-[-8vw] top-[-8vw] rounded-full bg-yellow-300/10 blur-[clamp(56px,12vw,100px)]"
            style={{
              width: `min(28vw, ${Math.min(22, 22 * viewportScale).toFixed(2)}rem)`,
              height: `min(28vw, ${Math.min(22, 22 * viewportScale).toFixed(2)}rem)`,
            }}
            initial={{ scale: 0.7, opacity: 0.12 }}
            animate={reduceMotion ? { opacity: 0.18 } : { scale: [0.7, 1, 0.85], opacity: [0.12, 0.32, 0.18] }}
            transition={{ duration: 3, ease: 'easeInOut' }}
          />

          <motion.div
            className="absolute left-1/2 top-[max(5svh,1rem)] -translate-x-1/2 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.34em] text-yellow-200 shadow-[0_0_40px_rgba(250,204,21,0.2)] sm:px-5 sm:py-2.5 sm:text-xs"
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
            className="absolute left-1/2 top-1/2 w-[min(92vw,46rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[1.6rem] border border-white/15 bg-black/80 px-4 py-5 shadow-[0_24px_100px_rgba(0,0,0,0.68)] backdrop-blur-2xl sm:rounded-[2rem] sm:px-5 sm:py-6 md:px-8 md:py-8"
            style={{ width: cardWidth, maxHeight: cardMaxHeight }}
            initial={{ scale: 0.72, y: 26, opacity: 0 }}
            animate={reduceMotion ? { scale: 1, y: 0, opacity: 1 } : { scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 16, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 22 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.12),transparent_50%),radial-gradient(circle_at_bottom_right,rgba(74,222,128,0.12),transparent_38%)]" />
            <div className="relative z-10 grid gap-5 md:grid-cols-[auto,minmax(0,1fr),auto] md:items-center md:gap-7">
              <motion.div
                className="relative flex h-20 w-20 items-center justify-center rounded-[1.4rem] border border-orange-300/30 bg-orange-300/10 text-orange-200 shadow-[0_0_35px_rgba(251,146,60,0.28)] sm:h-24 sm:w-24 md:h-28 md:w-28"
                animate={reduceMotion ? undefined : { rotate: [0, -14, 12, -8, 0], y: [0, -8, 0] }}
                transition={{ duration: 1.9, repeat: Infinity, repeatType: 'mirror' }}
              >
                <span className="absolute inset-0 rounded-[1.4rem] bg-orange-300/10 blur-xl" />
                <Hammer size={reduceMotion ? 30 : 40} strokeWidth={2.1} />
              </motion.div>

              <div className="min-w-0 text-center md:max-w-[min(100%,24rem)] md:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-green-300/20 bg-green-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-green-200 sm:text-[11px]">
                  <Sparkles size={14} />
                  SOLD TO
                </div>
                <h3 className="mt-4 break-words text-[clamp(1.85rem,4.1vw,4.5rem)] font-black uppercase tracking-tight leading-[0.9] text-white">
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
