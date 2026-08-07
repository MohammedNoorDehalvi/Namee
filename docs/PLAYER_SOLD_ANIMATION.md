# Player Sold Celebration Animation

High-impact **gavel smash → screen shatter** celebration for live auction “player sold” moments. Implemented as a full-viewport React overlay (Framer Motion + procedural Web Audio)—no large video/sprite assets.

---

## Summary

| Property | Value |
|----------|--------|
| **Total duration** | **5.0 seconds** |
| **Integration format** | React component + hook (Next.js / client components) |
| **Motion** | Framer Motion (GPU transforms / opacity) |
| **Audio** | Procedural Web Audio API (0 KB media files) |
| **Reduced motion** | Honors `prefers-reduced-motion` |
| **Variants** | `classic` · `epic` · `minimal` · `stadium` |

---

## File map

| Path | Role |
|------|------|
| `components/auction/PlayerSoldCelebrationOverlay.tsx` | Visual sequence (gavel, flash, cracks, shards, sparks, card) |
| `hooks/usePlayerSoldCelebration.ts` | Detects new `SOLD` events, queues, auto-dismiss at 5s |
| `lib/sold-celebration-config.ts` | Timing constants + variant intensity presets |
| `lib/sold-celebration-audio.ts` | Impact crack, glass shatter, whoosh, reverb |

---

## Detailed timeline (5.0s)

All times are relative to overlay mount (`t = 0`).

| Time | Phase | Visual | Audio |
|------|--------|--------|--------|
| **0.00s** | Mount | Overlay fades in; dark glass backdrop + blur | — |
| **0.00–0.55s** | Wind-up | Auction **gavel** arcs in from top-right toward center | — |
| **0.23s** | Pre-impact | — | Soft **whoosh** (air rush) |
| **0.55s** | **IMPACT** | White **flash**, **chromatic split** (red/cyan), full-screen **shake**, **scale squash**, SVG **ripple distortion** | Loud **crack** + low **thump** |
| **0.55–0.85s** | Shatter | **Cracks** spider from center; **shards** burst radially; **sparks** fly; **shockwave rings** expand | **Glass shatter** grains + reverb tail |
| **0.57s** | Stamp | Giant **SOLD!** spring-slams into place | Shimmer ring (high sine) |
| **0.55s+** | Confetti | Particle confetti (variant-dependent) | — |
| **0.73s** | Card | Player/team **glass card** springs up | — |
| **~1.2–4.65s** | Hold | Card idle float; residual crack glow | — |
| **4.65–5.00s** | Exit | Overlay opacity exit; hook clears celebration | — |

Constants (source of truth): `lib/sold-celebration-config.ts` → `IMPACT_AT = 0.55`, `SOLD_CELEBRATION_DURATION_MS = 5000`.

---

## Visual elements

### 1. Hammer / gavel hit
- SVG gavel (crisp at any size), drop-shadow + amber glow
- Path: off-screen top-right → center impact → short recoil fade
- Screen **shake** keyed to impact (amplitude scales with variant intensity)

### 2. Screen shatter
- Deterministic jagged **crack paths** (seeded by celebration `id` so the same sale always cracks the same way)
- Branch lines for realistic glass spidering
- **Shards** with varied polygonal clip-paths, radial velocity + spin + gravity bias

### 3. Sparks / particles
- Small glowing dots (amber/gold or ice palette) burst from impact
- Short lifetime, high contrast bloom via box-shadow

### 4. Flash + shockwave
- Full-screen white flash (~60ms peak)
- Concentric amber **shockwave rings** + softer white **ripple rings**
- Optional **chromatic aberration** (red/cyan radial gradients, opposite X offset)

### 5. Screen distortion
- SVG `feTurbulence` + animated `feDisplacementMap` scale pulse at impact (~0.7s)
- Applied to the shaken content layer for a glass-warped feel

### 6. SOLD stamp + info card
- Gradient “SOLD!” with stroke and amber glow
- Liquid-glass card: player name, team, logo / initials, “AUCTION MOMENT” footer
- Border beam highlight

---

## Sound design

Synthesized in `playSoldImpactSounds` / `playGavelWhoosh` (no MP3/OGG downloads):

| Layer | Technique | Purpose |
|-------|-----------|---------|
| Whoosh | Band-passed noise + rising saw | Gavel swing air |
| Thump | Sine 95→38 Hz | Hammer mass |
| Crack | Short noise burst (HP/LP) + triangle click | Sharp impact |
| Glass grains | Staggered band-pass noise bursts | Shatter debris |
| Reverb | Delay + feedback wet bus | Room / secondary shatter |
| Shimmer | High sine decay | Glass ring |

**Autoplay:** Browsers may block audio until a user gesture. Bid ticks / UI clicks earlier in the session usually unlock `AudioContext`. Failures are swallowed so the visual still plays.

---

## Variations (customization)

Pass `variant` to the overlay:

