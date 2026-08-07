'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassEffect } from './liquid-glass';

interface DockItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  highlight?: boolean;
}

/** Public primary destinations — admin/captain stay in the navbar menu. */
const publicItems: DockItem[] = [
  { title: 'Home', icon: Home, href: '/' },
  { title: 'Register', icon: UserPlus, href: '/player-registration' },
  { title: 'Players', icon: Users, href: '/players' },
  { title: 'Auction', icon: Radio, href: '/auction', highlight: true },
  { title: 'Teams', icon: Shield, href: '/teams' },
];

const HIDDEN_PREFIXES = ['/admin-dashboard', '/admin-login', '/captain-dashboard', '/captain-login'];

export function FloatingDock({ items = publicItems }: { items?: DockItem[] }) {
  const mouseX = useMotionValue(Infinity);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [theaterMode, setTheaterMode] = useState(false);

  useEffect(() => {
    const sync = () => setTheaterMode(document.body.classList.contains('theater-mode'));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const hideForRoute =
    HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    (pathname === '/auction' && searchParams?.get('captain') === '1') ||
    theaterMode;

  if (hideForRoute) return null;

  return (
    <div
      data-floating-dock
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:bottom-4 sm:px-4"
    >
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto w-full max-w-md sm:w-auto sm:max-w-none"
      >
        <GlassEffect className="rounded-2xl border border-white/20 bg-slate-950/85 px-2 py-2 shadow-2xl shadow-black/60 backdrop-blur-2xl sm:rounded-full sm:px-3">
          {/* Mobile: labeled tab bar */}
          <nav className="flex items-stretch justify-between gap-0.5 sm:hidden" aria-label="Primary">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-bold transition-colors',
                    isActive
                      ? 'bg-amber-500/20 text-amber-200'
                      : item.highlight
                        ? 'text-emerald-300'
                        : 'text-slate-400 hover:text-white',
                  )}
                >
                  <span className="relative">
                    <Icon className="h-5 w-5" />
                    {item.highlight && !isActive && (
                      <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    )}
                  </span>
                  <span className="truncate">{item.title}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop: magnifying dock */}
          <div className="hidden items-center gap-2 sm:flex">
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
  mouseX: ReturnType<typeof useMotionValue<number>>;
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
    <Link href={item.href} aria-label={item.title} aria-current={isActive ? 'page' : undefined}>
      <motion.div
        ref={ref}
        style={{ width, height: width }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          'relative flex items-center justify-center rounded-full transition-colors',
          isActive
            ? 'border border-amber-400/40 bg-amber-500/30 text-amber-300 shadow-lg shadow-amber-500/20'
            : item.highlight
              ? 'border border-emerald-500/40 bg-emerald-500/20 text-emerald-400'
              : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white',
        )}
      >
        {isActive && (
          <span className="absolute -top-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
        )}

        {item.highlight && !isActive && (
          <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
        )}

        <Icon className="h-5 w-5" />

        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.85 }}
              animate={{ opacity: 1, y: -42, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.85 }}
              className="pointer-events-none absolute z-50 whitespace-nowrap rounded-full border border-white/20 bg-slate-900 px-3 py-1 text-xs font-bold text-white shadow-xl"
            >
              {item.title}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  );
}
