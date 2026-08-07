/**
 * Timing, intensity, and variation presets for the player-sold celebration.
 * Total runtime is fixed at 5.0s for a smooth, complete beat.
 */

export type SoldAnimationVariant = 'classic' | 'epic' | 'minimal' | 'stadium';

/** Full celebration visible window (ms). */
export const SOLD_CELEBRATION_DURATION_MS = 5000;

/**
 * Seconds from mount until the gavel head lands (center impact).
 * Everything post-impact is keyed off this constant.
 */
export const IMPACT_AT = 0.55;

/** Fade-out starts this many seconds before the hook dismisses the overlay. */
export const EXIT_LEAD_IN = 0.35;

export type SoldVisualConfig = {
  label: string;
  description: string;
  /** Multiplier for shake amplitude, flash, ring scale */
  intensity: number;
  shardCountPhone: number;
  shardCountDesktop: number;
  crackCountPhone: number;
  crackCountDesktop: number;
  sparkCountPhone: number;
  sparkCountDesktop: number;
  shockwaveRings: number;
  confettiCount: number;
  confettiDurationMs: number;
  /** Enable chromatic aberration flash at impact */
  chromaticFlash: boolean;
  /** Enable SVG ripple distortion layer */
  screenRipple: boolean;
  /** Gold-heavy palette vs cool glass */
  palette: 'amber' | 'ice' | 'stadium';
};

export const SOLD_VARIANTS: Record<SoldAnimationVariant, SoldVisualConfig> = {
  classic: {
    label: 'Classic',
    description: 'Balanced hammer smash, glass shatter, sparks, and SOLD stamp. Default for live auction.',
    intensity: 1,
    shardCountPhone: 22,
    shardCountDesktop: 36,
    crackCountPhone: 9,
    crackCountDesktop: 13,
    sparkCountPhone: 28,
    sparkCountDesktop: 48,
    shockwaveRings: 2,
    confettiCount: 140,
    confettiDurationMs: 3200,
    chromaticFlash: true,
    screenRipple: true,
    palette: 'amber',
  },
  epic: {
    label: 'Epic',
    description: 'Maximum drama — more shards, sparks, longer confetti, heavier shake. Big-money sales.',
    intensity: 1.35,
    shardCountPhone: 32,
    shardCountDesktop: 52,
    crackCountPhone: 12,
    crackCountDesktop: 18,
    sparkCountPhone: 42,
    sparkCountDesktop: 72,
    shockwaveRings: 3,
    confettiCount: 200,
    confettiDurationMs: 3800,
    chromaticFlash: true,
    screenRipple: true,
    palette: 'amber',
  },
  minimal: {
    label: 'Minimal',
    description: 'Subtle impact for accessibility / lower-power devices. No confetti, lighter SFX.',
    intensity: 0.55,
    shardCountPhone: 10,
    shardCountDesktop: 16,
    crackCountPhone: 5,
    crackCountDesktop: 7,
    sparkCountPhone: 12,
    sparkCountDesktop: 18,
    shockwaveRings: 1,
    confettiCount: 0,
    confettiDurationMs: 0,
    chromaticFlash: false,
    screenRipple: false,
    palette: 'ice',
  },
  stadium: {
    label: 'Stadium',
    description: 'Broadcast / big-screen mode: larger gavel, stronger shockwaves, high-contrast ice-gold glass.',
    intensity: 1.25,
    shardCountPhone: 28,
    shardCountDesktop: 44,
    crackCountPhone: 11,
    crackCountDesktop: 16,
    sparkCountPhone: 36,
    sparkCountDesktop: 60,
    shockwaveRings: 3,
    confettiCount: 180,
    confettiDurationMs: 3600,
    chromaticFlash: true,
    screenRipple: true,
    palette: 'stadium',
  },
};

/** Timeline beats (seconds from celebration mount). */
export const SOLD_TIMELINE = {
  mount: 0,
  whoosh: IMPACT_AT - 0.32,
  impact: IMPACT_AT,
  flashPeak: IMPACT_AT + 0.05,
  cracks: IMPACT_AT,
  shards: IMPACT_AT,
  sparks: IMPACT_AT,
  shockwave: IMPACT_AT,
  soldStamp: IMPACT_AT + 0.02,
  playerCard: IMPACT_AT + 0.18,
  confetti: IMPACT_AT,
  hold: IMPACT_AT + 1.2,
  exitStart: SOLD_CELEBRATION_DURATION_MS / 1000 - EXIT_LEAD_IN,
  end: SOLD_CELEBRATION_DURATION_MS / 1000,
} as const;
