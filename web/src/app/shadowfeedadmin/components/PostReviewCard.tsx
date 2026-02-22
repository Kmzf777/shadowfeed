'use client';

import { Eye, Edit2, Check, X, Save } from 'lucide-react';
import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

function getAdminToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;)\s*sf-admin-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

type QueueStatus = 'pending' | 'generating' | 'ready' | 'approved' | 'posting' | 'posted' | 'failed';
type PillarId = 'wake-up-slap' | 'proof-of-machine' | 'shadow-school' | 'the-offer';

interface PostReviewCardProps {
  id: string;
  pillarId: PillarId;
  scheduledDate: string;
  scheduledTime: string;
  status: QueueStatus;
  themeUsed: string;
  templateUsed: string | null;
  slideRange: string;
  onStatusChange?: () => void;
}

const PILLAR_NAMES: Record<PillarId, string> = {
  'wake-up-slap': 'TAPA NA CARA',
  'proof-of-machine': 'PROVA DA MÁQUINA',
  'shadow-school': 'ESCOLA SHADOW',
  'the-offer': 'A OFERTA',
};

const PILLAR_COLORS: Record<PillarId, string> = {
  'wake-up-slap':    'border-l-[#f87171]',
  'proof-of-machine':'border-l-[#818cf8]',
  'shadow-school':   'border-l-[#34d399]',
  'the-offer':       'border-l-[#f59e0b]',
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

// Simple preview modal — shows queue item metadata in terminal style
function PreviewModal({
  isOpen,
  onClose,
  item,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: PostReviewCardProps;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#111111] border border-[#2a2a2a] rounded-[3px] p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[#8a00c4] font-mono text-xs uppercase tracking-widest">
            QUEUE ITEM PREVIEW
          </span>
          <button
            onClick={onClose}
            className="p-1 text-[#4a4a4a] hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 font-mono text-sm">
          <div className="flex justify-between">
            <span className="text-[#4a4a4a] text-xs">PILLAR</span>
            <span className="text-white">{PILLAR_NAMES[item.pillarId]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#4a4a4a] text-xs">DATE</span>
            <span className="text-[#d4d4d4]">
              {item.scheduledDate} @ {item.scheduledTime.slice(0, 5)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#4a4a4a] text-xs">THEME</span>
            <span className="text-[#d4d4d4]">{item.themeUsed}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#4a4a4a] text-xs">TEMPLATE</span>
            <span className="text-[#d4d4d4] text-right max-w-[220px] truncate">
              {item.templateUsed ?? '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#4a4a4a] text-xs">SLIDES</span>
            <span className="text-[#d4d4d4]">{item.slideRange}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#4a4a4a] text-xs">STATUS</span>
            <span
              className={`inline-flex px-2 py-0.5 rounded-[2px] border text-[10px] uppercase ${STATUS_STYLES[item.status]}`}
            >
              {item.status}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2 bg-[#161616] border border-[#2a2a2a] text-[#808080] hover:text-white text-xs font-mono rounded-[3px] transition-colors"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}

export function PostReviewCard(props: PostReviewCardProps) {
  const { id, pillarId, scheduledDate, scheduledTime, status, themeUsed, templateUsed, slideRange, onStatusChange } = props;

  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingCaption, setEditingCaption] = useState(false);
  const [caption, setCaption] = useState('');
  const [savingCaption, setSavingCaption] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleSaveCaption = async () => {
    setSavingCaption(true);
    try {
      await fetch(`${API_BASE}/api/forge-shadowfeed/queue/${id}/caption`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-sf-admin-token': getAdminToken(),
        },
        body: JSON.stringify({ caption }),
      });
      setEditingCaption(false);
    } finally {
      setSavingCaption(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await fetch(`${API_BASE}/api/forge-shadowfeed/queue/${id}/approve`, {
        method: 'PUT',
        headers: { 'x-sf-admin-token': getAdminToken() },
      });
      onStatusChange?.();
    } finally {
      setConfirming(false);
    }
  };

  const pillarColor = PILLAR_COLORS[pillarId] ?? 'border-l-[#8a00c4]';

  return (
    <>
      <PreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        item={props}
      />

      <div
        className={`bg-[#111111] border border-[#1e1e1e] border-l-2 ${pillarColor} rounded-[3px] p-4`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-white text-xs font-mono font-bold">
              {PILLAR_NAMES[pillarId] ?? pillarId}
            </div>
            <div className="text-[#4a4a4a] text-xs font-mono mt-0.5">
              {scheduledDate} @ {scheduledTime.slice(0, 5)}
            </div>
          </div>
          <span
            className={`inline-flex px-2 py-0.5 rounded-[2px] border text-[10px] font-mono uppercase ${STATUS_STYLES[status] ?? STATUS_STYLES.pending}`}
          >
            {status}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-1 mb-3">
          <div className="flex gap-2 text-xs font-mono">
            <span className="text-[#4a4a4a] w-16 shrink-0">THEME</span>
            <span className="text-[#808080] truncate">{themeUsed}</span>
          </div>
          <div className="flex gap-2 text-xs font-mono">
            <span className="text-[#4a4a4a] w-16 shrink-0">HOOK</span>
            <span className="text-[#808080] truncate">{templateUsed ?? '—'}</span>
          </div>
          <div className="flex gap-2 text-xs font-mono">
            <span className="text-[#4a4a4a] w-16 shrink-0">SLIDES</span>
            <span className="text-[#808080]">{slideRange}</span>
          </div>
        </div>

        {/* Caption edit */}
        {editingCaption && (
          <div className="mb-3">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              placeholder="Enter custom caption..."
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] focus:border-[#8a00c4] rounded-[3px] px-3 py-2 text-[#d4d4d4] text-xs font-mono outline-none resize-none"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setPreviewOpen(true)}
            className="flex items-center gap-1 px-2 py-1 bg-[#161616] border border-[#2a2a2a] hover:border-[#3a3a3a] text-[#808080] hover:text-white text-[11px] font-mono rounded-[2px] transition-colors"
          >
            <Eye size={11} />
            preview
          </button>

          {!editingCaption ? (
            <button
              onClick={() => setEditingCaption(true)}
              className="flex items-center gap-1 px-2 py-1 bg-[#161616] border border-[#2a2a2a] hover:border-[#3a3a3a] text-[#808080] hover:text-white text-[11px] font-mono rounded-[2px] transition-colors"
            >
              <Edit2 size={11} />
              edit caption
            </button>
          ) : (
            <>
              <button
                onClick={handleSaveCaption}
                disabled={savingCaption}
                className="flex items-center gap-1 px-2 py-1 bg-[#001a05] border border-[#4ade80]/30 text-[#4ade80] text-[11px] font-mono rounded-[2px] disabled:opacity-40 transition-colors"
              >
                <Save size={11} />
                {savingCaption ? 'saving...' : 'save'}
              </button>
              <button
                onClick={() => setEditingCaption(false)}
                className="flex items-center gap-1 px-2 py-1 bg-[#161616] border border-[#2a2a2a] text-[#808080] text-[11px] font-mono rounded-[2px] transition-colors"
              >
                <X size={11} />
                cancel
              </button>
            </>
          )}

          {status !== 'approved' && status !== 'posted' && (
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="flex items-center gap-1 px-3 py-1 bg-[#8a00c4] hover:bg-[#7a00b4] disabled:opacity-40 text-white text-[11px] font-mono font-bold rounded-[2px] ml-auto transition-colors"
            >
              <Check size={11} />
              {confirming ? '...' : 'CONFIRM'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
