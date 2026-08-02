'use client';

import React, { useEffect, useId, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SparklesCoreProps {
  id?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  particleDensity?: number;
  className?: string;
  particleColor?: string;
  speed?: number;
}

export function SparklesCore({
  id,
  background = 'transparent',
  minSize = 0.6,
  maxSize = 2.4,
  particleDensity = 80,
  className,
  particleColor = '#F59E0B',
  speed = 0.8,
}: SparklesCoreProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const generatedId = useId();
  const canvasId = id || generatedId;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight);

    const particles: {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      fadeSpeed: number;
    }[] = [];

    const count = Math.floor((width * height) / (100000 / particleDensity));

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * (maxSize - minSize) + minSize,
        speedX: (Math.random() - 0.5) * speed * 0.5,
        speedY: (Math.random() - 0.5) * speed * 0.5,
        opacity: Math.random(),
        fadeSpeed: 0.005 + Math.random() * 0.01,
      });
    }

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    };

    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        p.opacity += p.fadeSpeed;
        if (p.opacity > 1 || p.opacity < 0.2) {
          p.fadeSpeed = -p.fadeSpeed;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.globalAlpha = Math.max(0.1, Math.min(1, p.opacity));
        ctx.shadowBlur = 8;
        ctx.shadowColor = particleColor;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [maxSize, minSize, particleColor, particleDensity, speed]);

  return (
    <canvas
      id={canvasId}
      ref={canvasRef}
      style={{ background }}
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
    />
  );
}
