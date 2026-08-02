'use client';

import React, { useRef, useState } from 'react';
import { motion, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  tiltMaxAngle?: number;
  glareOpacity?: number;
}

export function TiltCard({
  children,
  className = '',
  tiltMaxAngle = 14,
  glareOpacity = 0.15,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

  // Spring animations for smooth tilt physics
  const rotateXSpring = useSpring(0, { stiffness: 300, damping: 25 });
  const rotateYSpring = useSpring(0, { stiffness: 300, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = (mouseX / width) * 100;
    const yPct = (mouseY / height) * 100;

    setMousePosition({ x: xPct, y: yPct });

    // Calculate rotation angles (-tiltMaxAngle to +tiltMaxAngle)
    const rotateX = ((mouseY - height / 2) / (height / 2)) * -tiltMaxAngle;
    const rotateY = ((mouseX - width / 2) / (width / 2)) * tiltMaxAngle;

    rotateXSpring.set(rotateX);
    rotateYSpring.set(rotateY);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    rotateXSpring.set(0);
    rotateYSpring.set(0);
  };

  return (
    <div
      style={{ perspective: 1000 }}
      className="w-full h-full"
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: rotateXSpring,
          rotateY: rotateYSpring,
          transformStyle: 'preserve-3d',
        }}
        className={cn(
          'relative w-full h-full transition-shadow duration-300 rounded-3xl overflow-hidden',
          isHovered ? 'shadow-2xl shadow-cyan-500/10' : '',
          className
        )}
      >
        {children}

        {/* Dynamic Specular Glare / Spotlight Sheen */}
        {isHovered && (
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-30"
            style={{
              background: `radial-gradient(600px circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,255,255,${glareOpacity}), transparent 40%)`,
            }}
          />
        )}
      </motion.div>
    </div>
  );
}
