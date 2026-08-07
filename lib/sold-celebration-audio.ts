/**
 * Procedural Web Audio SFX for the player-sold celebration.
 * Zero asset files — synthesized on demand for small bundle size.
 *
 * Timeline (relative to call, which should fire at IMPACT):
 *   0.00s  sharp impact crack + sub thump
 *   0.04s  glass shatter burst (high-frequency debris)
 *   0.12s  secondary glass tinkle / reverb tail
 */

export type SoldSfxVariant = 'classic' | 'epic' | 'minimal' | 'stadium';

type SfxConfig = {
  /** Overall volume 0–1 */
  volume: number;
  /** Low thump weight under the crack */
  thumpGain: number;
  /** High glass debris intensity */
  glassGain: number;
  /** How long the reverb tail rings (seconds) */
  reverbSeconds: number;
  /** Number of staggered glass grain bursts */
  glassBursts: number;
};

const VARIANT_SFX: Record<SoldSfxVariant, SfxConfig> = {
  classic: { volume: 0.72, thumpGain: 0.55, glassGain: 0.4, reverbSeconds: 0.9, glassBursts: 4 },
  epic: { volume: 0.88, thumpGain: 0.75, glassGain: 0.55, reverbSeconds: 1.4, glassBursts: 7 },
  minimal: { volume: 0.45, thumpGain: 0.35, glassGain: 0.22, reverbSeconds: 0.45, glassBursts: 2 },
  stadium: { volume: 0.95, thumpGain: 0.85, glassGain: 0.6, reverbSeconds: 1.6, glassBursts: 8 },
};

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    return new Ctx();
  } catch {
    return null;
  }
}

/** White-noise buffer shared per context call. */
function createNoiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * durationSec));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function playNoiseBurst(
  ctx: AudioContext,
  destination: AudioNode,
  options: {
    start: number;
    duration: number;
    gain: number;
    highpass?: number;
    lowpass?: number;
    bandpass?: { freq: number; q: number };
    exponential?: boolean;
  },
) {
  const source = ctx.createBufferSource();
  source.buffer = createNoiseBuffer(ctx, options.duration + 0.05);

  let node: AudioNode = source;
  if (options.highpass) {
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = options.highpass;
    node.connect(hp);
    node = hp;
  }
  if (options.lowpass) {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = options.lowpass;
    node.connect(lp);
    node = lp;
  }
  if (options.bandpass) {
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = options.bandpass.freq;
    bp.Q.value = options.bandpass.q;
    node.connect(bp);
    node = bp;
  }

  const gain = ctx.createGain();
  const t0 = options.start;
  gain.gain.setValueAtTime(options.gain, t0);
  if (options.exponential !== false) {
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + options.duration);
  } else {
    gain.gain.linearRampToValueAtTime(0.001, t0 + options.duration);
  }

  node.connect(gain);
  gain.connect(destination);
  source.start(t0);
  source.stop(t0 + options.duration + 0.02);
}

/**
 * Loud hammer crack + glass shatter + reverb.
 * Safe to call without user gesture in many browsers after prior interaction;
 * failures are swallowed (autoplay policy).
 */
export function playSoldImpactSounds(variant: SoldSfxVariant = 'classic') {
  const cfg = VARIANT_SFX[variant] ?? VARIANT_SFX.classic;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const master = ctx.createGain();
    master.gain.value = cfg.volume;
    master.connect(ctx.destination);

    // Soft reverb via delay feedback (no Offline convolution needed).
    const delay = ctx.createDelay(1.5);
    delay.delayTime.value = 0.08;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.28;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(master);

    const dry = ctx.createGain();
    dry.gain.value = 1;
    dry.connect(master);
    dry.connect(delay);

    const t = ctx.currentTime;

    // --- 1. Sub thump (hammer mass) ---
    {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(95, t);
      osc.frequency.exponentialRampToValueAtTime(38, t + 0.18);
      gain.gain.setValueAtTime(cfg.thumpGain, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(gain);
      gain.connect(dry);
      osc.start(t);
      osc.stop(t + 0.3);
    }

    // --- 2. Sharp impact crack (noise transient) ---
    playNoiseBurst(ctx, dry, {
      start: t,
      duration: 0.09,
      gain: 0.9 * cfg.volume,
      highpass: 800,
      lowpass: 9000,
    });

    // Mid body click
    {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.12);
      gain.gain.setValueAtTime(0.35 * cfg.volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(gain);
      gain.connect(dry);
      osc.start(t);
      osc.stop(t + 0.15);
    }

    // --- 3. Glass shatter grains (staggered high-freq bursts) ---
    for (let i = 0; i < cfg.glassBursts; i += 1) {
      const offset = 0.035 + i * (0.028 + Math.random() * 0.02);
      const freq = 2800 + Math.random() * 4200;
      playNoiseBurst(ctx, dry, {
        start: t + offset,
        duration: 0.06 + Math.random() * 0.08,
        gain: cfg.glassGain * (0.55 + Math.random() * 0.45) * (1 - i * 0.08),
        bandpass: { freq, q: 1.2 + Math.random() * 2 },
        highpass: 1800,
      });
    }

    // --- 4. Secondary reverb-heavy glass wash ---
    playNoiseBurst(ctx, delay, {
      start: t + 0.1,
      duration: cfg.reverbSeconds * 0.55,
      gain: cfg.glassGain * 0.35,
      highpass: 2400,
      lowpass: 10000,
    });

    // High shimmer ring
    {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400, t + 0.05);
      osc.frequency.exponentialRampToValueAtTime(1600, t + 0.4);
      gain.gain.setValueAtTime(0.08 * cfg.volume, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.connect(gain);
      gain.connect(dry);
      gain.connect(delay);
      osc.start(t + 0.05);
      osc.stop(t + 0.6);
    }

    // Close context after the longest tail so devices free resources.
    const closeAfterMs = Math.ceil((cfg.reverbSeconds + 0.6) * 1000) + 200;
    window.setTimeout(() => {
      void ctx.close().catch(() => undefined);
    }, closeAfterMs);
  } catch {
    try {
      void ctx.close();
    } catch {
      // ignore
    }
  }
}

/**
 * Optional pre-impact whoosh as the gavel swings in.
 * Call at celebration start (delay ≈ IMPACT − 0.35s).
 */
export function playGavelWhoosh(variant: SoldSfxVariant = 'classic') {
  if (variant === 'minimal') return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const volume = variant === 'epic' || variant === 'stadium' ? 0.22 : 0.14;

    playNoiseBurst(ctx, ctx.destination, {
      start: t,
      duration: 0.32,
      gain: volume,
      bandpass: { freq: 600, q: 0.7 },
      lowpass: 2200,
    });

    // Rising air tone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(380, t + 0.28);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(volume * 0.35, t + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    osc.connect(lp);
    lp.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.35);

    window.setTimeout(() => {
      void ctx.close().catch(() => undefined);
    }, 500);
  } catch {
    try {
      void ctx.close();
    } catch {
      // ignore
    }
  }
}
