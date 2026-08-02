'use client';

import React from 'react';

interface Marquee3DProps {
  items: string[];
  direction?: 'left' | 'right';
  speed?: number;
  className?: string;
}

export function Marquee3D({ items, direction = 'left', speed = 25, className = '' }: Marquee3DProps) {
  const content = items.join('  ·  ') + '  ·  ';

  return (
    <div
      className={`relative overflow-hidden select-none py-4 bg-slate-950/60 border-y border-white/10 backdrop-blur-xl ${className}`}
      style={{
        transform: 'perspective(1000px) rotateX(6deg)',
      }}
    >
      <div className="flex whitespace-nowrap text-xs md:text-sm font-bold tracking-widest uppercase">
        <div
          className={`flex shrink-0 gap-8 ${
            direction === 'left' ? 'animate-marquee' : 'animate-marquee-reverse'
          }`}
          style={{ animationDuration: `${speed}s` }}
        >
          <span className="text-gradient-gold">{content}</span>
          <span className="text-gradient-cyan">{content}</span>
        </div>
        <div
          aria-hidden="true"
          className={`flex shrink-0 gap-8 ${
            direction === 'left' ? 'animate-marquee' : 'animate-marquee-reverse'
          }`}
          style={{ animationDuration: `${speed}s` }}
        >
          <span className="text-gradient-gold">{content}</span>
          <span className="text-gradient-cyan">{content}</span>
        </div>
      </div>
    </div>
  );
}
