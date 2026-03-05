'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, MessageCircle, Twitter, Link as LinkIcon, ArrowRight } from 'lucide-react';

export interface DiscoveryCandidate {
  title: string;
  summary: string | null;
  url: string | null;
  source_type: 'google_news' | 'reddit' | 'twitter';
  final_score: number;
  posted_at: string | null;
}

interface DiscoveryCandidatesProps {
  candidates: DiscoveryCandidate[];
  onSelect: (candidate: DiscoveryCandidate) => void;
  onCustomUrl: (url: string) => void;
}

const SOURCE_ICONS: Record<string, typeof Newspaper> = {
  google_news: Newspaper,
  reddit: MessageCircle,
  twitter: Twitter,
};

const SOURCE_LABELS: Record<string, string> = {
  google_news: 'Notícias',
  reddit: 'Reddit',
  twitter: 'Twitter',
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'agora';
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1d atrás';
  return `${days}d atrás`;
}

export function DiscoveryCandidates({ candidates, onSelect, onCustomUrl }: DiscoveryCandidatesProps) {
  const [showCustomUrl, setShowCustomUrl] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  const handleCustomSubmit = () => {
    if (customUrl.trim()) {
      try {
        new URL(customUrl);
        onCustomUrl(customUrl.trim());
      } catch {
        // invalid url — ignore
      }
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-[#808080] text-xs font-mono text-center mb-2">
        Fontes encontradas — selecione uma para gerar seu post
      </p>

      {candidates.map((candidate, i) => {
        const Icon = SOURCE_ICONS[candidate.source_type] || Newspaper;
        const ago = timeAgo(candidate.posted_at);

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => onSelect(candidate)}
            className="p-4 bg-[#0a0a0a] border border-white/10 rounded-[3px] cursor-pointer transition-all hover:border-[#8a00c4] hover:shadow-[0_0_10px_rgba(138,0,196,0.1)] group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/5 rounded-[3px] text-[#808080] group-hover:text-[#c084fc] transition-colors shrink-0">
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[#d4d4d4] text-sm font-bold line-clamp-2 mb-1">{candidate.title}</h3>
                <div className="flex items-center gap-3 text-[10px] font-mono text-[#4a4a4a]">
                  <span className="bg-[#161616] border border-[#2a2a2a] px-1.5 py-0.5 rounded-[3px]">
                    {SOURCE_LABELS[candidate.source_type]}
                  </span>
                  <span className="text-[#8a00c4] font-bold">{candidate.final_score.toFixed(1)}</span>
                  {ago && <span>{ago}</span>}
                </div>
              </div>
              <ArrowRight size={14} className="text-[#4a4a4a] group-hover:text-[#c084fc] mt-1 shrink-0 transition-colors" />
            </div>
          </motion.div>
        );
      })}

      {/* Custom URL fallback */}
      <div className="pt-2 border-t border-[#1e1e1e]">
        {!showCustomUrl ? (
          <button
            onClick={() => setShowCustomUrl(true)}
            className="w-full text-center text-[#808080] hover:text-[#c084fc] text-xs font-mono py-2 transition-colors flex items-center justify-center gap-2"
          >
            <LinkIcon size={12} />
            Colar uma URL personalizada
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2"
          >
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#d4d4d4] px-3 py-2 rounded-[3px] focus:outline-none focus:border-[#8a00c4] font-mono text-sm placeholder-[#4a4a4a]"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
            />
            <button
              onClick={handleCustomSubmit}
              disabled={!customUrl.trim()}
              className="w-full bg-[#d4d4d4] text-[#050505] font-bold py-2 rounded-[3px] hover:bg-white transition-all uppercase tracking-wide text-xs font-mono disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Usar Esta URL
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
