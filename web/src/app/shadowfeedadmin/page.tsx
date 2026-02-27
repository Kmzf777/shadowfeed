'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Activity, BarChart2, ListChecks, Zap } from 'lucide-react';
import Link from 'next/link';
import { PostQueue } from './components/PostQueue';
import { PublishToggle } from './components/PublishToggle';
import { SessionStatus } from './components/SessionStatus';
import { RecentPosts } from './components/RecentPosts';
import { LlmSelector } from './components/LlmSelector';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

function getAdminToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;)\s*sf-admin-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

async function adminGet(path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'x-sf-admin-token': getAdminToken() },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function adminPost(path: string, body?: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'x-sf-admin-token': getAdminToken(),
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

// ── Types ────────────────────────────────────────────────────────────────────

type QueueStatus = 'pending' | 'generating' | 'ready' | 'approved' | 'posting' | 'posted' | 'failed';
type PillarId = 'wake-up-slap' | 'proof-of-machine' | 'shadow-school' | 'the-offer';

interface QueueItem {
  id: string;
  pillarId: PillarId;
  scheduledDate: string;
  scheduledTime: string;
  status: QueueStatus;
  themeUsed: string;
  postId: string | null;
  templateUsed: string | null;
}

interface SfStats {
  postsToday: number;
  totalPosts: number;
  avgGenerationTimeMs: number | null;
  failureRateLast7Days: number;
}

interface SfConfig {
  publishEnabled: boolean;
}

interface SfSession {
  connected: boolean;
  lastChecked: string;
  expiresAt?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getNextPost(items: QueueItem[]): QueueItem | null {
  const now = new Date();
  const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
  const today = now.toISOString().slice(0, 10);

  return (
    items
      .filter(
        (i) =>
          i.scheduledDate === today &&
          (i.status === 'pending' || i.status === 'ready' || i.status === 'approved') &&
          i.scheduledTime >= nowTime
      )
      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))[0] ?? null
  );
}

