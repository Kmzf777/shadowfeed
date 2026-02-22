'use client';

import { CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';

type QueueStatus = 'pending' | 'generating' | 'ready' | 'approved' | 'posting' | 'posted' | 'failed';
type PillarId = 'wake-up-slap' | 'proof-of-machine' | 'shadow-school' | 'the-offer';

interface RecentPostItem {
  id: string;
  pillarId: PillarId;
  scheduledDate: string;
  scheduledTime: string;
  status: QueueStatus;
  themeUsed: string;
}

const PILLAR_NAMES: Record<PillarId, string> = {
  'wake-up-slap': 'TAPA NA CARA',
  'proof-of-machine': 'PROVA DA MÁQUINA',
  'shadow-school': 'ESCOLA SHADOW',
  'the-offer': 'A OFERTA',
};

function StatusIcon({ status }: { status: QueueStatus }) {
  if (status === 'posted') return <CheckCircle2 size={12} className="text-[#4ade80]" />;
  if (status === 'failed') return <XCircle size={12} className="text-[#f87171]" />;
  if (status === 'generating' || status === 'posting')
    return <Loader2 size={12} className="text-[#38bdf8] animate-spin" />;
  return <Clock size={12} className="text-[#f59e0b]" />;
}

interface RecentPostsProps {
  items: RecentPostItem[];
}

export function RecentPosts({ items }: RecentPostsProps) {
  if (items.length === 0) {
    return (
      <div className="text-[#4a4a4a] text-sm font-mono text-center py-4">
        NO RECENT POSTS
      </div>
    );
  }

  const fmtDate = (date: string, time: string) => {
    const d = new Date(`${date}T${time}`);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-1">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 py-1.5 px-2 hover:bg-[#111111] rounded-[2px] transition-colors"
        >
          <StatusIcon status={item.status} />
          <span className="text-[#4a4a4a] text-xs font-mono w-28 shrink-0">
            {fmtDate(item.scheduledDate, item.scheduledTime)}
          </span>
          <span className="text-[#808080] text-xs font-mono truncate">
            {PILLAR_NAMES[item.pillarId] ?? item.pillarId}
          </span>
          <span className="text-[#3a3a3a] text-xs font-mono ml-auto truncate max-w-[140px]">
            {item.themeUsed}
          </span>
        </div>
      ))}
    </div>
  );
}
