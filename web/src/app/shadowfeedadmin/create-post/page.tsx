'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, ListChecks, BarChart2, Zap, ArrowLeft } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

function getAdminToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;)\s*sf-admin-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

const PILLAR_OPTIONS = [
  { id: 'educational-value', name: 'EDUCATIONAL VALUE', contentType: 'Technical value & tutorials', slides: '8-12', time: '09:00' },
  { id: 'wake-up-slap', name: 'WAKE-UP SLAP', contentType: 'Counter-narrative & controversy', slides: '4-6', time: '11:00' },
  { id: 'brand-breakdown', name: 'BRAND BREAKDOWN', contentType: 'Brand strategy analysis', slides: '10-14', time: '14:00' },
  { id: 'proof-social', name: 'PROOF SOCIAL', contentType: 'Results & behind-the-scenes', slides: '6-8', time: '17:00' },
  { id: 'the-offer', name: 'THE OFFER', contentType: 'Direct sale & anchoring', slides: '8-10', time: '20:00' },
];

export default function CreatePostPage() {
  const router = useRouter();
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  const [todayPillar, setTodayPillar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function fetchTodayCadence() {
      try {
        const res = await fetch(`${API_BASE}/api/forge-shadowfeed/cadence/today`, {
          headers: { 'x-sf-admin-token': getAdminToken() },
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          setTodayPillar(data.pillarId ?? null);
        }
      } catch {
        // silently fail — badge just won't show
      }
    }
    fetchTodayCadence();
  }, []);

  const handleGenerate = async () => {
    if (!selectedPillar) return;
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE}/api/forge-shadowfeed/generate-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sf-admin-token': getAdminToken(),
        },
        body: JSON.stringify({ pillarId: selectedPillar }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.message || `Error ${res.status}`);
        return;
      }

      const data = await res.json();
      setSuccessMsg(`\u2713 ${data.generated ?? 1} post(s) generated successfully`);
      setTimeout(() => router.push('/shadowfeedadmin'), 2000);
    } catch {
      setErrorMsg('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
      </nav>

      {/* Back link */}
      <Link
        href="/shadowfeedadmin"
        className="inline-flex items-center gap-1.5 text-[#808080] hover:text-white text-xs font-mono transition-colors mb-6"
      >
        <ArrowLeft size={12} />
        Back to Dashboard
      </Link>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-white font-mono font-bold text-lg">CREATE NEW POST</h1>
        <p className="text-[#4a4a4a] text-sm font-mono mt-1">Select a content pillar to generate</p>
      </div>

      {/* Pillar cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {PILLAR_OPTIONS.map((pillar) => (
          <button
            key={pillar.id}
            type="button"
            onClick={() => setSelectedPillar(pillar.id)}
            className={`text-left bg-[#111111] border rounded-[3px] p-5 cursor-pointer transition-colors ${
              selectedPillar === pillar.id
                ? 'border-[#8a00c4] bg-[#8a00c4]/10'
                : 'border-[#1e1e1e] hover:border-[#2a2a2a]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-white font-mono font-bold text-sm">{pillar.name}</span>
              {todayPillar === pillar.id && (
                <span className="bg-[#8a00c4]/20 text-[#c084fc] text-[10px] font-mono px-2 py-0.5 rounded-[3px]">
                  TODAY&apos;S PICK
                </span>
              )}
            </div>
            <div className="text-[#808080] text-xs font-mono mt-2">{pillar.contentType}</div>
            <div className="text-[#4a4a4a] text-xs font-mono mt-1">{pillar.slides} slides</div>
            <div className="text-[#c084fc] text-xs font-mono mt-1">{pillar.time}</div>
          </button>
        ))}
      </div>

      {/* Generate button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleGenerate}
          disabled={!selectedPillar || loading}
          className="flex items-center gap-2 bg-[#8a00c4] hover:bg-[#7a00b4] disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono font-bold text-sm px-6 py-2.5 rounded-[3px] border border-[#8a00c4]/50 transition-colors"
        >
          <Zap size={14} className={loading ? 'animate-pulse' : ''} />
          {loading ? 'GENERATING...' : 'GENERATE'}
        </button>

        {successMsg && (
          <span className="text-[#4ade80] text-sm font-mono">{successMsg}</span>
        )}

        {errorMsg && (
          <span className="text-[#f87171] text-sm font-mono">{errorMsg}</span>
        )}
      </div>
    </div>
  );
}
