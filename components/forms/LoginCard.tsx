"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LockKeyhole } from 'lucide-react';
import { saveSession } from '@/hooks/useSession';
import { toast } from '@/components/ui/AppToaster';

export function LoginCard({ type }: { type: 'captain' | 'admin' }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/${type}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, password }) });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) return toast(json.error || 'Login failed');
    saveSession(json.session);
    toast('Login successful');
    router.push(type === 'admin' ? '/admin-dashboard' : '/captain-dashboard');
  }

  return (
    <form onSubmit={onSubmit} className="glass-card mx-auto max-w-md rounded-[2rem] p-6 sm:p-8">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-apl-gold/15 text-apl-gold"><LockKeyhole size={28} /></div>
      <h1 className="mt-5 text-center text-3xl font-black">{type === 'admin' ? 'Admin Login' : 'Captain Login'}</h1>
      <p className="mt-2 text-center text-sm text-white/55">Passwords are checked through secure server API routes, not directly in the frontend.</p>
      <div className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm font-bold">{type === 'admin' ? 'Admin Name / Email' : 'Captain Name'}<input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={type === 'admin' ? 'admin@apl.com' : 'Faiz'} /></label>
        <label className="grid gap-2 text-sm font-bold">Password<input className="input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Enter password" /></label>
        <button disabled={loading} className="btn-primary disabled:opacity-50">{loading ? 'Checking...' : 'Login'}</button>
      </div>
    </form>
  );
}
