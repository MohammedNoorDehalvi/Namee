'use client';

import Link from 'next/link';
import { Gavel, Lock } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { GlassCard } from '@/components/ui/liquid-glass';

export function CaptainGuard({ children }: { children: React.ReactNode }) {
  const { session, ready } = useSession();

  if (!ready) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center px-4" data-hide-dock>
        <LoadingSpinner label="Checking captain session…" />
      </main>
    );
  }

  if (!session) {
    return (
      <GuardCard
        icon={Lock}
        title="Captain login required"
        description="Sign in with your franchise captain credentials to bid in the live auction and manage your squad purse."
        href="/captain-login"
        label="Go to Captain Login"
      />
    );
  }

  if (session.role !== 'captain') {
    return (
      <GuardCard
        icon={Gavel}
        title="Captain role required"
        description={`You're signed in as ${session.name} (${session.role}). Captains place bids from this desk.`}
        href="/captain-login"
        label="Login as Captain"
      />
    );
  }

  return <div data-hide-dock>{children}</div>;
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
  icon: typeof Lock;
}) {
  return (
    <main className="mx-auto flex max-w-xl flex-col justify-center px-4 py-10" data-hide-dock>
      <GlassCard className="rounded-[2rem] border-white/15 p-8 text-center sm:p-10">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-emerald-400/30 bg-emerald-400/15 text-emerald-300">
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
          Spectators can watch without login on the{' '}
          <Link href="/auction" className="font-semibold text-emerald-300 hover:underline">
            Live Auction
          </Link>
          .
        </p>
      </GlassCard>
    </main>
  );
}
