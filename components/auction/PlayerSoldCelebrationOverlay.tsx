"use client";

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Award } from 'lucide-react';
import type { SaleCelebration } from '@/hooks/usePlayerSoldCelebration';
import { initials } from '@/lib/format';
import { GlassEffect, GlassFilter } from '@/components/ui/liquid-glass';
import { BorderBeam } from '@/components/ui/BorderBeam';
import { Confetti } from '@/components/ui/Confetti';
import {
  IMPACT_AT,
  SOLD_VARIANTS,
  type SoldAnimationVariant,
  type SoldVisualConfig,
} from '@/lib/sold-celebration-config';
import { playGavelWhoosh, playSoldImpactSounds } from '@/lib/sold-celebration-audio';

type Props = {
  celebration: SaleCelebration | null;
  /**
   * Visual / audio intensity preset.
   * - classic (default): balanced live-auction smash
   * - epic: big-money sale drama
   * - minimal: reduced particles / no confetti
   * - stadium: broadcast / large-screen emphasis
   */
  variant?: SoldAnimationVariant;
};

type ViewportMetrics = {
  width: number;
  height: number;
  ready: boolean;
};

type LayoutMetrics = {
  scale: number;
  cardWidth: number;
  cardMaxHeight: number;
  gavelSize: number;
  avatarSize: number;
  shardCount: number;
  crackCount: number;
  sparkCount: number;
};

type Crack = {
  id: string;
  d: string;
  width: number;
  delay: number;
};

type Shard = {
  id: string;
  angle: number;
  distance: number;
  size: number;
  duration: number;
  delay: number;
  rotate: number;
  color: string;
  clip: string;
};

type Spark = {
  id: string;
  angle: number;
  distance: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
};

const SHARD_CLIPS = [
  'polygon(50% 0%, 100% 60%, 60% 100%, 0% 45%)',
  'polygon(20% 0%, 100% 20%, 80% 100%, 0% 70%)',
  'polygon(50% 0%, 100% 100%, 0% 100%)',
  'polygon(0% 30%, 70% 0%, 100% 50%, 40% 100%, 0% 80%)',
  'polygon(10% 0%, 100% 10%, 90% 100%, 0% 60%)',
];

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

/**
 * Jagged crack paths radiating from the screen center (viewBox 0..100), each with
 * a short branch, so the whole viewport reads as struck glass.
 */
function createCracks(seed: string, count: number): Crack[] {
  const random = mulberry32(hashString(`${seed}-cracks`));
  const cracks: Crack[] = [];

  for (let index = 0; index < count; index += 1) {
    const baseAngle = (index / count) * Math.PI * 2 + (random() - 0.5) * 0.6;
    const length = 28 + random() * 34;
    const segments = 4 + Math.floor(random() * 3);
    const points: Array<[number, number]> = [[50, 50]];

    let angle = baseAngle;
    for (let segment = 1; segment <= segments; segment += 1) {
      angle += (random() - 0.5) * 0.7;
      const radius = (length * segment) / segments;
      points.push([50 + Math.cos(angle) * radius, 50 + Math.sin(angle) * radius]);
    }

    const d = `M ${points.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L ')}`;
    cracks.push({ id: `${seed}-crack-${index}`, d, width: 1.4 + random() * 1.6, delay: random() * 0.1 });

    const [bx, by] = points[Math.max(1, Math.floor(points.length / 2))];
    const branchAngle = angle + (random() > 0.5 ? 1 : -1) * (0.7 + random() * 0.5);
    const branchLength = 8 + random() * 12;
    const branchD = `M ${bx.toFixed(2)} ${by.toFixed(2)} L ${(bx + Math.cos(branchAngle) * branchLength).toFixed(2)} ${(by + Math.sin(branchAngle) * branchLength).toFixed(2)}`;
    cracks.push({ id: `${seed}-branch-${index}`, d: branchD, width: 0.9 + random() * 0.8, delay: 0.08 + random() * 0.12 });
  }

  return cracks;
}