const PILLAR_NAMES: Record<PillarId, string> = {
  'wake-up-slap': 'TAPA NA CARA',
  'proof-of-machine': 'PROVA DA MÁQUINA',
  'shadow-school': 'ESCOLA SHADOW',
  'the-offer': 'A OFERTA',
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [stats, setStats] = useState<SfStats | null>(null);
  const [config, setConfig] = useState<SfConfig | null>(null);
  const [session, setSession] = useState<SfSession | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [recent, setRecent] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  const fetchAll = useCallback(async () => {
    setError('');
    try {
      const [st, cfg, sess, q, rec] = await Promise.all([
        adminGet('/api/forge-shadowfeed/stats'),
        adminGet('/api/forge-shadowfeed/config'),
        adminGet('/api/forge-shadowfeed/session/status'),
        adminGet(`/api/forge-shadowfeed/queue?date=${today}`),
        adminGet('/api/forge-shadowfeed/queue/recent'),
      ]);
      setStats(st);
      setConfig(cfg);
      setSession(sess);
      setQueue(Array.isArray(q) ? q : []);
      setRecent(Array.isArray(rec) ? rec : []);
    } catch {
      setError('Failed to load dashboard data. Check API connection.');
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const nextPost = getNextPost(queue);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      {/* Nav */}
      <nav className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <span className="text-[#8a00c4] font-mono font-bold text-sm tracking-widest">
            SF://ADMIN
          </span>
          <div className="flex items-center gap-1">
            <Link
              href="/shadowfeedadmin"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8a00c4]/20 border border-[#8a00c4]/40 text-[#c084fc] text-xs font-mono rounded-[3px]"
            >
              <Activity size={12} />
              DASHBOARD
            </Link>
            <Link
              href="/shadowfeedadmin/create-post"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161616] border border-[#2a2a2a] hover:border-[#3a3a3a] text-[#808080] hover:text-white text-xs font-mono rounded-[3px] transition-colors"
            >
              <Zap size={12} />
              CREATE
            </Link>
            <Link
              href="/shadowfeedadmin/posts"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161616] border border-[#2a2a2a] hover:border-[#3a3a3a] text-[#808080] hover:text-white text-xs font-mono rounded-[3px] transition-colors"
            >
              <ListChecks size={12} />
              POSTS
            </Link>
            <Link
              href="/shadowfeedadmin/stats"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161616] border border-[#2a2a2a] hover:border-[#3a3a3a] text-[#808080] hover:text-white text-xs font-mono rounded-[3px] transition-colors"
            >
              <BarChart2 size={12} />
              STATS
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <LlmSelector />
          <button
            onClick={fetchAll}
            className="p-1.5 text-[#4a4a4a] hover:text-[#808080] transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </nav>

      {loading && (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-[#8a00c4] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && !loading && (
        <div className="bg-[#1a0000] border border-[#f87171]/20 rounded-[3px] p-4 text-[#f87171] text-sm font-mono mb-6">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Status row — AC5, AC6 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {/* System status */}
            <div className="bg-[#111111] border border-[#1e1e1e] rounded-[3px] p-4">
              <div className="text-[#4a4a4a] text-[10px] font-mono uppercase tracking-wider mb-2">
                SYSTEM
              </div>
              <div
                className={`text-sm font-mono font-bold ${config?.publishEnabled ? 'text-[#4ade80]' : 'text-[#f59e0b]'}`}
              >
                {config?.publishEnabled ? '● ACTIVE' : '○ INACTIVE'}
              </div>
            </div>

            {/* Posts today */}
            <div className="bg-[#111111] border border-[#1e1e1e] rounded-[3px] p-4">
              <div className="text-[#4a4a4a] text-[10px] font-mono uppercase tracking-wider mb-2">
                TODAY
              </div>
              <div className="text-sm font-mono font-bold text-white">
                {stats?.postsToday ?? 0}
                <span className="text-[#4a4a4a]">/4</span>
              </div>
            </div>

            {/* Next post */}
            <div className="bg-[#111111] border border-[#1e1e1e] rounded-[3px] p-4">
              <div className="text-[#4a4a4a] text-[10px] font-mono uppercase tracking-wider mb-2">
                NEXT POST
              </div>
              {nextPost ? (
                <div className="text-xs font-mono">
                  <span className="text-[#c084fc]">{nextPost.scheduledTime.slice(0, 5)}</span>
                  <span className="text-[#4a4a4a] ml-2 text-[10px]">
                    {PILLAR_NAMES[nextPost.pillarId]}
                  </span>
                </div>
              ) : (
                <div className="text-[#4a4a4a] text-xs font-mono">—</div>
              )}
            </div>

            {/* Session status */}
            <div className="bg-[#111111] border border-[#1e1e1e] rounded-[3px] p-4">
              <div className="text-[#4a4a4a] text-[10px] font-mono uppercase tracking-wider mb-2">
                INSTAGRAM
              </div>
              <SessionStatus
                connected={session?.connected ?? false}
                lastChecked={session?.lastChecked}
                expiresAt={session?.expiresAt}
                onRefresh={async () => {
                  const sess = await adminGet('/api/forge-shadowfeed/session/status');
                  setSession(sess);
                }}
                onConnect={async () => {
                  if (
                    !confirm(
                      'This will launch a visible browser window on the server to perform the Instagram login. Ensure you have access to the server display. Proceed?'
                    )
                  )
                    return;
                  try {
                    await adminPost('/api/forge-shadowfeed/session/setup');
                    const sess = await adminGet('/api/forge-shadowfeed/session/status');
                    setSession(sess);
                  } catch (err) {
                    alert('Failed to launch connection session. Check backend logs.');
                  }
                }}
              />
            </div>
          </div>

          {/* Controls — AC7, AC9 */}
          <div className="bg-[#111111] border border-[#1e1e1e] rounded-[3px] p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <Link
                href="/shadowfeedadmin/create-post"
                className="flex items-center gap-2 px-4 py-2 bg-[#8a00c4] hover:bg-[#7a00b4] text-white text-sm font-mono font-bold rounded-[3px] border border-[#8a00c4]/50 transition-colors"
              >
                <Zap size={14} />
                CREATE NEW POST
              </Link>
              {config && (
                <PublishToggle
                  enabled={config.publishEnabled}
                  onChange={(v) => setConfig((c) => (c ? { ...c, publishEnabled: v } : c))}
                />
              )}
            </div>
          </div>

          {/* Today's queue — AC8 */}
          <div className="bg-[#111111] border border-[#1e1e1e] rounded-[3px] p-4 mb-6">
            <div className="text-[#4a4a4a] text-[10px] font-mono uppercase tracking-wider mb-3">
              TODAY&apos;S QUEUE — {today}
            </div>
            <PostQueue items={queue} onRefresh={fetchAll} />
          </div>

          {/* Recent posts — AC10 */}
          <div className="bg-[#111111] border border-[#1e1e1e] rounded-[3px] p-4">
            <div className="text-[#4a4a4a] text-[10px] font-mono uppercase tracking-wider mb-3">
              RECENT POSTS — LAST 7 DAYS
            </div>
            <RecentPosts items={recent} />
          </div>
        </>
      )}
    </div>
  );
}
