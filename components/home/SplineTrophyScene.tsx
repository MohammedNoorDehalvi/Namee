'use client';

import { Suspense, lazy, useState, useEffect } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

interface SplineTrophySceneProps {
  sceneUrl?: string;
  className?: string;
  onLoad?: (splineApp: any) => void;
}

export function SplineTrophyScene({
  sceneUrl = 'https://prod.spline.design/QT7yb2iDeg8pCquS/scene.splinecode',
  className = 'w-full h-full',
  onLoad,
}: SplineTrophySceneProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showTimeoutFallback, setShowTimeoutFallback] = useState(false);

  useEffect(() => {
    // 8-second safety timeout for slow mobile / CDN networks
    const timeout = setTimeout(() => {
      if (!isLoaded) {
        setShowTimeoutFallback(true);
      }
    }, 8000);

    return () => clearTimeout(timeout);
  }, [isLoaded]);

  function handleSplineLoad(splineApp: any) {
    setIsLoaded(true);
    if (onLoad) {
      onLoad(splineApp);
    }
  }

  if (hasError) {
    return (
      <div className="w-full h-full min-h-[340px] flex flex-col items-center justify-center rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl p-6 text-center space-y-4">
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 blur-2xl opacity-50 animate-pulse" />
        <div className="space-y-1 z-10">
          <p className="text-xl font-extrabold text-white font-display">APL CHAMPIONSHIP TROPHY</p>
          <p className="text-xs text-amber-400/90 font-medium">Interactive 3D Arena Showcase</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full min-h-[340px] rounded-3xl overflow-hidden ${className}`}>
      {/* Loading Skeleton Indicator */}
      {!isLoaded && !showTimeoutFallback && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 border border-white/10 backdrop-blur-xl rounded-3xl p-6 transition-opacity duration-500">
          <div className="relative flex items-center justify-center mb-4">
            <div className="w-16 h-16 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
            <div className="absolute w-8 h-8 rounded-full bg-amber-500/20 blur-md" />
          </div>
          <span className="text-xs font-bold text-slate-200 tracking-widest uppercase">Loading 3D Experience</span>
          <span className="text-[11px] text-slate-400 mt-1">Preparing WebGL canvas...</span>
        </div>
      )}

      {/* Spline Canvas */}
      {!showTimeoutFallback ? (
        <Suspense fallback={null}>
          <Spline
            scene={sceneUrl}
            onLoad={handleSplineLoad}
            onError={() => setHasError(true)}
            style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}
            className={`w-full h-full transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        </Suspense>
      ) : (
        /* Timeout Fallback Card if network CDN is blocked or ultra slow */
        <div className="w-full h-full min-h-[340px] flex flex-col items-center justify-center rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl p-6 text-center space-y-4">
          <div className="relative w-32 h-32 rounded-full bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 blur-3xl opacity-40 animate-pulse" />
          <div className="space-y-1 z-10">
            <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
              APL SEASON 8
            </span>
            <h3 className="text-2xl font-extrabold text-white font-display pt-2">CRICKET CHAMPIONSHIP TROPHY</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Real-time digital cricket auction house — competing for total glory.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
