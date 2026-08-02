'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface BorderBeamProps {
  lightWidth?: number;
  duration?: number;
  lightColor?: string;
  borderWidth?: number;
  className?: string;
  children?: React.ReactNode;
}

export function BorderBeam({
  lightWidth = 240,
  duration = 8,
  lightColor = '#F59E0B', // APL Gold
  borderWidth = 1.5,
  className = '',
  children,
}: BorderBeamProps) {
  return (
    <div className={`relative overflow-hidden rounded-[inherit] ${className}`}>
      {/* Animated Light Beam Border */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] z-10"
        style={{ padding: `${borderWidth}px` }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-[inherit]">
          <motion.div
            className="absolute inset-0 aspect-square rounded-full opacity-80"
            style={{
              width: `${lightWidth}px`,
              background: `radial-gradient(circle, ${lightColor} 0%, rgba(245, 158, 11, 0.3) 40%, transparent 70%)`,
              filter: 'blur(4px)',
            }}
            animate={{
              top: ['0%', '0%', '100%', '100%', '0%'],
              left: ['0%', '100%', '100%', '0%', '0%'],
              transform: ['translate(-50%, -50%)', 'translate(-50%, -50%)', 'translate(-50%, -50%)', 'translate(-50%, -50%)', 'translate(-50%, -50%)'],
            }}
            transition={{
              duration: duration,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>
      </div>

      {/* Children content */}
      <div className="relative z-0 h-full w-full">{children}</div>
    </div>
  );
}
