'use client';

import React, { useEffect, useRef } from 'react';

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  particleCount?: number;
  zIndex?: number;
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'rect' | 'circle' | 'star';
}

const CONFETTI_COLORS = ['#F59E0B', '#FBBF24', '#06B6D4', '#22D3EE', '#10B981', '#EC4899', '#8B5CF6'];

export function Confetti({
  isActive,
  duration = 4000,
  particleCount = 120,
  zIndex = 100,
  onComplete,
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: Particle[] = [];

    // Create celebratory particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: width / 2 + (Math.random() - 0.5) * 200,
        y: height * 0.4 + (Math.random() - 0.5) * 100,
        size: Math.random() * 10 + 6,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.8) * 22,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        opacity: 1,
        shape: Math.random() > 0.6 ? 'star' : Math.random() > 0.3 ? 'rect' : 'circle',
      });
    }

    const startTime = Date.now();

    const draw = () => {
      const elapsed = Date.now() - startTime;
      ctx.clearRect(0, 0, width, height);

      let aliveCount = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.42; // Gravity acceleration
        p.vx *= 0.98; // Air resistance
        p.rotation += p.rotationSpeed;

        if (elapsed > duration - 1000) {
          p.opacity = Math.max(0, 1 - (elapsed - (duration - 1000)) / 1000);
        }

        if (p.opacity > 0 && p.y < height + 50) {
          aliveCount++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;

          if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.shape === 'star') {
            ctx.beginPath();
            for (let j = 0; j < 5; j++) {
              ctx.lineTo(
                Math.cos(((18 + j * 72) * Math.PI) / 180) * p.size,
                -Math.sin(((18 + j * 72) * Math.PI) / 180) * p.size
              );
              ctx.lineTo(
                Math.cos(((54 + j * 72) * Math.PI) / 180) * (p.size / 2),
                -Math.sin(((54 + j * 72) * Math.PI) / 180) * (p.size / 2)
              );
            }
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          }

          ctx.restore();
        }
      }

      if (elapsed < duration && aliveCount > 0) {
        animIdRef.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, width, height);
        if (onComplete) onComplete();
      }
    };

    animIdRef.current = requestAnimationFrame(draw);

    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
  }, [isActive, duration, particleCount, onComplete]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none w-full h-full"
      style={{ zIndex }}
    />
  );
}
