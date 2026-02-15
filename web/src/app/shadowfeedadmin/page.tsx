'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  Cpu,
  Gift,
  TrendingUp,
  Users,
  RefreshCw,
  LogIn,
  LogOut,
  Eye,
  EyeOff,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

interface PlanBreakdown {
  planId: string;
  planName: string;
  count: number;
  priceUsd: number;
}

interface RecentGeneration {
  id: string;
  theme: string;
  inputTokens: number | null;
  outputTokens: number | null;
  costUsd: number | null;
  creditsUsed: number | null;
  createdAt: string;
}

interface DashboardStats {
  totalOpenAiCost: number;
  subscriptionsByPlan: PlanBreakdown[];
  subscriptionRevenue: number;
  extraTokenRevenue: number;
  freeTokenCost: number;
  totalUsers: number;
  activeSubscriptions: number;
  netProfit: number;
  recentGenerations: RecentGeneration[];
}

function formatUsd(value: number): string {
  return `$${value.toFixed(4)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================================================
// Login Screen
// ============================================================================

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
      onLogin(data.token);
    } catch {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white/5 border border-white/10 rounded-[3px] p-8"
      >
        <h1 className="text-xl font-bold text-white mb-6 font-[family-name:var(--font-sora)]">
          ShadowFeed Admin
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-[3px] text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-white/60 text-sm mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-[3px] px-3 py-2 text-white text-sm focus:outline-none focus:border-[#8a00c4]"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-white/60 text-sm mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-[3px] px-3 py-2 pr-10 text-white text-sm focus:outline-none focus:border-[#8a00c4]"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
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

// ============================================================================
// Stat Card
// ============================================================================

function StatCard({
  label,
  value,
  icon: Icon,
  color = '#8a00c4',
  sub,
}: {
  label: string;
  value: string;
  icon: typeof DollarSign;
  color?: string;
  sub?: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-[3px] p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-white/50 text-sm">{label}</span>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="text-2xl font-bold text-white font-[family-name:var(--font-sora)]">
        {value}
      </div>
      {sub && <div className="text-xs text-white/40 mt-1">{sub}</div>}
    </div>
  );
}

// ============================================================================
// Dashboard
// ============================================================================

function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401 || res.status === 403) {
        onLogout();
        return;
      }

      if (!res.ok) {
        setError('Failed to fetch stats');
        return;
      }

      const data: DashboardStats = await res.json();
      setStats(data);
      setError('');
    } catch {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  }, [token, onLogout]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#8a00c4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-400">{error || 'No data'}</div>
      </div>
    );
  }

  const totalRevenue = stats.subscriptionRevenue + stats.extraTokenRevenue;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-sora)]">
          ShadowFeed Admin
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="p-2 bg-white/5 border border-white/10 rounded-[3px] text-white/60 hover:text-white hover:bg-white/10"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-[3px] text-white/60 hover:text-white hover:bg-white/10 text-sm"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          color="#22c55e"
          sub={`Subs: $${stats.subscriptionRevenue.toFixed(2)} | Extra: $${stats.extraTokenRevenue.toFixed(2)}`}
        />
        <StatCard
          label="OpenAI Cost"
          value={`$${stats.totalOpenAiCost.toFixed(4)}`}
          icon={Cpu}
          color="#ef4444"
        />
        <StatCard
          label="Free Token Cost"
          value={`$${stats.freeTokenCost.toFixed(4)}`}
          icon={Gift}
          color="#f59e0b"
          sub="Cost of posts generated with free tokens"
        />
        <StatCard
          label="Net Profit"
          value={`$${stats.netProfit.toFixed(2)}`}
          icon={TrendingUp}
          color={stats.netProfit >= 0 ? '#22c55e' : '#ef4444'}
          sub={`Margin: ${totalRevenue > 0 ? ((stats.netProfit / totalRevenue) * 100).toFixed(1) : '0'}%`}
        />
      </div>

      {/* Users & Plan Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-[3px] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-[#8a00c4]" />
            <h2 className="text-white font-semibold">Users</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Total Users</span>
              <span className="text-white font-medium">{stats.totalUsers}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Active Subscriptions</span>
              <span className="text-white font-medium">{stats.activeSubscriptions}</span>
            </div>
            <div className="border-t border-white/10 pt-3 mt-3">
              <div className="text-white/40 text-xs mb-2 uppercase tracking-wide">
                Plan Breakdown
              </div>
              {stats.subscriptionsByPlan.length === 0 ? (
                <div className="text-white/30 text-sm">No active plans</div>
              ) : (
                stats.subscriptionsByPlan.map((plan) => (
                  <div key={plan.planId} className="flex justify-between text-sm py-1">
                    <span className="text-white/60">{plan.planName}</span>
                    <span className="text-white">
                      {plan.count} <span className="text-white/40">x ${plan.priceUsd}</span>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white/5 border border-white/10 rounded-[3px] p-5">
          <h2 className="text-white font-semibold mb-4">Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Total Posts Generated</span>
              <span className="text-white font-medium">{stats.recentGenerations.length}+</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Avg Cost per Post</span>
              <span className="text-white font-medium">
                {stats.recentGenerations.length > 0
                  ? formatUsd(
                      stats.recentGenerations.reduce((s, g) => s + (g.costUsd || 0), 0) /
                        stats.recentGenerations.filter((g) => g.costUsd).length || 1
                    )
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Conversion Rate</span>
              <span className="text-white font-medium">
                {stats.totalUsers > 0
                  ? `${((stats.activeSubscriptions / stats.totalUsers) * 100).toFixed(1)}%`
                  : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Generations Table */}
      <div className="bg-white/5 border border-white/10 rounded-[3px] p-5">
        <h2 className="text-white font-semibold mb-4">Recent Generations</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-white/40 font-medium py-2 px-2">ID</th>
                <th className="text-left text-white/40 font-medium py-2 px-2">Theme</th>
                <th className="text-right text-white/40 font-medium py-2 px-2">In Tokens</th>
                <th className="text-right text-white/40 font-medium py-2 px-2">Out Tokens</th>
                <th className="text-right text-white/40 font-medium py-2 px-2">Cost USD</th>
                <th className="text-right text-white/40 font-medium py-2 px-2">Credits</th>
                <th className="text-right text-white/40 font-medium py-2 px-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentGenerations.map((gen) => (
                <tr key={gen.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-2 px-2 text-white/60 font-mono text-xs">
                    {gen.id.slice(0, 8)}
                  </td>
                  <td className="py-2 px-2 text-white">{gen.theme || '-'}</td>
                  <td className="py-2 px-2 text-right text-white/70">
                    {gen.inputTokens?.toLocaleString() ?? '-'}
                  </td>
                  <td className="py-2 px-2 text-right text-white/70">
                    {gen.outputTokens?.toLocaleString() ?? '-'}
                  </td>
                  <td className="py-2 px-2 text-right text-white/70">
                    {gen.costUsd != null ? formatUsd(gen.costUsd) : '-'}
                  </td>
                  <td className="py-2 px-2 text-right text-white/70">
                    {gen.creditsUsed ?? '-'}
                  </td>
                  <td className="py-2 px-2 text-right text-white/50 text-xs">
                    {formatDate(gen.createdAt)}
                  </td>
                </tr>
              ))}
              {stats.recentGenerations.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-white/30">
                    No generations yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('sf_admin_token');
    if (stored) setToken(stored);
  }, []);

  const handleLogin = (t: string) => setToken(t);

  const handleLogout = () => {
    localStorage.removeItem('sf_admin_token');
    setToken(null);
  };

  if (!token) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <Dashboard token={token} onLogout={handleLogout} />;
}
