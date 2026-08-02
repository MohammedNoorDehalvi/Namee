'use client';

import { useEffect, useRef, useState } from 'react';

const TOTAL_FRAMES = 240;

const getFramePath = (index: number) => {
  const paddedNum = String(index + 1).padStart(5, '0');
  return `/frames/frame_${paddedNum}.jpg`;
};

export function HomepageScrollBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const targetFrameRef = useRef<number>(0);
  const currentFrameRef = useRef<number>(0);
  const lastDrawnFrameRef = useRef<number>(-1);
  const animFrameIdRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadedCount, setLoadedCount] = useState<number>(0);

  // Preload frames in priority batches
  useEffect(() => {
    let isMounted = true;

    // Load first frame immediately to render initial view fast
    const firstImg = new Image();
    firstImg.src = getFramePath(0);
    firstImg.onload = () => {
      if (!isMounted) return;
      imagesRef.current[0] = firstImg;
      setLoadedCount((prev) => prev + 1);
      setIsLoading(false);
      drawFrame(0);
    };

    // Load rest of the frames in parallel batches
    const loadBatch = async () => {
      const batchSize = 10;
      for (let i = 1; i < TOTAL_FRAMES; i += batchSize) {
        if (!isMounted) break;

        const promises = [];
        for (let j = i; j < Math.min(i + batchSize, TOTAL_FRAMES); j++) {
          promises.push(
            new Promise<void>((resolve) => {
              const img = new Image();
              img.src = getFramePath(j);
              img.onload = () => {
                if (isMounted) {
                  imagesRef.current[j] = img;
                  setLoadedCount((prev) => prev + 1);
                }
                resolve();
              };
              img.onerror = () => resolve();
            })
          );
        }
        await Promise.all(promises);
      }
    };

    loadBatch();

    return () => {
      isMounted = false;
    };
  }, []);

  // Helper to draw a given frame index onto canvas with cover object-fit
  const drawFrame = (frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Find requested frame or fallback to nearest loaded frame
    let imgToDraw = imagesRef.current[frameIndex];
    if (!imgToDraw || !imgToDraw.complete) {
      // Search closest available loaded image
      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        const prev = frameIndex - offset;
        const next = frameIndex + offset;
        if (prev >= 0 && imagesRef.current[prev]?.complete) {
          imgToDraw = imagesRef.current[prev];
          break;
        }
        if (next < TOTAL_FRAMES && imagesRef.current[next]?.complete) {
          imgToDraw = imagesRef.current[next];
          break;
        }
      }
    }

    if (!imgToDraw || !imgToDraw.naturalWidth) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scale canvas context for resolution / devicePixelRatio
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Calculate aspect ratio cover fitting
    const imgRatio = imgToDraw.naturalWidth / imgToDraw.naturalHeight;
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

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(imgToDraw, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();

    lastDrawnFrameRef.current = frameIndex;
  };

  // Scroll listener & continuous smooth lerp loop
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;

      const progress = Math.max(0, Math.min(1, window.scrollY / scrollHeight));
      targetFrameRef.current = progress * (TOTAL_FRAMES - 1);
    };

    const handleResize = () => {
      handleScroll();
      drawFrame(Math.round(currentFrameRef.current));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // Initial scroll setup
    handleScroll();

    // 60FPS Lerp loop for silky cinematic frame transition
    const tick = () => {
      const target = targetFrameRef.current;
      const current = currentFrameRef.current;

      // Linear interpolation (lerp factor 0.14 for ultra-smooth responsiveness)
      const diff = target - current;
      if (Math.abs(diff) > 0.001) {
        currentFrameRef.current += diff * 0.14;
      } else {
        currentFrameRef.current = target;
      }

      const frameToDraw = Math.round(currentFrameRef.current);
      if (frameToDraw !== lastDrawnFrameRef.current) {
        drawFrame(frameToDraw);
      }

      animFrameIdRef.current = requestAnimationFrame(tick);
    };

    animFrameIdRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-[-10] overflow-hidden select-none">
      {/* Background Frame Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover transition-opacity duration-700"
        style={{ opacity: isLoading ? 0 : 1 }}
      />

      {/* Ambient Vignette & Gradient Overlay for Contrast & Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/35 to-slate-950/80 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(3,7,18,0.65)_100%)] pointer-events-none" />
    </div>
  );
}
