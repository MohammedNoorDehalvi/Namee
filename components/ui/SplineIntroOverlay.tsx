'use client';

import { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/liquid-glass';

// Lazy load Spline component as specified by the Spline 3D Skill
const Spline = lazy(() => import('@splinetool/react-spline'));

const SPLINE_SCENE_URL = 'https://prod.spline.design/ngx17wSPDASGlRWo/scene.splinecode';
const SILENT_TIMER_DURATION_MS = 5000;

export function SplineIntroOverlay() {
  const [mounted, setMounted] = useState(false);
  const [splineLoaded, setSplineLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Silently start the 5-second background timer ONLY when Spline 3D scene has fully loaded & appeared
  useEffect(() => {
    if (!splineLoaded) return;

    const timerId = setTimeout(() => {
      setIsVisible(false);
      document.body.style.overflow = '';
    }, SILENT_TIMER_DURATION_MS);

    return () => {
      clearTimeout(timerId);
    };
  }, [splineLoaded]);

  const handleSplineLoad = () => {
    setSplineLoaded(true);
  };

  if (!mounted) return null;

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-[999999] w-screen h-screen select-none overflow-hidden flex items-center justify-center pointer-events-none"
          style={{
            background: `url("/image.png") center center / cover no-repeat fixed`,
          }}
        >
          {/* Liquid Glass Backdrop Blur */}
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-2xl pointer-events-none" />

          {/* Website Initial Loading Screen - Shown until Spline Spinner Scene Loads */}
          <AnimatePresence>
            {!splineLoaded && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeOut' } }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center pointer-events-auto"
              >
                <GlassCard className="p-10 md:p-12 rounded-3xl flex flex-col items-center justify-center space-y-6 max-w-md shadow-2xl border border-white/15">
                  {/* Glowing Animated Website Spinner */}
                  <div className="relative flex items-center justify-center">
                    <div
                      className="w-16 h-16 rounded-full border-4 border-amber-400/20 border-t-amber-400 border-r-amber-300 animate-spin shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                      style={{ animationDuration: '0.9s' }}
                    />
                    <div className="absolute w-8 h-8 rounded-full bg-amber-400/20 blur-md animate-pulse" />
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <span className="block text-sm font-extrabold text-white uppercase tracking-widest font-display">
                      LOADING APL AUCTION ARENA
                    </span>
                    <span className="block text-xs text-amber-300 font-medium font-mono tracking-wider uppercase">
                      Initializing 3D Experience...
                    </span>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Full Screen 3D Spline Interactive Spinner Element */}
          <div
            className={`relative z-10 w-full h-full transition-opacity duration-700 ${
              splineLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Suspense fallback={null}>
              <Spline
                scene={SPLINE_SCENE_URL}
                onLoad={handleSplineLoad}
                className="w-full h-full border-0 pointer-events-auto"
              />
            </Suspense>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
