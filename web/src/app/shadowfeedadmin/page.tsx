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
  BarChart3,
  ScrollText,
  Percent,
  Activity,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

// ============================================================================
// Interfaces
// ============================================================================

interface PlanBreakdown {
  planId: string;
  planName: string;
  count: number;
  priceUsd: number;
}

interface ModelBreakdown {
  modelId: string;
  modelName: string;
  generationCount: number;
  totalRealCost: number;
  totalTokensCharged: number;
  avgCostPerPost: number;
}

interface RecentGeneration {
  id: string;
  theme: string;
  modelName: string | null;
  modelId: string | null;
  userId: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  costUsd: number | null;
  creditsUsed: number | null;
  actualTokens: number | null;
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
  marginPercent: number;
  marginAlert: 'healthy' | 'warning' | 'critical';
  totalGenerations: number;
  modelBreakdown: ModelBreakdown[];
  recentGenerations: RecentGeneration[];
}

interface UserProfitability {
  userId: string;
  email: string | null;
  planId: string | null;
  planName: string | null;
  generationCount: number;
  totalRealCost: number;
  totalTokensCharged: number;
  subscriptionPriceUsd: number;
  profit: number;
}

interface GenerationLog {
  id: string;
  userId: string | null;
  theme: string | null;
  modelId: string | null;
  modelName: string | null;
  provider: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  costUsd: number | null;
  creditsUsed: number | null;
  estimatedTokens: number | null;
  actualTokens: number | null;
  createdAt: string;
}

// ============================================================================
// Helpers
// ============================================================================

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

