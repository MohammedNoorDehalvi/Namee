'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children?: React.ReactNode;
  href?: string;
}

export function ShimmerButton({
  shimmerColor = '#F59E0B',
  shimmerSize = '0.1em',
  shimmerDuration = '3s',
  borderRadius = '9999px',
  background = 'rgba(15, 23, 42, 0.9)',
  className,
  children,
  href,
  onClick,
  ...props
}: ShimmerButtonProps) {
  const content = (
    <button
      style={
        {
          '--shimmer-color': shimmerColor,
          '--radius': borderRadius,
          '--speed': shimmerDuration,
          '--cut': shimmerSize,
          '--bg': background,
        } as React.CSSProperties
      }
      onClick={onClick}
      className={cn(
        'group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap px-6 py-3.5 text-white [background:var(--bg)] [border-radius:var(--radius)] transition-transform duration-300 active:scale-95 hover:scale-[1.02] shadow-xl',
        className
      )}
      {...props}
    >
      {/* spark container */}
      <div className="absolute inset-0 overflow-hidden [border-radius:var(--radius)]">
        {/* spark */}
        <div className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#0000_0%,var(--shimmer-color)_50%,#0000_100%)] opacity-80" />
      </div>

      {/* backdrop */}
      <div className="absolute inset-[1px] rounded-[inherit] bg-slate-950 transition-colors group-hover:bg-slate-900" />

      {/* content */}
      <div className="relative z-10 flex items-center gap-2 font-extrabold text-sm font-display">
        {children}
      </div>
    </button>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
