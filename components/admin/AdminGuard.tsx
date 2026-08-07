'use client';

import Link from 'next/link';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { GlassCard } from '@/components/ui/liquid-glass';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { session, ready } = useSession();

  if (!ready) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center px-4" data-hide-dock>
        <LoadingSpinner label="Checking admin session…" />
      </main>
    );
  }

  if (!session) {
    return (
      <GuardCard
        icon={ShieldAlert}
        title="Admin access required"
        description="Sign in with an administrator account to open the auction command center, approve players, and control the live lot."
        href="/admin-login"
        label="Go to Admin Login"
      />
    );
  }

  if (session.role !== 'admin') {
    return (
      <GuardCard
        icon={ShieldAlert}
        title="Administrator role required"
        description={`You're signed in as ${session.name} (${session.role}). Switch to an admin account to continue.`}
        href="/admin-login"
        label="Login as Admin"
      />
    );
  }

  return (
    <div data-hide-dock>
      {children}
    </div>
  );
}

function GuardCard({
  title,
  description,
  href,
  label,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  label: string;
  icon: typeof ShieldCheck;
}) {
  return (
    <main className="mx-auto flex max-w-xl flex-col justify-center px-4 py-10" data-hide-dock>
      <GlassCard className="rounded-[2rem] border-white/15 p-8 text-center sm:p-10">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-amber-400/30 bg-amber-400/15 text-amber-300">
          <Icon className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-white font-display sm:text-3xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-300">{description}</p>
        <Link
          href={href}
          className="btn-primary mt-8 inline-flex w-full justify-center sm:w-auto sm:min-w-[200px]"
        >
          {label}
        </Link>
        <p className="mt-4 text-xs text-slate-500">
          Need the captain desk instead?{' '}
          <Link href="/captain-login" className="font-semibold text-amber-300 hover:underline">
            Captain login
          </Link>
        </p>
      </GlassCard>
    </main>
  );
}
