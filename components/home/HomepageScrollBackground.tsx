'use client';

import { useEffect, useRef, useState } from 'react';

const TOTAL_FRAMES = 240;

const getWebPFramePath = (index: number) => {
  const paddedNum = String(index + 1).padStart(5, '0');
  return `/frames/frame_${paddedNum}.webp`;
};

const getJpgFramePath = (index: number) => {
  const paddedNum = String(index + 1).padStart(5, '0');
  return `/frames/frame_${paddedNum}.jpg`;
};

export function HomepageScrollBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const vignetteRef = useRef<HTMLDivElement | null>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));

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

  // Helper to load frame with WebP primary and JPG fallback
  const loadFrameImage = (index: number): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = getWebPFramePath(index);
      img.onload = () => resolve(img);
      img.onerror = () => {
        // Fallback to JPG if WebP fails
        const fallbackImg = new Image();
        fallbackImg.src = getJpgFramePath(index);
        fallbackImg.onload = () => resolve(fallbackImg);
        fallbackImg.onerror = () => resolve(img);
      };
    });
  };

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

  // Draw sub-frame with sub-pixel cross-fading, camera depth zoom & velocity motion blur
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

  // Preload frames in priority stream (WebP with JPG fallback)
  useEffect(() => {
    isMountedRef.current = true;

    // Load first frame immediately for fast initial render
    loadFrameImage(0).then((img) => {
      if (!isMountedRef.current) return;
      imagesRef.current[0] = img;
      setIsLoading(false);
      drawSubFrame(0);
    });

    // Load initial priority buffer (frames 1..12)
    const loadInitialBuffer = async () => {
      const initialPromises = [];
      for (let i = 1; i < Math.min(12, TOTAL_FRAMES); i++) {
        initialPromises.push(
          loadFrameImage(i).then((img) => {
            if (isMountedRef.current) imagesRef.current[i] = img;
          })
        );
      }
      await Promise.all(initialPromises);

      // Stream remaining frames in fast chunks
      const batchSize = 12;
      for (let i = 12; i < TOTAL_FRAMES; i += batchSize) {
        if (!isMountedRef.current) break;

        const batchPromises = [];
        for (let j = i; j < Math.min(i + batchSize, TOTAL_FRAMES); j++) {
          batchPromises.push(
            loadFrameImage(j).then((img) => {
              if (isMountedRef.current) imagesRef.current[j] = img;
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
      targetFrameRef.current = progress * (TOTAL_FRAMES - 1);

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


