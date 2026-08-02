'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SILENT_TIMER_DURATION_MS = 5000;

export function SplineIntroOverlay() {
  const [mounted, setMounted] = useState(false);
  const [spinnerAnimating, setSpinnerAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Start silent 5-second background timer ONLY when the loading spinner is fully appeared & actively animating
  useEffect(() => {
    if (!spinnerAnimating) return;

    const timerId = setTimeout(() => {
      setIsVisible(false);
      document.body.style.overflow = '';
    }, SILENT_TIMER_DURATION_MS);

    return () => {
      clearTimeout(timerId);
    };
  }, [spinnerAnimating]);

  if (!mounted) return null;

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950 select-none overflow-hidden"
          style={{ width: '100vw', height: '100vh' }}
        >
          {/* Centered Loading Spinner - Only Visible Element */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onAnimationComplete={() => setSpinnerAnimating(true)}
            className="relative flex items-center justify-center"
          >
            {/* Smooth Outer Rotating Ring */}
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-amber-400/20 border-t-amber-400 border-r-amber-300 animate-spin shadow-[0_0_40px_rgba(245,158,11,0.25)]"
              style={{ animationDuration: '0.85s' }}
            />
            {/* Ambient Pulsing Glow Core */}
            <div className="absolute w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-400/20 blur-md animate-pulse" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
