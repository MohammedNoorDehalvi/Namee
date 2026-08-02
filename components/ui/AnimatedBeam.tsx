'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedBeamProps {
  className?: string;
  gradientStartColor?: string;
  gradientStopColor?: string;
  duration?: number;
}

export function AnimatedBeam({
  className = '',
  gradientStartColor = '#06B6D4',
  gradientStopColor = '#F59E0B',
  duration = 3,
}: AnimatedBeamProps) {
  return (
    <div className={`relative w-full h-1 bg-slate-800/80 rounded-full overflow-hidden ${className}`}>
      {/* Animated Travelling Pulse */}
      <motion.div
        className="h-full rounded-full"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${gradientStartColor} 50%, ${gradientStopColor} 80%, transparent 100%)`,
          boxShadow: `0 0 12px ${gradientStartColor}, 0 0 20px ${gradientStopColor}`,
        }}
        initial={{ x: '-100%', width: '40%' }}
        animate={{ x: '250%' }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}
