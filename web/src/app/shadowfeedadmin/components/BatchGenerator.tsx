'use client';

import { Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

function getAdminToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;)\s*sf-admin-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

interface BatchResult {
  success: boolean;
  generated: number;
  failed: number;
}

interface BatchGeneratorProps {
  onComplete?: () => void;
}

export function BatchGenerator({ onComplete }: BatchGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/forge-shadowfeed/generate-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sf-admin-token': getAdminToken(),
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || `Error ${res.status}`);
        return;
      }

      const data: BatchResult = await res.json();
      setResult(data);
      onComplete?.();
    } catch {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-[#8a00c4] hover:bg-[#7a00b4] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-mono font-bold rounded-[3px] border border-[#8a00c4]/50 transition-colors"
      >
        <Zap size={14} className={loading ? 'animate-pulse' : ''} />
        {loading ? 'GENERATING...' : 'GENERATE NEXT BATCH'}
      </button>

      {result && (
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <CheckCircle size={12} className="text-[#4ade80]" />
          <span className="text-[#4ade80]">
            {result.generated} generated
            {result.failed > 0 && (
              <span className="text-[#f87171] ml-2">{result.failed} failed</span>
            )}
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <AlertCircle size={12} className="text-[#f87171]" />
          <span className="text-[#f87171]">{error}</span>
        </div>
      )}
    </div>
  );
}
