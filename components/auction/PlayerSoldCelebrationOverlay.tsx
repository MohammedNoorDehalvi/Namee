"use client";

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Hammer, PartyPopper, Sparkles, Award } from 'lucide-react';
import type { SaleCelebration } from '@/hooks/usePlayerSoldCelebration';
import { initials } from '@/lib/format';
import { GlassEffect, GlassFilter } from '@/components/ui/liquid-glass';

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

type ViewportMetrics = {
  width: number;
  height: number;
  ready: boolean;
};

type LayoutMetrics = {
  scale: number;
  particleCount: number;
  cardWidth: number;
  cardMaxHeight: number;
  orbSize: number;
  badgeTop: number;
  avatarSize: number;
  iconSize: number;
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function useViewportMetrics() {
  const [viewport, setViewport] = useState<ViewportMetrics>({
    width: 0,
    height: 0,
    ready: false,
  });

  useEffect(() => {
    let frame = 0;

    const updateViewport = () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      frame = window.requestAnimationFrame(() => {
        const visualViewport = window.visualViewport;
        const width = Math.round(visualViewport?.width ?? window.innerWidth ?? 0);
        const height = Math.round(visualViewport?.height ?? window.innerHeight ?? 0);

        setViewport({
          width,
          height,
          ready: width > 0 && height > 0,
        });
      });
    };

    updateViewport();

    window.addEventListener('resize', updateViewport, { passive: true });
    window.addEventListener('orientationchange', updateViewport, { passive: true });
    window.visualViewport?.addEventListener('resize', updateViewport);
    window.visualViewport?.addEventListener('scroll', updateViewport);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
      window.visualViewport?.removeEventListener('resize', updateViewport);
      window.visualViewport?.removeEventListener('scroll', updateViewport);
    };
  }, []);

  return viewport;
}

function createCelebrationParticles(seed: string, count: number, viewportScale: number): CelebrationParticle[] {
  const random = mulberry32(hashString(seed));

  const colors = [
    'linear-gradient(135deg, rgba(255,215,0,1), rgba(255,255,255,1))',
    'linear-gradient(135deg, rgba(16,185,129,1), rgba(255,255,255,1))',
    'linear-gradient(135deg, rgba(56,189,248,1), rgba(255,255,255,1))',
    'linear-gradient(135deg, rgba(236,72,153,1), rgba(255,255,255,1))',
    'linear-gradient(135deg, rgba(245,158,11,1), rgba(255,255,255,1))',
    'linear-gradient(135deg, rgba(168,85,247,1), rgba(255,255,255,1))',
  ];

  return Array.from({ length: count }, (_, index) => ({
    id: `${seed}-${index}`,
    left: 2 + random() * 96,
    top: -20 - random() * 15,
    size: (6 + random() * 10) * viewportScale,
    duration: 2.2 + random() * 1.1,
    delay: random() * 0.4,
    drift: (random() - 0.5) * (260 + viewportScale * 80),
    rotate: 360 + random() * 720,
    color: colors[index % colors.length],
  }));
}

function TeamLogo({ logoUrl, label }: { logoUrl?: string | null; label: string }) {
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

  return <span className="text-2xl font-black uppercase tracking-tight text-amber-300">{initials(label)}</span>;
}

function buildLayout(viewport: ViewportMetrics): LayoutMetrics {
  const width = viewport.width || 1440;
  const height = viewport.height || 900;
  const shortSide = Math.min(width, height);

  const scale = clamp(shortSide / 900, 0.72, 1.14);
  const isPhone = width < 640;
  const isTablet = width >= 640 && width < 1024;

  const cardWidth = Math.round(
    clamp(width * (isPhone ? 0.92 : isTablet ? 0.78 : 0.6), isPhone ? 300 : isTablet ? 400 : 480, isPhone ? 440 : isTablet ? 700 : 780),
  );
  const cardMaxHeight = Math.round(
    clamp(height * (isPhone ? 0.58 : 0.52), isPhone ? 280 : 340, isPhone ? 460 : 580),
  );

  return {
    scale,
    particleCount: Math.round(clamp(50 + scale * 30 + (isPhone ? 10 : 16), 44, 90)),
    cardWidth,
    cardMaxHeight,
    orbSize: Math.round(clamp(shortSide * (isPhone ? 0.6 : 0.48), 240, 580)),
    badgeTop: Math.round(clamp(height * 0.045, 12, 32)),
    avatarSize: Math.round(clamp(shortSide * (isPhone ? 0.18 : 0.14), 72, 136)),
    iconSize: Math.round(clamp(shortSide * (isPhone ? 0.12 : 0.1), 32, 52)),
  };
}

