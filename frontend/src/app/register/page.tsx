'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signUp(email, password);
    
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="apple-card p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--fg)' }}>
            Check your email
          </h2>
          <p style={{ color: 'var(--muted)' }}>
            We've sent a confirmation link to <strong>{email}</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md">
        <div className="apple-card p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold" style={{ color: 'var(--fg)' }}>
              Create account
            </h1>
            <p className="mt-2" style={{ color: 'var(--muted)' }}>
              Start your AI-powered job search
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: 'var(--fg)' }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--border)' }}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: 'var(--fg)' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--border)' }}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-medium transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--muted)' }}>
            Already have an account?{' '}
            <a href="/login" className="font-medium" style={{ color: 'var(--accent)' }}>
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}