```tsx
<PlayerSoldCelebrationOverlay celebration={celebration} variant="epic" />
```

| Variant | Best for | Highlights |
|---------|----------|------------|
| **`classic`** (default) | Normal sold events | Balanced shards/sparks, 2 rings, confetti ~140 |
| **`epic`** | Record / high-value sales | More shards, sparks, 3 rings, heavier SFX/shake |
| **`minimal`** | Low-power, a11y preference, quiet rooms | Fewer particles, no confetti, light SFX, no ripple/chromatic |
| **`stadium`** | Projector / stream overlay | Larger gavel, high contrast palette, loud SFX |

Presets live in `SOLD_VARIANTS` (`lib/sold-celebration-config.ts`). Tune particle counts, intensity, confetti, palette without rewriting the overlay.

### Example: epic only for big prices

```tsx
const variant =
  soldPrice != null && soldPrice >= 50_000 ? 'epic' : 'classic';

<PlayerSoldCelebrationOverlay celebration={celebration} variant={variant} />
```

### Example: force minimal when reduced motion (extra safety)

```tsx
const reduce = useReducedMotion();
<PlayerSoldCelebrationOverlay
  celebration={celebration}
  variant={reduce ? 'minimal' : 'classic'}
/>
```

(The overlay already softens motion when `prefers-reduced-motion` is set.)

---

## Implementation guide

### Already wired

- `components/auction/LiveAuction.tsx` — public live auction
- `components/captain/CaptainDashboardClient.tsx` — captain view

Pattern:

```tsx
'use client';

import { usePlayerSoldCelebration } from '@/hooks/usePlayerSoldCelebration';
import { PlayerSoldCelebrationOverlay } from '@/components/auction/PlayerSoldCelebrationOverlay';

// events / players / teams from your realtime feed
const { celebration } = usePlayerSoldCelebration({
  events,
  players,
  teams,
  loading,
  fallbackTeam: highestTeam, // optional
  // durationMs: 5000, // optional override
});

return (
  <>
    <PlayerSoldCelebrationOverlay celebration={celebration} variant="classic" />
    {/* rest of UI */}
  </>
);
```

### Manual / test trigger

```tsx
const [demo, setDemo] = useState<SaleCelebration | null>(null);

// button onClick:
setDemo({
  id: `demo-${Date.now()}`,
  playerName: 'Alex Rivera',
  teamName: 'Thunder FC',
  teamLogo: null,
});
// clear after 5s if not using the hook
setTimeout(() => setDemo(null), 5000);

<PlayerSoldCelebrationOverlay celebration={demo} variant="stadium" />
```

### Game / non-React engines

This ship form is **DOM + CSS + Web Audio**. For Unity / Godot / native:

1. Mirror the **timeline table** above as an animation state machine.
2. Replace procedural layers with:
   - Gavel clip (spine/sprite) 0→0.55s
   - Particle systems: glass shards + sparks at impact
   - Camera shake + flash sprite
   - Two-shot audio: impact + glass loop/oneshot
3. Keep total length **5.0s** and impact at **~11%** of the clip (0.55/5).

---

## Performance notes

| Concern | Approach |
|---------|----------|
| Bundle size | No video/audio assets; SVG + DOM particles only |
| Main thread | Transform/opacity animations; confetti uses one canvas |
| Mobile | Lower shard/spark counts under 640px width |
| Memory | AudioContexts closed after tails; confetti stops after duration |
| Determinism | Seeded RNG from celebration `id` → stable cracks/shards, no layout thrash on re-render |
| Accessibility | `aria-hidden`, `pointer-events-none`, reduced-motion path |

**Tips if profiling is tight:** switch to `variant="minimal"`, lower `confettiCount` in config, or disable `screenRipple` / `chromaticFlash` for that preset.

---

## Modification cheat-sheet

| Goal | Where |
|------|--------|
| Longer/shorter total time | `SOLD_CELEBRATION_DURATION_MS` + hook `durationMs` |
| Earlier/later impact | `IMPACT_AT` (keep audio whoosh offset in sync) |
| Louder smash | `VARIANT_SFX` volumes in `sold-celebration-audio.ts` |
| More glass | `shardCount*` / `crackCount*` in `SOLD_VARIANTS` |
| Different colors | `palette` + `createShards` / `createSparks` palettes |
| New preset | Add key to `SoldAnimationVariant` + both config maps (visual + SFX) |

---

## Acceptance checklist

- [x] Hammer-like gavel strike into screen center  
- [x] Immediate shatter (cracks + shards)  
- [x] **5 second** total celebration window  
- [x] Loud crack / smash + secondary glass / reverb  
- [x] Sparks, flash, shockwave, screen ripple / chromatic distortion  
- [x] Multiple variants (`classic` / `epic` / `minimal` / `stadium`)  
- [x] Game-ready React integration + this document  
- [x] Performance-conscious (procedural audio, responsive particle counts, reduced motion)
