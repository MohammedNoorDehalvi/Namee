"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LockKeyhole } from 'lucide-react';
import { saveSession } from '@/hooks/useSession';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/components/ui/AppToaster';

export function LoginCard({ type }: { type: 'captain' | 'admin' }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function captainRedirectPath() {
    const { data } = await supabase.from('auction').select('auction_status').eq('id', 1).maybeSingle();
    return data?.auction_status === 'LIVE' ? '/auction?captain=1' : '/captain-dashboard';
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/${type}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password }),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      toast(json.error || 'Login failed');
      return;
    }

    saveSession(json.session);
    toast('Login successful');
    router.push(type === 'admin' ? '/admin-dashboard' : await captainRedirectPath());
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-stadium px-4 py-16">
      <form onSubmit={onSubmit} className="glass-card mx-auto max-w-md rounded-[2rem] p-6 sm:p-8">
        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-apl-gold/15 text-apl-gold">
          <LockKeyhole className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-black">{type === 'admin' ? 'Admin Login' : 'Captain Login'}</h1>
        <p className="mt-2 text-sm text-white/65">
          Passwords are checked through secure server API routes, not directly in the frontend.
        </p>

        <label className="mt-6 block text-sm font-bold text-white/80">
          {type === 'admin' ? 'Admin Name / Email' : 'Captain Name'}
        </label>
        <input
          className="input mt-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={type === 'admin' ? 'admin@apl.com' : 'Faiz'}
          required
        />

        <label className="mt-4 block text-sm font-bold text-white/80">Password</label>
        <input
          className="input mt-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Enter password"
          required
        />

        <button disabled={loading} className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? 'Checking...' : 'Login'}
        </button>
      </form>
    </main>
  );
}
