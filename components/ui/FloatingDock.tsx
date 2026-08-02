'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  Home,
  UserPlus,
  Users,
  Radio,
  Shield,
  Lock,
  Settings,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassEffect } from './liquid-glass';

interface DockItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  highlight?: boolean;
}

const defaultItems: DockItem[] = [
  { title: 'Home', icon: Home, href: '/' },
  { title: 'Register', icon: UserPlus, href: '/player-registration' },
  { title: 'Players', icon: Users, href: '/players' },
  { title: 'Live Auction', icon: Radio, href: '/auction', highlight: true },
  { title: 'Teams', icon: Shield, href: '/teams' },
  { title: 'Captain Portal', icon: Lock, href: '/captain-dashboard' },
  { title: 'Admin', icon: Settings, href: '/admin-dashboard' },
];

export function FloatingDock({ items = defaultItems }: { items?: DockItem[] }) {
  const mouseX = useMotionValue(Infinity);
  const pathname = usePathname();

  return (
    <div className="fixed bottom-6 inset-x-0 z-40 pointer-events-none flex justify-center px-4">
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto"
      >
        <GlassEffect className="px-3 py-2 rounded-full border border-white/20 shadow-2xl shadow-black/60 bg-slate-950/80 backdrop-blur-2xl">
          <div className="flex items-center gap-2">
            {items.map((item) => (
              <DockIcon
                key={item.href}
                mouseX={mouseX}
                item={item}
                isActive={pathname === item.href}
              />
            ))}
          </div>
        </GlassEffect>
      </motion.div>
    </div>
  );
}

function DockIcon({
  mouseX,
  item,
  isActive,
}: {
  mouseX: any;
  item: DockItem;
  isActive: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [40, 56, 40]);
  const width = useSpring(widthSync, { stiffness: 350, damping: 25 });

  const Icon = item.icon;

  return (
    <Link href={item.href}>
      <motion.div
        ref={ref}
        style={{ width, height: width }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          'relative flex items-center justify-center rounded-full transition-colors',
          isActive
            ? 'bg-amber-500/30 text-amber-300 border border-amber-400/40 shadow-lg shadow-amber-500/20'
            : item.highlight
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
        )}
      >
        {/* Active pill dot */}
        {isActive && (
          <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        )}

        {/* Live highlight badge */}
        {item.highlight && !isActive && (
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        )}

        <Icon className="w-5 h-5 transition-transform" />

        {/* Floating Tooltip */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.85 }}
              animate={{ opacity: 1, y: -42, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.85 }}
              className="absolute text-xs font-bold text-white px-3 py-1 rounded-full bg-slate-900 border border-white/20 shadow-xl whitespace-nowrap z-50 pointer-events-none"
            >
              {item.title}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  );
}
