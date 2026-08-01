'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { GlassEffect, GlassCard } from '@/components/ui/liquid-glass';

const DISPLAY_DURATION_MS = 5000;

export function SplineIntroOverlay() {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

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

          {/* User's Exact Animated Letter Loader Component */}
          <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center space-y-6">
            <GlassCard className="p-10 md:p-14 rounded-3xl flex flex-col items-center justify-center space-y-8 max-w-lg shadow-2xl">
              <div className="loader-wrapper">
                <span className="loader-letter">G</span>
                <span className="loader-letter">e</span>
                <span className="loader-letter">n</span>
                <span className="loader-letter">e</span>
                <span className="loader-letter">r</span>
                <span className="loader-letter">a</span>
                <span className="loader-letter">t</span>
                <span className="loader-letter">i</span>
                <span className="loader-letter">n</span>
                <span className="loader-letter">g</span>
                <div className="loader"></div>
              </div>

              <div className="space-y-2 border-t border-white/10 pt-4 w-full">
                <span className="block text-sm font-extrabold text-white uppercase tracking-widest font-display">
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
