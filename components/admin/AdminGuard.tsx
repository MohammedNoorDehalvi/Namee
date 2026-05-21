"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { useSession } from '@/hooks/useSession';

export function AdminGuard({ children }: { children: ReactNode }) {
  const { session } = useSession();

  if (!session) {
    return <GuardCard title="Admin login required" href="/admin-login" label="Admin Login" />;
  }

  if (session.role !== 'admin') {
    return <GuardCard title="Admin access only" href="/" label="Go Home" />;
  }

  return <>{children}</>;
}

function GuardCard({ title, href, label }: { title: string; href: string; label: string }) {
  return (
    <section className="glass-card mx-auto max-w-xl rounded-[2rem] p-7 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-yellow-300/25 bg-yellow-300/10 text-yellow-300">
        <ShieldAlert size={28} />
      </div>
      <h1 className="mt-5 text-3xl font-black text-white">{title}</h1>
      <p className="mt-3 text-white/60">Please login with the correct account to continue.</p>
      <Link href={href} className="btn-primary mt-6 w-full">
        {label}
      </Link>
    </section>
  );
}