function marginColor(alert: string): string {
  if (alert === 'healthy') return '#22c55e';
  if (alert === 'warning') return '#f59e0b';
  return '#ef4444';
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
// Tab Button
// ============================================================================

function TabButton({ label, active, onClick, icon: Icon }: { label: string; active: boolean; onClick: () => void; icon: typeof DollarSign }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-[3px] text-sm font-medium transition ${active
          ? 'bg-[#8a00c4] text-white'
          : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
        }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

// ============================================================================
// Overview Tab
// ============================================================================

function OverviewTab({ stats }: { stats: DashboardStats }) {
  const totalRevenue = (stats.subscriptionRevenue || 0) + (stats.extraTokenRevenue || 0);

  return (
    <>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          label="Total Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          color="#22c55e"
          sub={`Subs: $${(stats.subscriptionRevenue || 0).toFixed(2)} | Extra: $${(stats.extraTokenRevenue || 0).toFixed(2)}`}
        />
        <StatCard
          label="OpenAI Cost"
          value={`$${(stats.totalOpenAiCost || 0).toFixed(4)}`}
          icon={Cpu}
          color="#ef4444"
        />
        <StatCard
          label="Free Token Cost"
          value={`$${(stats.freeTokenCost || 0).toFixed(4)}`}
          icon={Gift}
          color="#f59e0b"
          sub="Cost of posts from free tokens"
        />
        <StatCard
          label="Net Profit"
          value={`$${(stats.netProfit || 0).toFixed(2)}`}
          icon={TrendingUp}
          color={stats.netProfit >= 0 ? '#22c55e' : '#ef4444'}
        />
        <StatCard
          label="Margin"
          value={`${(stats.marginPercent || 0).toFixed(1)}%`}
          icon={Percent}
          color={marginColor(stats.marginAlert)}
          sub={stats.marginAlert}
        />
      </div>

      {/* Users & Model Breakdown */}
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
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Total Generations</span>
              <span className="text-white font-medium">{stats.totalGenerations}</span>
            </div>
            <div className="border-t border-white/10 pt-3 mt-3">
              <div className="text-white/40 text-xs mb-2 uppercase tracking-wide">Plan Breakdown</div>
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

        <div className="bg-white/5 border border-white/10 rounded-[3px] p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-[#8a00c4]" />
            <h2 className="text-white font-semibold">Model Usage</h2>
          </div>
          {stats.modelBreakdown.length === 0 ? (
            <div className="text-white/30 text-sm">No generation data yet</div>
          ) : (
            <div className="space-y-3">
              {stats.modelBreakdown.map((model) => {
                const totalGens = stats.totalGenerations || 1;
                const pct = (model.generationCount / totalGens) * 100;
                return (
                  <div key={model.modelId}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/70">{model.modelName}</span>
                      <span className="text-white/50">{model.generationCount} posts</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#8a00c4] rounded-full"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-white/30 mt-1">
                      <span>Cost: ${(model.totalRealCost || 0).toFixed(4)}</span>
                      <span>Avg: ${(model.avgCostPerPost || 0).toFixed(4)}/post</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                <th className="text-left text-white/40 font-medium py-2 px-2">Model</th>
                <th className="text-right text-white/40 font-medium py-2 px-2">In Tok</th>
                <th className="text-right text-white/40 font-medium py-2 px-2">Out Tok</th>
                <th className="text-right text-white/40 font-medium py-2 px-2">Cost</th>
                <th className="text-right text-white/40 font-medium py-2 px-2">SF Tokens</th>
                <th className="text-right text-white/40 font-medium py-2 px-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentGenerations.map((gen) => (
                <tr key={gen.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-2 px-2 text-white/60 font-mono text-xs">{gen.id.slice(0, 8)}</td>
                  <td className="py-2 px-2 text-white">{gen.theme || '-'}</td>
                  <td className="py-2 px-2 text-white/70 text-xs">{gen.modelName || 'Legacy'}</td>
                  <td className="py-2 px-2 text-right text-white/70">{gen.inputTokens?.toLocaleString() ?? '-'}</td>
                  <td className="py-2 px-2 text-right text-white/70">{gen.outputTokens?.toLocaleString() ?? '-'}</td>
                  <td className="py-2 px-2 text-right text-white/70">{gen.costUsd != null ? formatUsd(gen.costUsd) : '-'}</td>
                  <td className="py-2 px-2 text-right text-white/70">{gen.actualTokens ?? gen.creditsUsed ?? '-'}</td>
                  <td className="py-2 px-2 text-right text-white/50 text-xs">{formatDate(gen.createdAt)}</td>
                </tr>
              ))}
              {stats.recentGenerations.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-white/30">No generations yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// Models Tab
// ============================================================================

function ModelsTab({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [models, setModels] = useState<ModelBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch(`${API_URL}/api/admin/stats/models`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401 || res.status === 403) { onLogout(); return; }
        if (res.ok) setModels(await res.json());
      } catch { } finally { setLoading(false); }
    }
    fetch_();
  }, [token, onLogout]);

  if (loading) return <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-[#8a00c4] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="bg-white/5 border border-white/10 rounded-[3px] p-5">
      <h2 className="text-white font-semibold mb-4">Model Analytics</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-white/40 font-medium py-2 px-2">Model</th>
              <th className="text-right text-white/40 font-medium py-2 px-2">Generations</th>
              <th className="text-right text-white/40 font-medium py-2 px-2">Total Real Cost</th>
              <th className="text-right text-white/40 font-medium py-2 px-2">Avg Cost/Post</th>
              <th className="text-right text-white/40 font-medium py-2 px-2">Total SF Tokens</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.modelId} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-2 px-2 text-white font-medium">{m.modelName}</td>
                <td className="py-2 px-2 text-right text-white/70">{m.generationCount}</td>
                <td className="py-2 px-2 text-right text-white/70">${m.totalRealCost.toFixed(4)}</td>
                <td className="py-2 px-2 text-right text-white/70">${m.avgCostPerPost.toFixed(4)}</td>
                <td className="py-2 px-2 text-right text-white/70">{m.totalTokensCharged.toLocaleString()}</td>
              </tr>
            ))}
            {models.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-white/30">No data yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// Users Tab
// ============================================================================

function UsersTab({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [users, setUsers] = useState<UserProfitability[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'generationCount' | 'profit' | 'totalRealCost'>('generationCount');

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch(`${API_URL}/api/admin/stats/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401 || res.status === 403) { onLogout(); return; }
        if (res.ok) setUsers(await res.json());
      } catch { } finally { setLoading(false); }
    }
    fetch_();
  }, [token, onLogout]);

  if (loading) return <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-[#8a00c4] border-t-transparent rounded-full animate-spin" /></div>;

  const sorted = [...users].sort((a, b) => (b as any)[sortBy] - (a as any)[sortBy]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-[3px] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold">User Profitability</h2>
        <div className="flex gap-2">
          {(['generationCount', 'profit', 'totalRealCost'] as const).map(key => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-2 py-1 text-xs rounded-[3px] ${sortBy === key ? 'bg-[#8a00c4] text-white' : 'bg-white/5 text-white/40 hover:text-white'}`}
            >
              {key === 'generationCount' ? 'Posts' : key === 'profit' ? 'Profit' : 'Cost'}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-white/40 font-medium py-2 px-2">Email</th>
              <th className="text-left text-white/40 font-medium py-2 px-2">Plan</th>
              <th className="text-right text-white/40 font-medium py-2 px-2">Posts</th>
              <th className="text-right text-white/40 font-medium py-2 px-2">Tokens Used</th>
              <th className="text-right text-white/40 font-medium py-2 px-2">Real Cost</th>
              <th className="text-right text-white/40 font-medium py-2 px-2">Revenue</th>
              <th className="text-right text-white/40 font-medium py-2 px-2">Profit</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((u) => (
              <tr key={u.userId} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-2 px-2 text-white/70 text-xs">{u.email || u.userId.slice(0, 8)}</td>
                <td className="py-2 px-2 text-white/50 text-xs">{u.planName || 'Free'}</td>
                <td className="py-2 px-2 text-right text-white/70">{u.generationCount}</td>
                <td className="py-2 px-2 text-right text-white/70">{u.totalTokensCharged.toLocaleString()}</td>
                <td className="py-2 px-2 text-right text-white/70">${u.totalRealCost.toFixed(4)}</td>
                <td className="py-2 px-2 text-right text-white/70">${u.subscriptionPriceUsd.toFixed(2)}</td>
                <td className={`py-2 px-2 text-right font-medium ${u.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${u.profit.toFixed(2)}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={7} className="py-8 text-center text-white/30">No users yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// Generation Logs Tab
// ============================================================================

function LogsTab({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [logs, setLogs] = useState<GenerationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modelFilter, setModelFilter] = useState('');
  const limit = 25;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (modelFilter) params.set('model', modelFilter);

      const res = await fetch(`${API_URL}/api/admin/generations?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) { onLogout(); return; }
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data);
        setTotal(data.total);
      }
    } catch { } finally { setLoading(false); }
  }, [token, page, modelFilter, onLogout]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="bg-white/5 border border-white/10 rounded-[3px] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold">Generation Logs ({total})</h2>
        <div className="flex items-center gap-2">
          <select
            value={modelFilter}
            onChange={(e) => { setModelFilter(e.target.value); setPage(1); }}
            className="bg-white/5 border border-white/10 rounded-[3px] px-2 py-1 text-white text-xs focus:outline-none"
          >
            <option value="">All Models</option>
            <option value="marketing-friend">Marketing Friend</option>
            <option value="copywriter">Copywriter</option>
            <option value="shadowfeed">ShadowFeed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-[#8a00c4] border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/40 font-medium py-2 px-2">ID</th>
                  <th className="text-left text-white/40 font-medium py-2 px-2">User</th>
                  <th className="text-left text-white/40 font-medium py-2 px-2">Theme</th>
                  <th className="text-left text-white/40 font-medium py-2 px-2">Model</th>
                  <th className="text-right text-white/40 font-medium py-2 px-2">In</th>
                  <th className="text-right text-white/40 font-medium py-2 px-2">Out</th>
                  <th className="text-right text-white/40 font-medium py-2 px-2">Cost</th>
                  <th className="text-right text-white/40 font-medium py-2 px-2">SF Tok</th>
                  <th className="text-right text-white/40 font-medium py-2 px-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2 px-2 text-white/60 font-mono text-xs">{log.id.slice(0, 8)}</td>
                    <td className="py-2 px-2 text-white/50 text-xs">{log.userId?.slice(0, 8) || '-'}</td>
                    <td className="py-2 px-2 text-white">{log.theme || '-'}</td>
                    <td className="py-2 px-2 text-white/70 text-xs">{log.modelName || 'Legacy'}</td>
                    <td className="py-2 px-2 text-right text-white/70">{log.inputTokens?.toLocaleString() ?? '-'}</td>
                    <td className="py-2 px-2 text-right text-white/70">{log.outputTokens?.toLocaleString() ?? '-'}</td>
                    <td className="py-2 px-2 text-right text-white/70">{log.costUsd != null ? formatUsd(log.costUsd) : '-'}</td>
                    <td className="py-2 px-2 text-right text-white/70">{log.actualTokens ?? log.creditsUsed ?? '-'}</td>
                    <td className="py-2 px-2 text-right text-white/50 text-xs">{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={9} className="py-8 text-center text-white/30">No logs found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1 text-white/40 hover:text-white disabled:opacity-20"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-white/50 text-sm">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1 text-white/40 hover:text-white disabled:opacity-20"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}
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
  const [activeTab, setActiveTab] = useState<'overview' | 'models' | 'users' | 'logs'>('overview');

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

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <TabButton label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={Activity} />
        <TabButton label="Models" active={activeTab === 'models'} onClick={() => setActiveTab('models')} icon={BarChart3} />
        <TabButton label="Users" active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={Users} />
        <TabButton label="Logs" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={ScrollText} />
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab stats={stats} />}
      {activeTab === 'models' && <ModelsTab token={token} onLogout={onLogout} />}
      {activeTab === 'users' && <UsersTab token={token} onLogout={onLogout} />}
      {activeTab === 'logs' && <LogsTab token={token} onLogout={onLogout} />}
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
