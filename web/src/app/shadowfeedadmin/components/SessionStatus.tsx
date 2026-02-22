'use client';

import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface SessionStatusProps {
  connected: boolean;
  lastChecked?: string;
  expiresAt?: string;
  onRefresh?: () => void;
}

export function SessionStatus({ connected, lastChecked, expiresAt, onRefresh }: SessionStatusProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const fmt = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded-[3px] border text-xs font-mono ${
          connected
            ? 'bg-[#001a05] text-[#4ade80] border-[#4ade80]/30'
            : 'bg-[#1a0000] text-[#f87171] border-[#f87171]/30'
        }`}
      >
        {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
        <span>IG {connected ? 'CONNECTED' : 'DISCONNECTED'}</span>
      </div>

      {lastChecked && (
        <span className="text-[#4a4a4a] text-xs">checked {fmt(lastChecked)}</span>
      )}

      {expiresAt && connected && (
        <span className="text-[#4a4a4a] text-xs">expires {fmt(expiresAt)}</span>
      )}

      {onRefresh && (
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-1 text-[#4a4a4a] hover:text-[#808080] disabled:opacity-40"
          title="Refresh session status"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
        </button>
      )}
    </div>
  );
}
