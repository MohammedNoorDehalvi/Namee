'use client';

import { useEffect, useRef, useState } from 'react';

const TOTAL_FRAMES = 60;

const getFramePath = (index: number) => {
  const paddedNum = String(index + 1).padStart(3, '0');
  return `/frames/frame_${paddedNum}.webp`;
};

export function HomepageScrollBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const targetFrameRef = useRef<number>(0);
  const currentFrameRef = useRef<number>(0);
  const lastDrawnFrameRef = useRef<number>(-1);
  const animFrameIdRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  // Preload frames in priority batches
  useEffect(() => {
    let isMounted = true;

    // Load first frame immediately to render initial view fast
    const firstImg = new Image();
    firstImg.src = getFramePath(0);
    firstImg.onload = () => {
      if (!isMounted) return;
      imagesRef.current[0] = firstImg;
      setIsLoading(false);
      drawFrame(0);
    };

    // Load remaining frames in batches
    const loadRemainingFrames = async () => {
      const batchSize = 10;
      for (let i = 1; i < TOTAL_FRAMES; i += batchSize) {
        if (!isMounted) break;

        const batchPromises = [];
        for (let j = i; j < Math.min(i + batchSize, TOTAL_FRAMES); j++) {
          batchPromises.push(
            new Promise<void>((resolve) => {
              const img = new Image();
              img.src = getFramePath(j);
              img.onload = () => {
                if (isMounted) {
                  imagesRef.current[j] = img;
                }
                resolve();
              };
              img.onerror = () => resolve();
            })
          );
        }
        await Promise.all(batchPromises);
      }
    };

    loadRemainingFrames();

    return () => {
      isMounted = false;
    };
  }, []);

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

    // Initial scroll calculation
    handleScroll();

    // 60FPS Lerp loop for silky cinematic frame transition
    const tick = () => {
      const target = targetFrameRef.current;
      const current = currentFrameRef.current;

      // Linear interpolation (lerp factor 0.16 for ultra-smooth responsiveness)
      const diff = target - current;
      if (Math.abs(diff) > 0.001) {
        currentFrameRef.current += diff * 0.16;
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
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden select-none">
      {/* Background Frame Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover transition-opacity duration-500"
        style={{ opacity: isLoading ? 0 : 1 }}
      />

      {/* Subtle Vignette & Dark Overlay for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/30 to-slate-950/75 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(3,7,18,0.65)_100%)] pointer-events-none" />
    </div>
  );
}