/** Glass shards that burst radially outward from the impact point. */
function createShards(seed: string, count: number, scale: number, palette: SoldVisualConfig['palette']): Shard[] {
  const random = mulberry32(hashString(`${seed}-shards`));

  const palettes: Record<SoldVisualConfig['palette'], string[]> = {
    amber: [
      'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(148,197,255,0.5))',
      'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(186,230,253,0.45))',
      'linear-gradient(135deg, rgba(255,215,0,0.95), rgba(255,255,255,0.85))',
      'linear-gradient(135deg, rgba(226,232,240,0.9), rgba(255,255,255,0.4))',
    ],
    ice: [
      'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(165,243,252,0.55))',
      'linear-gradient(135deg, rgba(224,242,254,0.95), rgba(125,211,252,0.4))',
      'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(186,230,253,0.5))',
    ],
    stadium: [
      'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(253,230,138,0.55))',
      'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(56,189,248,0.5))',
      'linear-gradient(135deg, rgba(253,224,71,0.95), rgba(255,255,255,0.9))',
      'linear-gradient(135deg, rgba(226,232,240,0.95), rgba(255,255,255,0.45))',
    ],
  };

  const colors = palettes[palette];

  return Array.from({ length: count }, (_, index) => ({
    id: `${seed}-shard-${index}`,
    angle: (index / count) * Math.PI * 2 + (random() - 0.5) * 0.8,
    distance: (180 + random() * 460) * scale,
    size: (7 + random() * 16) * scale,
    duration: 0.75 + random() * 0.85,
    delay: random() * 0.12,
    rotate: (random() - 0.5) * 980,
    color: colors[index % colors.length],
    clip: SHARD_CLIPS[index % SHARD_CLIPS.length],
  }));
}

