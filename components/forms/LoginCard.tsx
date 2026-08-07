'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LockKeyhole, Shield, UserRound } from 'lucide-react';
import { saveSession } from '@/hooks/useSession';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/components/ui/AppToaster';
import { BorderBeam } from '@/components/ui/BorderBeam';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { Meteors } from '@/components/ui/Meteors';
import { ShimmerButton } from '@/components/ui/ShimmerButton';
import Link from 'next/link';

export function LoginCard({ type }: { type: 'captain' | 'admin' }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isAdmin = type === 'admin';

  async function captainRedirectPath() {
    try {
      const { data } = await supabase.from('auction').select('auction_status').eq('id', 1).maybeSingle();
      return data?.auction_status === 'LIVE' ? '/auction?captain=1' : '/captain-dashboard';
    } catch {
      return '/captain-dashboard';
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName || !password) {
      setError('Enter your name and password to continue.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/${type}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, password }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message = json.error || 'Login failed. Check your credentials and try again.';
        setError(message);
        toast.error(message);
        return;
      }

      saveSession(json.session);
      toast.success(isAdmin ? 'Welcome, admin' : 'Welcome, captain');
      router.push(isAdmin ? '/admin-dashboard' : await captainRedirectPath());
    } catch {
      const message = 'Network error. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-[calc(100vh-var(--nav-offset)-4rem)] items-center justify-center overflow-hidden px-4 py-8 sm:py-12">
      <form onSubmit={onSubmit} className="relative z-10 w-full max-w-md" noValidate>
        <SpotlightCard
          spotlightColor="rgba(245, 158, 11, 0.18)"
          className="relative space-y-6 overflow-hidden rounded-[2.5rem] border-white/15 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-2xl md:p-10"
        >
          <BorderBeam lightColor="#F59E0B" lightWidth={260} duration={8} />
          <Meteors number={10} />

          <div className="relative z-10 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/20 text-amber-300 shadow-lg shadow-amber-500/10">
            {isAdmin ? <Shield className="h-7 w-7" /> : <LockKeyhole className="h-7 w-7" />}
          </div>

          <div className="relative z-10">
            <h1 className="text-3xl font-extrabold text-white font-display">
              {isAdmin ? 'Admin Portal' : 'Captain Portal'}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {isAdmin
                ? 'Control the auction, approve players, and manage franchises.'
                : 'Place live bids and manage your franchise purse during the auction.'}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="relative z-10 rounded-2xl border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200"
            >
              {error}
            </div>
          )}

          <div className="relative z-10 space-y-4">
            <div>
              <label htmlFor="login-name" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">
                {isAdmin ? 'Admin name / email' : 'Captain name'}
              </label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="login-name"
                  name="username"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="w-full rounded-2xl border border-white/15 bg-white/10 py-3.5 pl-11 pr-4 text-sm font-medium text-white placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={isAdmin ? 'admin@apl.com' : 'Your captain name'}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-white/15 bg-white/10 py-3.5 pl-4 pr-12 text-sm font-medium text-white placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-1">
            <ShimmerButton type="submit" disabled={loading} shimmerColor="#F59E0B" className="w-full justify-center py-4">
              <span>{loading ? 'Authenticating…' : isAdmin ? 'Enter Admin Portal' : 'Enter Captain Desk'}</span>
            </ShimmerButton>
          </div>

          <p className="relative z-10 text-center text-xs text-slate-400">
            {isAdmin ? (
              <>
                Captain instead?{' '}
                <Link href="/captain-login" className="font-semibold text-amber-300 hover:underline">
                  Captain login
                </Link>
              </>
            ) : (
              <>
                Just watching?{' '}
                <Link href="/auction" className="font-semibold text-emerald-300 hover:underline">
                  Open live auction
                </Link>
              </>
            )}
          </p>
        </SpotlightCard>
      </form>
    </main>
  );
}
