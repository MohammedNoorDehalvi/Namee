"use client";

import Link from 'next/link';
import { useSession } from '@/hooks/useSession';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  if (!session) return <GuardCard title="Admin login required" href="/admin-login" label="Go to Admin Login" />;
  if (session.role !== 'admin') return <GuardCard title="Only admin can access this panel" href="/admin-login" label="Login as Admin" />;
  return <>{children}</>;
}
function GuardCard({ title, href, label }: { title: string; href: string; label: string }) {
  return <div className="mx-auto max-w-xl px-4 py-20"><div className="glass-card rounded-[2rem] p-8 text-center"><h1 className="text-3xl font-black">{title}</h1><Link className="btn-primary mt-6" href={href}>{label}</Link></div></div>;
}
