'use client';

import { useEffect, useRef, useState } from 'react';

const TOTAL_FRAMES = 240;

const getFramePath = (index: number) => {
  const paddedNum = String(index + 1).padStart(5, '0');
  return `/frames/frame_${paddedNum}.jpg`;
};

export function HomepageScrollBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const targetFrameRef = useRef<number>(0);
  const currentFrameRef = useRef<number>(0);
  const lastDrawnFloatFrameRef = useRef<number>(-1);
  const animFrameIdRef = useRef<number | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper to get loaded image or nearest available loaded frame
  const getLoadedImage = (frameIndex: number): HTMLImageElement | null => {
    const idx = Math.max(0, Math.min(TOTAL_FRAMES - 1, frameIndex));
    const img = imagesRef.current[idx];
    if (img && img.complete && img.naturalWidth > 0) {
      return img;
    }

    // Fallback to nearest loaded frame
    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      const prev = idx - offset;
      const next = idx + offset;
      if (prev >= 0) {
        const prevImg = imagesRef.current[prev];
        if (prevImg && prevImg.complete && prevImg.naturalWidth > 0) return prevImg;
      }
      if (next < TOTAL_FRAMES) {
        const nextImg = imagesRef.current[next];
        if (nextImg && nextImg.complete && nextImg.naturalWidth > 0) return nextImg;
      }
    }
    return null;
  };

  // Draw sub-frame with sub-pixel cross-fading for cinematic smoothness
  const drawSubFrame = (floatFrame: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const clampedFrame = Math.max(0, Math.min(TOTAL_FRAMES - 1, floatFrame));
    const baseIndex = Math.floor(clampedFrame);
    const nextIndex = Math.min(TOTAL_FRAMES - 1, Math.ceil(clampedFrame));
    const blend = clampedFrame - baseIndex;

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

  // Preload frames in priority stream
  useEffect(() => {
    isMountedRef.current = true;

    // Load first frame immediately
    const firstImg = new Image();
    firstImg.src = getFramePath(0);
    firstImg.onload = () => {
      if (!isMountedRef.current) return;
      imagesRef.current[0] = firstImg;
      setIsLoading(false);
      drawSubFrame(0);
    };

    // Load initial buffer (frames 1..10) with priority
    const loadInitialBuffer = async () => {
      const initialPromises = [];
      for (let i = 1; i < Math.min(12, TOTAL_FRAMES); i++) {
        initialPromises.push(
          new Promise<void>((resolve) => {
            const img = new Image();
            img.src = getFramePath(i);
            img.onload = () => {
              if (isMountedRef.current) imagesRef.current[i] = img;
              resolve();
            };
            img.onerror = () => resolve();
          })
        );
      }
      await Promise.all(initialPromises);

      // Stream remaining frames in batches to avoid choking network/main thread
      const batchSize = 10;
      for (let i = 12; i < TOTAL_FRAMES; i += batchSize) {
        if (!isMountedRef.current) break;

        const batchPromises = [];
        for (let j = i; j < Math.min(i + batchSize, TOTAL_FRAMES); j++) {
          batchPromises.push(
            new Promise<void>((resolve) => {
              const img = new Image();
              img.src = getFramePath(j);
              img.onload = () => {
                if (isMountedRef.current) imagesRef.current[j] = img;
                resolve();
              };
              img.onerror = () => resolve();
            })
          );
        }
        await Promise.all(batchPromises);
      }
    };

    loadInitialBuffer();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Scroll listener & dynamic endpoint mapping before Franchise Purse & Budget Calculator
  useEffect(() => {
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
      const progress = Math.max(0, Math.min(1, currentScrollY / endScrollY));
      targetFrameRef.current = progress * (TOTAL_FRAMES - 1);

      // Direct DOM Opacity Control without React State Re-renders
      if (containerRef.current) {
        if (currentScrollY > endScrollY) {
          const fadeDistance = 150; // Smooth 150px fade out range into #purse-calculator
          const fadeProgress = Math.min(1, (currentScrollY - endScrollY) / fadeDistance);
          const opacity = 1 - fadeProgress;
          containerRef.current.style.opacity = opacity.toFixed(3);
          containerRef.current.style.visibility = opacity <= 0.001 ? 'hidden' : 'visible';
        } else {
          containerRef.current.style.opacity = '1';
          containerRef.current.style.visibility = 'visible';
        }
      }
    };

    const handleResize = () => {
      updateScrollAndOpacity();
      drawSubFrame(currentFrameRef.current);
    };

    window.addEventListener('scroll', updateScrollAndOpacity, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // Initial calculation
    updateScrollAndOpacity();

    // 60FPS Lerp loop for silky continuous sub-frame motion
    const tick = () => {
      const target = targetFrameRef.current;
      const current = currentFrameRef.current;

      const diff = target - current;
      if (Math.abs(diff) > 0.0005) {
        currentFrameRef.current += diff * 0.12;
      } else {
        currentFrameRef.current = target;
      }

      if (Math.abs(currentFrameRef.current - lastDrawnFloatFrameRef.current) > 0.0005) {
        drawSubFrame(currentFrameRef.current);
      }

      animFrameIdRef.current = requestAnimationFrame(tick);
    };

    animFrameIdRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('scroll', updateScrollAndOpacity);
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
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

      {/* Subtle Vignette & Dark Overlay for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/30 to-slate-950/75 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(3,7,18,0.65)_100%)] pointer-events-none" />
    </div>
  );
}

