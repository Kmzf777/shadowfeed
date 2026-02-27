'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Activity, BarChart2, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { PostReviewCard } from '../components/PostReviewCard';
import { LlmSelector } from '../components/LlmSelector';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

function getAdminToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;)\s*sf-admin-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
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
  templateUsed: string | null;
  postId: string | null;
}

const PILLAR_SLIDE_RANGES: Record<PillarId, string> = {
  'wake-up-slap': '5–8',
  'proof-of-machine': '7–10',
  'shadow-school': '8–12',
  'the-offer': '5–8',
};

type FilterTab = 'all' | 'pending' | 'approved' | 'posted';

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'ALL' },
  { id: 'pending', label: 'PENDING' },
  { id: 'approved', label: 'APPROVED' },
  { id: 'posted', label: 'POSTED' },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PostsReviewPage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const fetchItems = useCallback(async () => {
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/forge-shadowfeed/queue/recent`, {
        headers: { 'x-sf-admin-token': getAdminToken() },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load posts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Filter logic — AC15
  const filtered = items.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending')
      return item.status === 'pending' || item.status === 'ready' || item.status === 'generating';
    if (activeTab === 'approved') return item.status === 'approved';
    if (activeTab === 'posted') return item.status === 'posted' || item.status === 'posting';
    return true;
  });

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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161616] border border-[#2a2a2a] hover:border-[#3a3a3a] text-[#808080] hover:text-white text-xs font-mono rounded-[3px] transition-colors"
            >
              <Activity size={12} />
              DASHBOARD
            </Link>
            <Link
              href="/shadowfeedadmin/posts"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8a00c4]/20 border border-[#8a00c4]/40 text-[#c084fc] text-xs font-mono rounded-[3px]"
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
            onClick={fetchItems}
            className="p-1.5 text-[#4a4a4a] hover:text-[#808080] transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </nav>

      {/* Filter tabs — AC15 */}
      <div className="flex items-center gap-1 mb-6 border-b border-[#1e1e1e] pb-3">
        {FILTER_TABS.map((tab) => {
          const count = items.filter((i) => {
            if (tab.id === 'all') return true;
            if (tab.id === 'pending')
              return i.status === 'pending' || i.status === 'ready' || i.status === 'generating';
            if (tab.id === 'approved') return i.status === 'approved';
            if (tab.id === 'posted') return i.status === 'posted' || i.status === 'posting';
            return false;
          }).length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-[3px] transition-colors ${activeTab === tab.id
                ? 'bg-[#8a00c4]/20 border border-[#8a00c4]/40 text-[#c084fc]'
                : 'bg-[#161616] border border-[#1e1e1e] text-[#808080] hover:text-white hover:border-[#2a2a2a]'
                }`}
            >
              {tab.label}
              <span className="text-[10px] opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-[#8a00c4] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && !loading && (
        <div className="bg-[#1a0000] border border-[#f87171]/20 rounded-[3px] p-4 text-[#f87171] text-sm font-mono">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-[#4a4a4a] text-sm font-mono text-center py-12">
          NO POSTS MATCH THIS FILTER
        </div>
      )}

      {/* Cards grid — AC11–AC14 */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((item) => (
            <PostReviewCard
              key={item.id}
              id={item.id}
              pillarId={item.pillarId}
              scheduledDate={item.scheduledDate}
              scheduledTime={item.scheduledTime}
              status={item.status}
              themeUsed={item.themeUsed}
              templateUsed={item.templateUsed}
              slideRange={PILLAR_SLIDE_RANGES[item.pillarId] ?? '5–10'}
              postId={item.postId}
              onStatusChange={fetchItems}
            />
          ))}
        </div>
      )}
    </div>
  );
}