export function PlayerSoldCelebrationOverlay({ celebration, particles: providedParticles }: Props) {
  const reduceMotion = useReducedMotion();
  const viewport = useViewportMetrics();
  const [mounted, setMounted] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    setPortalTarget(document.body);
  }, []);

  const layout = useMemo(() => buildLayout(viewport), [viewport]);

  const particles = useMemo(
    () => providedParticles || (celebration ? createCelebrationParticles(celebration.id, layout.particleCount, layout.scale) : []),
    [celebration, layout.particleCount, layout.scale, providedParticles],
  );

  if (!celebration || !mounted || !portalTarget || !viewport.ready) {
    return null;
  }

  return createPortal(
    <AnimatePresence mode="wait">
      <motion.div
        key={celebration.id}
        role="presentation"
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
        style={{
          paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
          paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
          paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
          paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <GlassFilter />

        {/* Backdrop overlay */}
        <motion.div
          className="absolute inset-0 bg-slate-950/75 backdrop-blur-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        />

        {/* Ambient Pulsing Spotlights */}
        <motion.div
          className="absolute left-1/2 top-1/2 rounded-full bg-amber-400/25 blur-[clamp(80px,18vw,140px)]"
          style={{
            width: `${layout.orbSize * 1.2}px`,
            height: `${layout.orbSize * 1.2}px`,
          }}
          initial={{ scale: 0.7, opacity: 0.2, x: '-50%', y: '-50%' }}
          animate={
            reduceMotion
              ? { opacity: 0.3, x: '-50%', y: '-50%' }
              : { scale: [0.7, 1.15, 0.95], opacity: [0.2, 0.5, 0.3], x: '-50%', y: '-50%' }
          }
          transition={{ duration: 2.8, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
        />

        <motion.div
          className="absolute right-[-10vw] top-[-10vw] rounded-full bg-emerald-400/20 blur-[clamp(70px,15vw,120px)]"
          style={{
            width: `${Math.round(layout.orbSize * 0.8)}px`,
            height: `${Math.round(layout.orbSize * 0.8)}px`,
          }}
          initial={{ scale: 0.7, opacity: 0.15 }}
          animate={reduceMotion ? { opacity: 0.25 } : { scale: [0.7, 1.1, 0.9], opacity: [0.15, 0.4, 0.25] }}
          transition={{ duration: 3.2, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
        />

        {/* Top Celebration Badge */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 shadow-2xl z-20"
          style={{ top: `${layout.badgeTop}px` }}
          initial={{ y: -24, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.4, type: 'spring', stiffness: 300, damping: 20 }}
        >
          <GlassEffect className="rounded-full px-6 py-2.5 bg-amber-400/20 border border-amber-300/40">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-amber-200">
              <PartyPopper size={16} className="text-amber-300 animate-bounce" />
              <span>PLAYER SOLD</span>
              <Sparkles size={14} className="text-amber-400 animate-spin" />
            </div>
          </GlassEffect>
        </motion.div>

        {/* Exploding Confetti Particles */}
        {particles.map((particle) => (
          <motion.span
            key={particle.id}
            className="absolute rounded-md shadow-[0_0_18px_rgba(255,255,255,0.45)]"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: `${particle.size}px`,
              height: `${particle.size * 0.75}px`,
              background: particle.color,
            }}
            initial={{ opacity: 0, y: -10, x: 0, rotate: 0 }}
            animate={
              reduceMotion
                ? { opacity: [0, 1, 0], y: [0, 140], x: [0, particle.drift * 0.4], rotate: [0, particle.rotate * 0.3] }
                : {
                    opacity: [0, 1, 1, 0],
                    y: [0, 220, 500],
                    x: [0, particle.drift * 0.6, particle.drift],
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

        {/* Central Liquid Glass Celebration Card */}
        <div
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{
            paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
            paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
            paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
          }}
        >
          <motion.div
            initial={{ scale: 0.65, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            style={{
              width: `${layout.cardWidth}px`,
              maxWidth: 'min(92vw, 780px)',
              maxHeight: `min(${layout.cardMaxHeight}px, 85vh)`,
            }}
          >
            <GlassEffect className="w-full h-full rounded-[2.2rem] p-6 sm:p-8 md:p-10 border border-amber-300/30 shadow-[0_32px_120px_rgba(0,0,0,0.8)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.22),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.18),transparent_50%)] pointer-events-none" />

              <div className="relative z-10 grid gap-6 md:grid-cols-[auto,minmax(0,1fr),auto] md:items-center md:gap-8">
                {/* Gavel Hammer Strike Icon */}
                <motion.div
                  className="relative flex items-center justify-center rounded-3xl border border-amber-300/40 bg-amber-400/20 text-amber-300 shadow-[0_0_40px_rgba(245,158,11,0.35)]"
                  style={{
                    width: `${layout.iconSize * 1.8}px`,
                    height: `${layout.iconSize * 1.8}px`,
                  }}
                  animate={
                    reduceMotion
                      ? undefined
                      : { rotate: [0, -40, 15, -10, 0], scale: [1, 1.15, 1] }
                  }
                  transition={{ duration: 1.2, ease: 'easeOut', repeat: Infinity, repeatDelay: 1.5 }}
                >
                  <span className="absolute inset-0 rounded-3xl bg-amber-400/20 blur-xl animate-pulse" />
                  <Hammer size={layout.iconSize} strokeWidth={2.4} className="relative z-10" />
                </motion.div>

                {/* Player Sold Info */}
                <div className="min-w-0 text-center md:text-left space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/20 px-4 py-1.5 text-xs font-black uppercase tracking-[0.25em] text-emerald-200 shadow-md">
                    <Sparkles size={14} className="text-emerald-300" />
                    <span>SOLD TO</span>
                  </div>

                  <h3 className="break-words text-[clamp(2.2rem,5vw,5rem)] font-black uppercase tracking-tight leading-none text-white font-display">
                    {celebration.playerName}
                  </h3>

                  <div className="flex items-center justify-center md:justify-start gap-2 text-amber-300 font-extrabold text-lg sm:text-xl md:text-2xl">
                    <Award size={20} className="text-amber-400" />
                    <span>{celebration.teamName}</span>
                  </div>

                  <p className="text-xs font-medium text-slate-300/80 tracking-wide pt-1">
                    Celebration active for 3 seconds — non-blocking interface.
                  </p>
                </div>

                {/* Team Avatar Badge */}
                <motion.div
                  className="mx-auto flex flex-col items-center gap-3 md:mx-0"
                  animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div
                    className="relative flex items-center justify-center overflow-hidden rounded-full border-2 border-amber-300/40 bg-white/10 p-1 shadow-2xl"
                    style={{
                      width: `${layout.avatarSize}px`,
                      height: `${layout.avatarSize}px`,
                    }}
                  >
                    {/* Rotating Gold Accent Ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400/60 animate-spin" style={{ animationDuration: '10s' }} />
                    <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-slate-900/90">
                      <TeamLogo logoUrl={celebration.teamLogo} label={celebration.teamName} />
                    </div>
                  </div>

                  <span className="rounded-full border border-amber-300/30 bg-amber-400/15 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">
                    {celebration.teamName}
                  </span>
                </motion.div>
              </div>

              {/* Card Footer Divider */}
              <motion.div
                className="relative z-10 mt-6 flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-white/60"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <span className="h-px w-12 bg-gradient-to-r from-transparent to-amber-300/40" />
                <span className="text-amber-300">AUCTION MOMENT</span>
                <span className="h-px w-12 bg-gradient-to-l from-transparent to-amber-300/40" />
              </motion.div>
            </GlassEffect>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>,
    portalTarget,
  );
}
