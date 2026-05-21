"use client";

import Link from 'next/link';
import { useSession } from '@/hooks/useSession';

export function CaptainGuard({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  if (!session) return <GuardCard title="Captain login required" href="/captain-login" label="Go to Captain Login" />;
  if (session.role !== 'captain') return <GuardCard title="Only captains can access this dashboard" href="/captain-login" label="Login as Captain" />;
  return <>{children}</>;
}
function GuardCard({ title, href, label }: { title: string; href: string; label: string }) {
  return <div className="mx-auto max-w-xl px-4 py-20"><div className="glass-card rounded-[2rem] p-8 text-center"><h1 className="text-3xl font-black">{title}</h1><Link className="btn-primary mt-6" href={href}>{label}</Link></div></div>;
}
