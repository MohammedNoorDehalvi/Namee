'use client';

import { useState } from 'react';
import Spline from '@splinetool/react-spline';
import { Loader2, Bot } from 'lucide-react';
import { GlassCard } from '@/components/ui/liquid-glass';

const ROBOT_SCENE_URL = 'https://prod.spline.design/DVoMCwNpHnG53fkv/scene.splinecode';

export function SplineRobotScene() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative w-full h-full min-h-[380px] sm:min-h-[480px] md:min-h-[540px] rounded-3xl overflow-hidden bg-transparent">
      {/* Loading Overlay with Text for Robot */}
      {!isLoaded && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-slate-950/40 backdrop-blur-md rounded-3xl transition-opacity duration-500">
          <GlassCard className="p-8 md:p-10 rounded-3xl flex flex-col items-center justify-center space-y-4 max-w-md shadow-2xl">
            <div className="relative flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border-4 border-amber-400/20 border-t-amber-400 border-r-cyan-400 animate-spin" style={{ animationDuration: '1.5s' }} />
              <div className="absolute w-12 h-12 rounded-full bg-amber-400/20 blur-lg animate-pulse" />
              <Bot className="absolute w-8 h-8 text-amber-300 animate-bounce" />
            </div>

            <div className="space-y-1.5">
              <span className="block text-sm sm:text-base font-extrabold text-white tracking-widest font-display uppercase">
                LOADING 3D ROBOT ARENA
              </span>
              <span className="block text-xs text-amber-300 font-mono">
                Initializing interactive 3D controls...
              </span>
            </div>
          </GlassCard>
        </div>
      )}

      {/* 3D Spline Robot */}
      <Spline
        scene={ROBOT_SCENE_URL}
        onLoad={() => setIsLoaded(true)}
        className="w-full h-full border-0 rounded-3xl"
      />
    </div>
  );
}
