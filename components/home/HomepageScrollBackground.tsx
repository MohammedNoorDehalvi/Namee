'use client';

import { useEffect, useRef, useState } from 'react';

const TOTAL_FRAMES = 240;

/** Backbone frames kept loaded at all times so fast scrubbing always has something nearby. */
const KEYFRAME_STEP = 20;
/** Frames kept decoded behind / ahead of the current scroll position. */
const WINDOW_BEHIND = 8;
const WINDOW_AHEAD = 18;
/** Non-keyframe cache entries farther than this from the window center are released. */
const EVICT_RADIUS = 28;
/** Re-center the load window after the playhead moves this many frames. */
const RECENTER_THRESHOLD = 4;
/** Cap parallel image requests so we never flood the connection pool. */
const MAX_CONCURRENT_LOADS = 6;
/** Frame stride used on low-memory / small touch devices (cross-fade hides the gaps). */
const LITE_STRIDE = 12;

type QualityMode = 'full' | 'lite' | 'static';

const framePath = (index: number) => `/frames/frame_${String(index + 1).padStart(5, '0')}.webp`;

export function HomepageScrollBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const vignetteRef = useRef<HTMLDivElement | null>(null);

  // Sliding-window frame cache — only a small band of decoded frames is alive at once.
  const cacheRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const inFlightRef = useRef<Set<number>>(new Set());
  const queueRef = useRef<number[]>([]);
  const activeLoadsRef = useRef<number>(0);
  const lastWindowCenterRef = useRef<number>(0);

  const modeRef = useRef<QualityMode>('full');
  const strideRef = useRef<number>(1);

  const targetFrameRef = useRef<number>(0);
  const currentFrameRef = useRef<number>(0);
  const lastDrawnFloatFrameRef = useRef<number>(-1);
  const animFrameIdRef = useRef<number | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const isPausedRef = useRef<boolean>(false);

  // Velocity tracking for sub-pixel motion blur
  const lastScrollYRef = useRef<number>(0);
  const scrollVelocityRef = useRef<number>(0);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper to get loaded image or nearest available loaded frame
  const getLoadedImage = (frameIndex: number): HTMLImageElement | null => {
    const cache = cacheRef.current;
    const idx = Math.max(0, Math.min(TOTAL_FRAMES - 1, frameIndex));

    const exact = cache.get(idx);
    if (exact && exact.complete && exact.naturalWidth > 0) {
      return exact;
    }

    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      const prev = cache.get(idx - offset);
      if (prev && prev.complete && prev.naturalWidth > 0) return prev;
      const next = cache.get(idx + offset);
      if (next && next.complete && next.naturalWidth > 0) return next;
    }
    return null;
  };

  const pumpQueue = () => {
    const cache = cacheRef.current;
    const inFlight = inFlightRef.current;

    while (activeLoadsRef.current < MAX_CONCURRENT_LOADS && queueRef.current.length > 0) {
      const index = queueRef.current.shift()!;
      if (cache.has(index) || inFlight.has(index)) continue;

      inFlight.add(index);
      activeLoadsRef.current += 1;

      const img = new Image();
      img.decoding = 'async';

      const finish = () => {
        inFlight.delete(index);
        activeLoadsRef.current = Math.max(0, activeLoadsRef.current - 1);
        if (!isMountedRef.current) return;

        if (img.complete && img.naturalWidth > 0) {
          cache.set(index, img);

          if (index === 0) {
            setIsLoading(false);
          }
          // If a frame near the playhead just arrived, let the tick loop redraw with it.
          if (Math.abs(index - currentFrameRef.current) <= strideRef.current) {
            lastDrawnFloatFrameRef.current = -1;
          }
        }
        pumpQueue();
      };

      img.onload = finish;
      img.onerror = finish;
      img.src = framePath(index);
    }
  };

  // Rebuild the load queue around a frame index and evict frames far outside the window.
  const requestWindow = (center: number) => {
    const cache = cacheRef.current;
    const inFlight = inFlightRef.current;
    const mode = modeRef.current;
    const wanted: number[] = [];

    const push = (index: number) => {
      if (index < 0 || index >= TOTAL_FRAMES) return;
      if (cache.has(index) || inFlight.has(index) || wanted.includes(index)) return;
      wanted.push(index);
    };

    if (mode === 'static') {
      push(0);
    } else if (mode === 'lite') {
      // Low-memory devices: a sparse fixed set, loaded once, never evicted.
      for (let i = 0; i < TOTAL_FRAMES; i += LITE_STRIDE) push(i);
      push(TOTAL_FRAMES - 1);
    } else {
      const direction = targetFrameRef.current >= currentFrameRef.current ? 1 : -1;
      const ahead = direction === 1 ? WINDOW_AHEAD : WINDOW_BEHIND;
      const behind = direction === 1 ? WINDOW_BEHIND : WINDOW_AHEAD;

      push(center);
      for (let offset = 1; offset <= Math.max(ahead, behind); offset++) {
        if (offset <= ahead) push(center + direction * offset);
        if (offset <= behind) push(center - direction * offset);
      }

      // Keyframe backbone so fast jumps land near something loaded.
      for (let i = 0; i < TOTAL_FRAMES; i += KEYFRAME_STEP) push(i);
      push(TOTAL_FRAMES - 1);

      for (const key of Array.from(cache.keys())) {
        const isKeyframe = key % KEYFRAME_STEP === 0 || key === TOTAL_FRAMES - 1;
        if (!isKeyframe && Math.abs(key - center) > EVICT_RADIUS) {
          cache.delete(key);
        }
      }
    }

    queueRef.current = wanted;
    pumpQueue();
  };

  // Draw sub-frame with sub-pixel cross-fading, camera depth zoom & velocity motion blur
  const drawSubFrame = (floatFrame: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const stride = strideRef.current;
    const clampedFrame = Math.max(0, Math.min(TOTAL_FRAMES - 1, floatFrame));
    const baseIndex = Math.floor(clampedFrame / stride) * stride;
    const nextIndex = Math.min(TOTAL_FRAMES - 1, baseIndex + stride);
    const blend = nextIndex > baseIndex ? (clampedFrame - baseIndex) / (nextIndex - baseIndex) : 0;

    const baseImg = getLoadedImage(baseIndex);
    if (!baseImg) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    if (width <= 0 || height <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetWidth = Math.round(width * dpr);
    const targetHeight = Math.round(height * dpr);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Dynamic Camera Depth / Scale Parallax (1.0 to 1.04 zoom depth)
    const animProgress = clampedFrame / (TOTAL_FRAMES - 1);
    const cameraZoom = 1.0 + animProgress * 0.04;

    ctx.translate(width / 2, height / 2);
    ctx.scale(cameraZoom, cameraZoom);
    ctx.translate(-width / 2, -height / 2);

    // Velocity-Based Motion Blur
    const velocity = scrollVelocityRef.current;
    if (velocity > 12) {
      const blurAmount = Math.min(2.5, (velocity - 12) * 0.06);
      ctx.filter = `blur(${blurAmount.toFixed(2)}px)`;
    } else {
      ctx.filter = 'none';
    }

    // Calculate aspect ratio cover fitting for base image
    const imgWidth = baseImg.naturalWidth || 1920;
    const imgHeight = baseImg.naturalHeight || 1080;
    const imgRatio = imgWidth / imgHeight;
    const canvasRatio = width / height;

    let drawWidth = width;
    let drawHeight = height;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasRatio > imgRatio) {
      drawHeight = width / imgRatio;
      offsetY = (height - drawHeight) / 2;
    } else {
      drawWidth = height * imgRatio;
      offsetX = (width - drawWidth) / 2;
    }

    // Base frame render
    ctx.globalAlpha = 1;
    ctx.drawImage(baseImg, offsetX, offsetY, drawWidth, drawHeight);

    // Sub-frame cross-fade interpolation with next adjacent frame
    if (nextIndex !== baseIndex && blend > 0.005) {
      const nextImg = getLoadedImage(nextIndex);
      if (nextImg && nextImg !== baseImg) {
        ctx.globalAlpha = blend;
        ctx.drawImage(nextImg, offsetX, offsetY, drawWidth, drawHeight);
      }
    }

    ctx.restore();
    lastDrawnFloatFrameRef.current = floatFrame;
  };

  // Pick a quality mode for this device and start streaming the initial window.
  useEffect(() => {
    isMountedRef.current = true;

    const nav = navigator as Navigator & { deviceMemory?: number };
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const smallTouchDevice = window.matchMedia('(pointer: coarse) and (max-width: 767px)').matches;

    if (reducedMotion || (nav.deviceMemory !== undefined && nav.deviceMemory <= 2)) {
      modeRef.current = 'static';
    } else if ((nav.deviceMemory !== undefined && nav.deviceMemory <= 4) || smallTouchDevice) {
      modeRef.current = 'lite';
      strideRef.current = LITE_STRIDE;
    }

    requestWindow(0);

    return () => {
      isMountedRef.current = false;
      queueRef.current = [];
      cacheRef.current.clear();
      inFlightRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll listener, velocity calculation, endpoint mapping & Battery Saver Visibility
  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    const updateScrollAndOpacity = () => {
      const purseSection = document.getElementById('purse-calculator');

      // Calculate end scroll position (when #purse-calculator top enters the viewport)
      let endScrollY = 0;
      if (purseSection) {
        const rect = purseSection.getBoundingClientRect();
        endScrollY = rect.top + window.scrollY - window.innerHeight;
      } else {
        endScrollY = document.documentElement.scrollHeight - window.innerHeight;
      }

      if (endScrollY <= 0) endScrollY = 1;

      const currentScrollY = window.scrollY;

      // Track scroll velocity for motion blur
      const v = Math.abs(currentScrollY - lastScrollYRef.current);
      scrollVelocityRef.current = v;
      lastScrollYRef.current = currentScrollY;

      const progress = Math.max(0, Math.min(1, currentScrollY / endScrollY));
      targetFrameRef.current = modeRef.current === 'static' ? 0 : progress * (TOTAL_FRAMES - 1);

      // Adaptive Vignette Readability Mapping (modulates dark overlay contrast)
      if (vignetteRef.current) {
        const dynamicVignetteOpacity = 0.50 + progress * 0.20;
        vignetteRef.current.style.opacity = dynamicVignetteOpacity.toFixed(2);
      }

      // Direct DOM Opacity & Battery Saver Pause Control
      if (containerRef.current) {
        if (currentScrollY > endScrollY) {
          const fadeDistance = 150;
          const fadeProgress = Math.min(1, (currentScrollY - endScrollY) / fadeDistance);
          const opacity = 1 - fadeProgress;
          containerRef.current.style.opacity = opacity.toFixed(3);
          const isHidden = opacity <= 0.001;
          containerRef.current.style.visibility = isHidden ? 'hidden' : 'visible';
          isPausedRef.current = isHidden;
        } else {
          containerRef.current.style.opacity = '1';
          containerRef.current.style.visibility = 'visible';
          isPausedRef.current = document.hidden;
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPausedRef.current = true;
      } else {
        isPausedRef.current = false;
        drawSubFrame(currentFrameRef.current);
      }
    };

    const handleResize = () => {
      updateScrollAndOpacity();
      drawSubFrame(currentFrameRef.current);
    };

    window.addEventListener('scroll', updateScrollAndOpacity, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial calculation
    updateScrollAndOpacity();

    // 60FPS Lerp loop for silky continuous motion with battery saver pause
    const tick = () => {
      if (!isPausedRef.current) {
        const target = targetFrameRef.current;
        const current = currentFrameRef.current;

        const diff = target - current;
        if (Math.abs(diff) > 0.0005) {
          currentFrameRef.current += diff * 0.12;
        } else {
          currentFrameRef.current = target;
        }

        // Keep the streaming window centered on the playhead
        if (modeRef.current === 'full') {
          const center = Math.round(currentFrameRef.current);
          if (Math.abs(center - lastWindowCenterRef.current) >= RECENTER_THRESHOLD) {
            lastWindowCenterRef.current = center;
            requestWindow(center);
          }
        }

        // Decay scroll velocity smoothly
        scrollVelocityRef.current *= 0.85;

        if (Math.abs(currentFrameRef.current - lastDrawnFloatFrameRef.current) > 0.0005 || scrollVelocityRef.current > 0.5) {
          drawSubFrame(currentFrameRef.current);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(tick);
    };

    animFrameIdRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('scroll', updateScrollAndOpacity);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden select-none transition-opacity duration-150"
      style={{
        opacity: isLoading ? 0 : 1,
        visibility: isLoading ? 'hidden' : 'visible',
      }}
    >
      {/* Background Frame Canvas */}
      <canvas ref={canvasRef} className="w-full h-full object-cover" />

      {/* Adaptive Vignette & Dark Overlay for Text Readability */}
      <div
        ref={vignetteRef}
        className="absolute inset-0 bg-gradient-to-b from-slate-950/65 via-slate-950/35 to-slate-950/80 pointer-events-none transition-opacity duration-300"
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(3,7,18,0.65)_100%)] pointer-events-none" />
    </div>
  );
}
