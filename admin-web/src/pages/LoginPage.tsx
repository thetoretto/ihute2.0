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
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <img src="/logo.png" className="login-logo-img" alt="ihute" />
        </div>
        <h1 className="login-title">Admin Portal</h1>
        <p className="login-sub">Sign in to manage ihute operations</p>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@ihute.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="Enter any password (mock)"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              autoComplete="current-password"
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="login-test-creds">
          <p>Test accounts</p>
          {TEST_CREDS.map((cred) => (
            <button
              key={cred.email}
              type="button"
              className="login-cred-btn"
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
