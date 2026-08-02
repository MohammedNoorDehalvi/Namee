'use client';

import { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-[999999] w-screen h-screen bg-slate-950 select-none overflow-hidden flex items-center justify-center pointer-events-none"
        >
          {/* Full Screen Spline 3D Interactive Spinner Element */}
          <Suspense fallback={null}>
            <Spline
              scene={SPLINE_SCENE_URL}
              onLoad={handleSplineLoad}
              className="w-full h-full border-0 pointer-events-auto"
            />
          </Suspense>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
