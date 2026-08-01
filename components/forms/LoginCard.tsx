'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LockKeyhole } from 'lucide-react';
import { saveSession } from '@/hooks/useSession';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/components/ui/AppToaster';
import { GlassCard, GlassButton } from '@/components/ui/liquid-glass';

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
    <main className="min-h-[calc(100vh-4rem)] bg-transparent px-4 py-16 flex items-center justify-center">
      <form onSubmit={onSubmit} className="w-full max-w-md">
        <GlassCard className="p-8 md:p-10 rounded-3xl space-y-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-300">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white font-display">
              {type === 'admin' ? 'Admin Login' : 'Captain Login'}
            </h1>
            <p className="mt-2 text-sm text-slate-200 leading-relaxed">
              Passwords are checked through secure server API routes, not directly in the frontend.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                {type === 'admin' ? 'Admin Name / Email' : 'Captain Name'}
              </label>
              <input
                className="w-full rounded-2xl bg-white/10 border border-white/15 px-4 py-3.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === 'admin' ? 'admin@apl.com' : 'Faiz'}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Password</label>
              <input
                className="w-full rounded-2xl bg-white/10 border border-white/15 px-4 py-3.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full">
            <GlassButton
              variant="amber"
              className="w-full py-4 text-slate-950 font-extrabold text-base rounded-full mt-4"
            >
              <span>{loading ? 'Checking...' : 'Login'}</span>
            </GlassButton>
          </button>
        </GlassCard>
      </form>
    </main>
  );
}