/** Hot sparks / embers flying from the impact crater. */
function createSparks(seed: string, count: number, scale: number, palette: SoldVisualConfig['palette']): Spark[] {
  const random = mulberry32(hashString(`${seed}-sparks`));
  const colors =
    palette === 'ice'
      ? ['#e0f2fe', '#bae6fd', '#7dd3fc', '#ffffff', '#f0f9ff']
      : ['#fef08a', '#fde047', '#fbbf24', '#ffffff', '#fdba74', '#fef3c7'];

  return Array.from({ length: count }, (_, index) => ({
    id: `${seed}-spark-${index}`,
    angle: (index / count) * Math.PI * 2 + (random() - 0.5) * 0.9,
    distance: (120 + random() * 380) * scale,
    size: (2 + random() * 5) * scale,
    duration: 0.35 + random() * 0.55,
    delay: random() * 0.08,
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

/** Wooden auction gavel drawn as SVG so it scales crisply at any size. */
function GavelGraphic({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      style={{ filter: 'drop-shadow(0 18px 40px rgba(0,0,0,0.6)) drop-shadow(0 0 24px rgba(245,158,11,0.45))' }}
    >
      <defs>
        <linearGradient id="gavel-head" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d97706" />
          <stop offset="0.5" stopColor="#92400e" />
          <stop offset="1" stopColor="#5b2607" />
        </linearGradient>
        <linearGradient id="gavel-handle" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b45309" />
          <stop offset="1" stopColor="#6b3410" />
        </linearGradient>
        <linearGradient id="gavel-band" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
      </defs>

      <rect x="45.5" y="34" width="9" height="56" rx="4.5" fill="url(#gavel-handle)" />
      <rect x="43.5" y="82" width="13" height="8" rx="4" fill="url(#gavel-band)" />

      <rect x="18" y="6" width="64" height="30" rx="9" fill="url(#gavel-head)" />
      <rect x="14" y="4" width="10" height="34" rx="5" fill="url(#gavel-band)" />
      <rect x="76" y="4" width="10" height="34" rx="5" fill="url(#gavel-band)" />
      <rect x="26" y="10" width="48" height="5" rx="2.5" fill="rgba(255,255,255,0.28)" />
    </svg>
  );
}

function buildLayout(viewport: ViewportMetrics, visual: SoldVisualConfig, variant: SoldAnimationVariant): LayoutMetrics {
  const width = viewport.width || 1440;
  const height = viewport.height || 900;
  const shortSide = Math.min(width, height);

  const scale = clamp(shortSide / 900, 0.72, 1.14);
  const isPhone = width < 640;
  const isTablet = width >= 640 && width < 1024;
  const gavelBoost = variant === 'stadium' ? 1.12 : variant === 'epic' ? 1.08 : 1;

  const cardWidth = Math.round(
    clamp(width * (isPhone ? 0.92 : isTablet ? 0.78 : 0.6), isPhone ? 300 : isTablet ? 400 : 480, isPhone ? 440 : isTablet ? 700 : 780),
  );
  const cardMaxHeight = Math.round(
    clamp(height * (isPhone ? 0.52 : 0.48), isPhone ? 260 : 320, isPhone ? 420 : 540),
  );

  return {
    scale,
    cardWidth,
    cardMaxHeight,
    gavelSize: Math.round(clamp(shortSide * (isPhone ? 0.5 : 0.36) * gavelBoost, 170, 400)),
    avatarSize: Math.round(clamp(shortSide * (isPhone ? 0.16 : 0.12), 64, 116)),
    shardCount: isPhone ? visual.shardCountPhone : visual.shardCountDesktop,
    crackCount: isPhone ? visual.crackCountPhone : visual.crackCountDesktop,
    sparkCount: isPhone ? visual.sparkCountPhone : visual.sparkCountDesktop,
  };
}

export function PlayerSoldCelebrationOverlay({ celebration, variant = 'classic' }: Props) {
  const reduceMotion = useReducedMotion();
  const viewport = useViewportMetrics();
  const [mounted, setMounted] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [impactDone, setImpactDone] = useState(false);

  const visual = SOLD_VARIANTS[variant] ?? SOLD_VARIANTS.classic;
  const intensity = reduceMotion ? 0.2 : visual.intensity;

  useEffect(() => {
    setMounted(true);
    setPortalTarget(document.body);
  }, []);

  // Impact timer: confetti + SFX fire when the gavel lands.
  useEffect(() => {
    setImpactDone(false);
    if (!celebration) return;

    const impactMs = reduceMotion ? 0 : IMPACT_AT * 1000;
    const whooshMs = reduceMotion ? -1 : Math.max(0, (IMPACT_AT - 0.32) * 1000);

    let whooshTimer: number | null = null;
    if (whooshMs >= 0) {
      whooshTimer = window.setTimeout(() => playGavelWhoosh(variant), whooshMs);
    }

    const impactTimer = window.setTimeout(() => {
      setImpactDone(true);
      if (!reduceMotion) {
        playSoldImpactSounds(variant);
      }
    }, impactMs);

    return () => {
      if (whooshTimer !== null) window.clearTimeout(whooshTimer);
      window.clearTimeout(impactTimer);
    };
  }, [celebration, reduceMotion, variant]);

  const layout = useMemo(() => buildLayout(viewport, visual, variant), [viewport, visual, variant]);

  const cracks = useMemo(
    () => (celebration ? createCracks(celebration.id, layout.crackCount) : []),
    [celebration, layout.crackCount],
  );

  const shards = useMemo(
    () => (celebration ? createShards(celebration.id, layout.shardCount, layout.scale, visual.palette) : []),
    [celebration, layout.shardCount, layout.scale, visual.palette],
  );

  const sparks = useMemo(
    () => (celebration ? createSparks(celebration.id, layout.sparkCount, layout.scale, visual.palette) : []),
    [celebration, layout.sparkCount, layout.scale, visual.palette],
  );

  if (!celebration || !mounted || !portalTarget || !viewport.ready) {
    return null;
  }

  const delay = (offset: number) => (reduceMotion ? 0 : IMPACT_AT + offset);
  const shakeAmp = 16 * intensity;
  const ringScale = 14 * (0.85 + intensity * 0.15);

  return createPortal(
    <AnimatePresence mode="wait">
      <motion.div
        key={celebration.id}
        role="presentation"
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28 }}
      >
        <GlassFilter />

        {impactDone && visual.confettiCount > 0 && (
          <Confetti isActive={true} duration={visual.confettiDurationMs} particleCount={visual.confettiCount} zIndex={10000} />
        )}

        {/* Full-scene shake + impact squash */}
        <motion.div
          className="absolute inset-0"
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [0, 0, -shakeAmp, shakeAmp * 0.875, -shakeAmp * 0.625, shakeAmp * 0.44, -shakeAmp * 0.25, 0],
                  y: [0, 0, shakeAmp * 0.75, -shakeAmp * 0.625, shakeAmp * 0.5, -shakeAmp * 0.31, shakeAmp * 0.19, 0],
                  scale: [1, 1, 1.02, 0.99, 1.005, 1.01, 1.005, 1],
                }
          }
          transition={{
            duration: IMPACT_AT + 0.55,
            times: [0, IMPACT_AT / (IMPACT_AT + 0.55), 0.58, 0.68, 0.78, 0.88, 0.95, 1],
            ease: 'easeOut',
          }}
        >
          {/* Brief optical distortion pulse at impact (blur + contrast) */}
          {visual.screenRipple && !reduceMotion && (
            <motion.div
              className="pointer-events-none absolute inset-0 z-[5]"
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{
                opacity: [0, 0, 0.85, 0.35, 0],
                backdropFilter: ['blur(0px)', 'blur(0px)', `blur(${3 * intensity}px)`, `blur(${1.2 * intensity}px)`, 'blur(0px)'],
              }}
              transition={{
                duration: IMPACT_AT + 0.5,
                times: [0, IMPACT_AT / (IMPACT_AT + 0.5), (IMPACT_AT + 0.06) / (IMPACT_AT + 0.5), 0.75, 1],
                ease: 'easeOut',
              }}
              style={{
                background:
                  'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.12) 0%, transparent 55%)',
              }}
            />
          )}
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Impact flash */}
          {!reduceMotion && (
            <motion.div
              className="absolute inset-0 bg-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 0.92 * Math.min(1, intensity), 0] }}
              transition={{
                duration: IMPACT_AT + 0.4,
                times: [0, IMPACT_AT / (IMPACT_AT + 0.4), (IMPACT_AT + 0.06) / (IMPACT_AT + 0.4), 1],
                ease: 'easeOut',
              }}
            />
          )}

          {/* Chromatic aberration flash (red/cyan split) */}
          {visual.chromaticFlash && !reduceMotion && (
            <>
              <motion.div
                className="absolute inset-0 mix-blend-screen"
                style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,40,40,0.55), transparent 55%)' }}
                initial={{ opacity: 0, x: 0 }}
                animate={{ opacity: [0, 0, 0.7, 0], x: [0, 0, -10 * intensity, 0] }}
                transition={{
                  duration: IMPACT_AT + 0.35,
                  times: [0, IMPACT_AT / (IMPACT_AT + 0.35), (IMPACT_AT + 0.05) / (IMPACT_AT + 0.35), 1],
                }}
              />
              <motion.div
                className="absolute inset-0 mix-blend-screen"
                style={{ background: 'radial-gradient(circle at 50% 50%, rgba(40,220,255,0.5), transparent 55%)' }}
                initial={{ opacity: 0, x: 0 }}
                animate={{ opacity: [0, 0, 0.65, 0], x: [0, 0, 10 * intensity, 0] }}
                transition={{
                  duration: IMPACT_AT + 0.35,
                  times: [0, IMPACT_AT / (IMPACT_AT + 0.35), (IMPACT_AT + 0.05) / (IMPACT_AT + 0.35), 1],
                }}
              />
            </>
          )}

          {/* Screen ripple rings (visual impact waves) */}
          {visual.screenRipple &&
            !reduceMotion &&
            [0, 0.08, 0.16].slice(0, visual.shockwaveRings + 1).map((ringDelay, ringIndex) => (
              <motion.div
                key={`ripple-${ringIndex}`}
                className="absolute left-1/2 top-1/2 rounded-full border border-white/30"
                style={{
                  width: 40,
                  height: 40,
                  marginLeft: -20,
                  marginTop: -20,
                  boxShadow: '0 0 40px rgba(255,255,255,0.25), inset 0 0 30px rgba(255,255,255,0.15)',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, ringScale * 1.15], opacity: [0.75, 0] }}
                transition={{ duration: 0.85, delay: delay(ringDelay), ease: 'easeOut' }}
              />
            ))}

          {/* Shockwave rings from the impact point */}
          {!reduceMotion &&
            Array.from({ length: visual.shockwaveRings }, (_, ringIndex) => (
              <motion.div
                key={`ring-${ringIndex}`}
                className="absolute left-1/2 top-1/2 rounded-full border-4 border-amber-200/70"
                style={{
                  width: 80,
                  height: 80,
                  marginLeft: -40,
                  marginTop: -40,
                  boxShadow: '0 0 60px rgba(245,158,11,0.5), inset 0 0 40px rgba(255,255,255,0.4)',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, ringScale], opacity: [0.9, 0] }}
                transition={{ duration: 0.9, delay: delay(ringIndex * 0.12), ease: 'easeOut' }}
              />
            ))}

          {/* Cracked glass spidering out across the screen */}
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {cracks.map((crack) => (
              <motion.path
                key={crack.id}
                d={crack.d}
                stroke="rgba(226,240,255,0.85)"
                strokeWidth={crack.width}
                strokeLinecap="round"
                fill="none"
                vectorEffect="non-scaling-stroke"
                style={{ filter: 'drop-shadow(0 0 6px rgba(148,197,255,0.8))' }}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: reduceMotion ? 0.35 : [0, 1, 1, 0.55] }}
                transition={{
                  pathLength: { duration: reduceMotion ? 0 : 0.28, delay: delay(crack.delay), ease: 'easeOut' },
                  opacity: { duration: 2.4, delay: delay(crack.delay), times: [0, 0.1, 0.7, 1] },
                }}
              />
            ))}
            <motion.circle
              cx="50"
              cy="50"
              r="2.2"
              fill="rgba(255,255,255,0.9)"
              style={{ filter: 'blur(2px)' }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0.4], scale: 1 }}
              transition={{ duration: 0.6, delay: delay(0) }}
            />
          </svg>

          {/* Glass shards bursting outward */}
          {!reduceMotion &&
            shards.map((shard) => (
              <motion.span
                key={shard.id}
                className="absolute left-1/2 top-1/2 shadow-[0_0_14px_rgba(255,255,255,0.5)]"
                style={{
                  width: `${shard.size}px`,
                  height: `${shard.size * 1.4}px`,
                  background: shard.color,
                  clipPath: shard.clip,
                }}
                initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }}
                animate={{
                  x: Math.cos(shard.angle) * shard.distance,
                  y: Math.sin(shard.angle) * shard.distance + 70 * intensity,
                  opacity: [0, 1, 1, 0],
                  rotate: shard.rotate,
                }}
                transition={{ duration: shard.duration, delay: delay(shard.delay), ease: 'easeOut' }}
              />
            ))}

          {/* Sparks / particles from impact */}
          {!reduceMotion &&
            sparks.map((spark) => (
              <motion.span
                key={spark.id}
                className="absolute left-1/2 top-1/2 rounded-full"
                style={{
                  width: spark.size,
                  height: spark.size,
                  background: spark.color,
                  boxShadow: `0 0 ${spark.size * 3}px ${spark.color}`,
                }}
                initial={{ x: 0, y: 0, opacity: 0, scale: 1 }}
                animate={{
                  x: Math.cos(spark.angle) * spark.distance,
                  y: Math.sin(spark.angle) * spark.distance + 40,
                  opacity: [0, 1, 0.8, 0],
                  scale: [1, 1.2, 0.4],
                }}
                transition={{ duration: spark.duration, delay: delay(spark.delay), ease: 'easeOut' }}
              />
            ))}

          {/* The gavel — swings in from the top-right, smashes center, recoils away */}
          {!reduceMotion && (
            <motion.div
              className="absolute left-1/2 top-1/2 z-30"
              style={{ marginLeft: -layout.gavelSize / 2, marginTop: -layout.gavelSize * 0.92 }}
              initial={{ x: '55vw', y: '-60vh', rotate: -95, opacity: 0 }}
              animate={{
                x: ['55vw', '0vw', '0vw', '6vw'],
                y: ['-60vh', '0vh', '0vh', '-18vh'],
                rotate: [-95, 18, 12, -30],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: IMPACT_AT + 0.65,
                times: [0, IMPACT_AT / (IMPACT_AT + 0.65), (IMPACT_AT + 0.12) / (IMPACT_AT + 0.65), 1],
                ease: ['easeIn', 'linear', 'easeOut'],
              }}
            >
              <GavelGraphic size={layout.gavelSize} />
            </motion.div>
          )}

          {/* SOLD! stamp + player card — revealed by the impact */}
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 sm:gap-6"
            style={{
              paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
              paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
              paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
              paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
            }}
          >
            <motion.div
              className="relative"
              initial={reduceMotion ? { opacity: 0 } : { scale: 3.2, opacity: 0, rotate: -18 }}
              animate={reduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1, rotate: -7 }}
              transition={{ type: 'spring', stiffness: 320, damping: 16, delay: delay(0.02) }}
            >
              <span
                className="block select-none text-[clamp(4.5rem,16vw,11rem)] font-black uppercase leading-none tracking-tight text-transparent font-display"
                style={{
                  WebkitTextStroke: '3px rgba(255,255,255,0.95)',
                  textShadow: '0 0 60px rgba(245,158,11,0.65)',
                  backgroundImage: 'linear-gradient(180deg, #fde68a 0%, #f59e0b 45%, #b45309 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                }}
              >
                SOLD!
              </span>
            </motion.div>

            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 22, delay: delay(0.18) }}
              style={{
                width: `${layout.cardWidth}px`,
                maxWidth: 'min(92vw, 780px)',
                maxHeight: `min(${layout.cardMaxHeight}px, 60vh)`,
              }}
            >
              <BorderBeam lightColor="#F59E0B" lightWidth={350} duration={6}>
                <GlassEffect className="w-full h-full rounded-[2.2rem] p-5 sm:p-7 md:p-8 border border-amber-300/30 shadow-[0_32px_120px_rgba(0,0,0,0.8)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.22),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.18),transparent_50%)] pointer-events-none" />

                  <div className="relative z-10 grid gap-5 md:grid-cols-[minmax(0,1fr),auto] md:items-center md:gap-8">
                    <div className="min-w-0 text-center md:text-left space-y-2">
                      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/20 px-4 py-1.5 text-xs font-black uppercase tracking-[0.25em] text-emerald-200 shadow-md">
                        <Sparkles size={14} className="text-emerald-300" />
                        <span>SOLD TO</span>
                      </div>

                      <h3 className="break-words text-[clamp(2rem,4.5vw,4.2rem)] font-black uppercase tracking-tight leading-none text-white font-display">
                        {celebration.playerName}
                      </h3>

                      <div className="flex items-center justify-center md:justify-start gap-2 text-amber-300 font-extrabold text-lg sm:text-xl md:text-2xl">
                        <Award size={20} className="text-amber-400" />
                        <span>{celebration.teamName}</span>
                      </div>
                    </div>

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

                  <motion.div
                    className="relative z-10 mt-5 flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-white/60"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: delay(0.3), duration: 0.4 }}
                  >
                    <span className="h-px w-12 bg-gradient-to-r from-transparent to-amber-300/40" />
                    <span className="text-amber-300">AUCTION MOMENT</span>
                    <span className="h-px w-12 bg-gradient-to-l from-transparent to-amber-300/40" />
                  </motion.div>
                </GlassEffect>
              </BorderBeam>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    portalTarget,
  );
}
