import React, { useState } from 'react';
import { mockAdminUsers } from '@shared/mocks';
import type { AdminUser } from '../types';

interface LoginPageProps {
  onLogin: (user: AdminUser) => void;
}

const TEST_CREDS = [
  { email: 'system_admin@ihute.com', label: 'System admin' },
  { email: 'agency_admin@ihute.com', label: 'Agency admin' },
];

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('Email is required.'); return; }
    if (!password.trim()) { setError('Password is required.'); return; }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    const user = mockAdminUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) as AdminUser | undefined;
    if (!user) {
      setError('No account found with that email address.');
      setLoading(false);
      return;
    }

    setLoading(false);
    onLogin(user);
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="bg-white border border-soft rounded-2xl p-10 w-full max-w-[420px] shadow-soft">
        <div className="flex items-center gap-3 mb-2">
          <img src="/logo.png" className="h-16 w-auto rounded-xl block mb-1" alt="ihute" />
        </div>
        <h1 className="text-2xl font-black text-dark m-0 mb-1">Admin Portal</h1>
        <p className="text-sm text-muted m-0 mb-7">Sign in to manage ihute operations</p>

        <form className="flex flex-col gap-4 mb-6" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-email" className="text-sm font-semibold text-muted">Email address</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@ihute.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              autoComplete="email"
              autoFocus
              className="w-full py-2.5 px-3 border border-soft rounded-xl bg-white text-dark outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-password" className="text-sm font-semibold text-muted">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="Enter any password (mock)"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              autoComplete="current-password"
              className="w-full py-2.5 px-3 border border-soft rounded-xl bg-white text-dark outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted"
            />
          </div>

          {error && (
            <p className="text-danger text-sm m-0 bg-danger-100 border border-danger/25 rounded-lg py-2 px-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 border border-primary/50 bg-primary text-dark font-semibold rounded-xl cursor-pointer transition-all mt-1 disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-primary/90"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="border-t border-soft pt-5">
          <p className="text-[11px] font-semibold text-muted uppercase tracking-widest m-0 mb-2.5">Test accounts</p>
          {TEST_CREDS.map((cred) => (
            <button
              key={cred.email}
              type="button"
              className="w-full flex items-center min-h-[38px] text-left bg-white border border-soft text-muted py-0 px-3 rounded-xl cursor-pointer mb-1.5 last:mb-0 transition-all hover:border-primary hover:text-dark hover:bg-primary"
              onClick={() => { setEmail(cred.email); setPassword('demo'); setError(''); }}
            >
              {cred.label} — {cred.email}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
