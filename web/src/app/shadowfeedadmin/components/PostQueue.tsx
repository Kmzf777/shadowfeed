'use client';

import { Eye, Send } from 'lucide-react';
import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

function getAdminToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;)\s*sf-admin-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

type QueueStatus = 'pending' | 'generating' | 'ready' | 'approved' | 'posting' | 'posted' | 'failed';
type PillarId = 'wake-up-slap' | 'proof-of-machine' | 'shadow-school' | 'the-offer';

interface QueueItem {
  id: string;
  pillarId: PillarId;
  scheduledTime: string;
  status: QueueStatus;
  themeUsed: string;
  postId: string | null;
}

const PILLAR_NAMES: Record<PillarId, string> = {
  'wake-up-slap': 'TAPA NA CARA',
  'proof-of-machine': 'PROVA DA MÁQUINA',
  'shadow-school': 'ESCOLA SHADOW',
  'the-offer': 'A OFERTA',
};

const STATUS_STYLES: Record<QueueStatus, string> = {
  pending:    'bg-[#1a1000] text-[#f59e0b] border-[#f59e0b]/30',
  generating: 'bg-[#001020] text-[#38bdf8] border-[#38bdf8]/30',
  ready:      'bg-[#001a05] text-[#4ade80] border-[#4ade80]/30',
  approved:   'bg-[#001a10] text-[#34d399] border-[#34d399]/30',
  posting:    'bg-[#001020] text-[#818cf8] border-[#818cf8]/30',
  posted:     'bg-[#001a05] text-[#22c55e] border-[#22c55e]/30',
  failed:     'bg-[#1a0000] text-[#f87171] border-[#f87171]/30',
};

interface PostQueueProps {
  items: QueueItem[];
  onRefresh?: () => void;
}

export function PostQueue({ items, onRefresh }: PostQueueProps) {
  const [publishing, setPublishing] = useState<string | null>(null);

  const handlePublishNow = async (id: string) => {
    setPublishing(id);
    try {
      await fetch(`${API_BASE}/api/forge-shadowfeed/queue/${id}/publish-now`, {
        method: 'POST',
        headers: { 'x-sf-admin-token': getAdminToken() },
      });
      onRefresh?.();
    } finally {
      setPublishing(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-[#4a4a4a] text-sm font-mono text-center py-6">
        NO QUEUE ITEMS FOR TODAY
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e1e1e]">
            <th className="text-left text-[#4a4a4a] font-mono uppercase tracking-wider text-[11px] py-2 px-2">
              TIME
            </th>
            <th className="text-left text-[#4a4a4a] font-mono uppercase tracking-wider text-[11px] py-2 px-2">
              PILLAR
            </th>
            <th className="text-left text-[#4a4a4a] font-mono uppercase tracking-wider text-[11px] py-2 px-2">
              STATUS
            </th>
            <th className="text-right text-[#4a4a4a] font-mono uppercase tracking-wider text-[11px] py-2 px-2">
              ACTIONS
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#111111]">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-[#111111] transition-colors">
              <td className="py-2 px-2 font-mono text-[#d4d4d4]">
                {item.scheduledTime.slice(0, 5)}
              </td>
              <td className="py-2 px-2 text-white font-mono text-xs">
                {PILLAR_NAMES[item.pillarId] ?? item.pillarId}
              </td>
              <td className="py-2 px-2">
                <span
                  className={`inline-flex px-2 py-0.5 rounded-[2px] border text-[10px] font-mono uppercase ${STATUS_STYLES[item.status] ?? STATUS_STYLES.pending}`}
                >
                  {item.status}
                </span>
              </td>
              <td className="py-2 px-2 text-right">
                <div className="flex items-center justify-end gap-2">
                  {item.postId && (
                    <a
                      href={`/posts/${item.postId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-[#4a4a4a] hover:text-[#808080] transition-colors"
                      title="View post"
                    >
                      <Eye size={13} />
                    </a>
                  )}
                  {(item.status === 'approved' || item.status === 'ready') && (
                    <button
                      onClick={() => handlePublishNow(item.id)}
                      disabled={publishing === item.id}
                      className="flex items-center gap-1 px-2 py-0.5 bg-[#8a00c4]/20 hover:bg-[#8a00c4]/40 border border-[#8a00c4]/40 text-[#c084fc] text-[10px] font-mono rounded-[2px] disabled:opacity-40 transition-colors"
                    >
                      <Send size={10} />
                      {publishing === item.id ? '...' : 'POST!'}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
