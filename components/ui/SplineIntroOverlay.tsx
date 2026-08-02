'use client';

import { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { GlassEffect, GlassCard } from '@/components/ui/liquid-glass';

// Lazy load Spline component as recommended in the Spline 3D skill
const Spline = lazy(() => import('@splinetool/react-spline'));

const SPLINE_SCENE_URL = 'https://prod.spline.design/ngx17wSPDASGlRWo/scene.splinecode';
const DISPLAY_DURATION_MS = 5000;

export function SplineIntroOverlay() {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [splineLoaded, setSplineLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Smooth 60fps 5-second progress timer using requestAnimationFrame
  useEffect(() => {
    if (!mounted) return;
    let animationFrameId: number;
    const startTime = performance.now();

    const updateProgress = (now: number) => {
      const elapsed = now - startTime;
      const pct = Math.min(100, (elapsed / DISPLAY_DURATION_MS) * 100);
      setProgress(pct);

      if (elapsed < DISPLAY_DURATION_MS) {
        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        dismissIntro();
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [mounted]);

  const dismissIntro = () => {
    setIsVisible(false);
    document.body.style.overflow = '';
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-[999999] flex flex-col items-center justify-center select-none overflow-hidden"
          style={{
            background: `url("/image.png") center center / cover no-repeat fixed`,
          }}
        >
          {/* Liquid Glass Backdrop Blur */}
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-2xl pointer-events-none" />

          {/* 3D Spline Interactive Element */}
          <div className="relative z-10 flex flex-col items-center justify-center p-4 md:p-6 text-center space-y-6 w-full max-w-4xl">
            <GlassCard className="w-full p-4 sm:p-6 md:p-8 rounded-4xl flex flex-col items-center justify-center space-y-6 shadow-2xl border border-white/20">
              {/* Spline Container */}
              <div className="relative w-full h-[320px] sm:h-[400px] md:h-[480px] rounded-3xl overflow-hidden flex items-center justify-center">
                {!splineLoaded && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-md rounded-3xl space-y-3">
                    <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
                    <span className="text-xs font-mono font-bold tracking-widest text-amber-300 uppercase">
                      LOADING 3D SPLINE SCENE...
                    </span>
                  </div>
                )}

                <Suspense
                  fallback={
                    <div className="flex flex-col items-center justify-center space-y-3 text-amber-400">
                      <Loader2 className="w-10 h-10 animate-spin" />
                    </div>
                  }
                >
                  <Spline
                    scene={SPLINE_SCENE_URL}
                    onLoad={() => setSplineLoaded(true)}
                    className="w-full h-full rounded-3xl border-0"
                  />
                </Suspense>
              </div>

              {/* Branding Text */}
              <div className="space-y-2 border-t border-white/10 pt-4 w-full">
                <span className="block text-sm sm:text-base font-extrabold text-white uppercase tracking-widest font-display">
                  ASHOKA PREMIER LEAGUE
                </span>
                <span className="block text-xs text-amber-300 font-medium font-mono tracking-wider uppercase">
                  DIGITAL CRICKET AUCTION ARENA · SEASON 8
                </span>
              </div>
            </GlassCard>
          </div>

          {/* Header Branding Badge */}
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-auto z-20">
            <GlassEffect className="px-5 py-2 rounded-full">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
                <span className="text-xs font-bold text-white tracking-wider uppercase font-display">
                  APL AUCTION ARENA
                </span>
              </div>
            </GlassEffect>

            <button
              onClick={dismissIntro}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md text-slate-300 hover:text-white transition-all shadow-xl cursor-pointer"
              aria-label="Close intro"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Progress Timer Bar */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-80 max-w-[85vw] flex flex-col items-center space-y-2 pointer-events-none z-20">
            <GlassEffect className="w-full p-2.5 rounded-full flex flex-col items-center space-y-2">
              <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 rounded-full transition-all duration-75"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[11px] font-bold tracking-widest text-slate-200 uppercase font-mono">
                DISPLAYING 3D ELEMENT (5S)
              </span>
            </GlassEffect>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
