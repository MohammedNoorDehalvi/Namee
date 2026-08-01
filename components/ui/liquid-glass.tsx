'use client';

import React from 'react';

// Types
export interface GlassEffectProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  href?: string;
  target?: string;
  variant?: string;
  onClick?: () => void;
}

export interface DockIcon {
  src: string;
  alt: string;
  onClick?: () => void;
}

// Glass Effect Wrapper Component - Rimless Liquid Glass
export const GlassEffect: React.FC<GlassEffectProps> = ({
  children,
  className = '',
  style = {},
  href,
  target = '_blank',
  variant,
  onClick,
}) => {
  const glassStyle: React.CSSProperties = {
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
    transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 2.2)',
    ...style,
  };

  const getVariantBg = () => {
    switch (variant) {
      case 'amber':
        return 'rgba(245, 158, 11, 0.16)';
      case 'emerald':
        return 'rgba(16, 185, 129, 0.16)';
      case 'light':
        return 'rgba(255, 255, 255, 0.25)';
      case 'dark':
      default:
        return 'rgba(255, 255, 255, 0.12)';
    }
  };

  const content = (
    <div
      onClick={onClick}
      className={`relative flex font-semibold overflow-hidden text-white cursor-pointer transition-all duration-700 ${className}`}
      style={glassStyle}
    >
      {/* Liquid Glass Layers */}
      <div
        className="absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
        style={{
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          filter: 'url(#glass-distortion)',
          isolation: 'isolate',
        }}
      />
      <div
        className="absolute inset-0 z-10 rounded-[inherit]"
        style={{ background: getVariantBg() }}
      />
      <div
        className="absolute inset-0 z-20 rounded-[inherit] overflow-hidden pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 1px 1px rgba(255, 255, 255, 0.12)',
        }}
      />

      {/* Content */}
      <div className="relative z-30 w-full h-full">{children}</div>
    </div>
  );

  return href ? (
    <a href={href} target={target} rel="noopener noreferrer" className="block w-full">
      {content}
    </a>
  ) : (
    content
  );
};

// Dock Component
export const GlassDock: React.FC<{ icons: DockIcon[]; href?: string; className?: string }> = ({
  icons,
  href,
  className = '',
}) => (
  <GlassEffect
    href={href}
    className={`rounded-3xl p-3 hover:p-4 transition-all duration-700 ${className}`}
  >
    <div className="flex items-center justify-center gap-2 rounded-3xl p-3 py-0 px-0.5 overflow-hidden">
      {icons.map((icon, index) => (
        <img
          key={index}
          src={icon.src}
          alt={icon.alt}
          className="w-16 h-16 transition-all duration-700 hover:scale-110 cursor-pointer object-cover rounded-2xl"
          style={{
            transformOrigin: 'center center',
            transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 2.2)',
          }}
          onClick={icon.onClick}
        />
      ))}
    </div>
  </GlassEffect>
);

// Button Component
export const GlassButton: React.FC<{
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  variant?: string;
}> = ({ children, href, onClick, className = '', variant }) => (
  <GlassEffect
    href={href}
    onClick={onClick}
    variant={variant}
    className={`rounded-full px-8 py-4 hover:px-9 hover:py-4.5 overflow-hidden ${className}`}
  >
    <div
      className="transition-all duration-700 hover:scale-95 flex items-center justify-center gap-2 text-white font-bold"
      style={{
        transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 2.2)',
      }}
    >
      {children}
    </div>
  </GlassEffect>
);

// Card Component
export const GlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variant?: string;
}> = ({ children, className = '', style, variant }) => (
  <GlassEffect
    style={style}
    variant={variant}
    className={`rounded-3xl p-6 transition-all duration-700 ${className}`}
  >
    {children}
  </GlassEffect>
);

// SVG Filter Component
export const GlassFilter: React.FC = () => (
  <svg style={{ display: 'none' }}>
    <filter
      id="glass-distortion"
      x="0%"
      y="0%"
      width="100%"
      height="100%"
      filterUnits="objectBoundingBox"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.001 0.005"
        numOctaves="1"
        seed="17"
        result="turbulence"
      />
      <feComponentTransfer in="turbulence" result="mapped">
        <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
        <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
        <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
      </feComponentTransfer>
      <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
      <feSpecularLighting
        in="softMap"
        surfaceScale="5"
        specularConstant="1"
        specularExponent="100"
        lightingColor="white"
        result="specLight"
      >
        <fePointLight x="-200" y="-200" z="300" />
      </feSpecularLighting>
      <feComposite
        in="specLight"
        operator="arithmetic"
        k1="0"
        k2="1"
        k3="1"
        k4="0"
        result="litImage"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="softMap"
        scale="200"
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  </svg>
);
