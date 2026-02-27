'use client';

import { useState, type ReactNode } from 'react';
import { LogIn, Eye, EyeOff } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Login failed');
        return;
      }

      const data = await res.json();
      localStorage.setItem('sf_admin_token', data.token);
      // Set the sf-admin-token cookie for forge-shadowfeed API calls
      if (data.sfAdminToken) {
        document.cookie = `sf-admin-token=${encodeURIComponent(data.sfAdminToken)};path=/;max-age=${60 * 60 * 24 * 7};samesite=lax`;
      }
      onLogin(data.token);
    } catch {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0a]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-[#111111] border border-[#1e1e1e] rounded-[3px] p-8"
      >
        <h1 className="text-xl font-bold text-white mb-6 font-[family-name:var(--font-sora)]">
          ShadowFeed Admin
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-[#1a0707] border border-[#f87171]/20 rounded-[3px] text-[#f87171] text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-[#808080] text-sm mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-[#161616] border border-[#2a2a2a] rounded-[3px] px-3 py-2 text-white text-sm focus:outline-none focus:border-[#8a00c4]"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-[#808080] text-sm mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#161616] border border-[#2a2a2a] rounded-[3px] px-3 py-2 text-white text-sm focus:outline-none focus:border-[#8a00c4] pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#4a4a4a] hover:text-[#808080]"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#8a00c4] hover:bg-[#7a00b4] text-white py-2 rounded-[3px] text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <LogIn size={16} />
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

export function AdminAuthGate({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('sf_admin_token');
  });

  if (!token) {
    return <LoginScreen onLogin={(t) => setToken(t)} />;
  }

  return <>{children}</>;
}
