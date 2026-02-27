'use client';

import { GraduationCap, Zap, TrendingUp, Heart, Target } from 'lucide-react';

export interface PillarDisplayConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  slideRange: { min: number; max: number };
  ctaStyle: string;
}

const ICON_MAP: Record<string, typeof Zap> = {
  GraduationCap,
  Zap,
  TrendingUp,
  Heart,
  Target,
};

interface PillarSelectorProps {
  pillars: PillarDisplayConfig[];
  selectedPillar: string | null;
  suggestedPillarId: string | null;
  onSelect: (pillarId: string) => void;
  loading?: boolean;
}

export function PillarSelector({ pillars, selectedPillar, suggestedPillarId, onSelect, loading }: PillarSelectorProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 bg-[#0a0a0a] border border-[#1e1e1e] rounded-[3px] animate-pulse h-[140px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {pillars.map((pillar) => {
        const Icon = ICON_MAP[pillar.icon] || Zap;
        const isSelected = selectedPillar === pillar.id;
        const isSuggested = suggestedPillarId === pillar.id;

        return (
          <div
            key={pillar.id}
            onClick={() => onSelect(pillar.id)}
            className={`p-4 bg-[#0a0a0a] border rounded-[3px] cursor-pointer transition-all group hover:border-[#8a00c4] hover:shadow-[0_0_10px_rgba(138,0,196,0.1)] relative overflow-hidden ${
              isSelected
                ? 'border-[#8a00c4] bg-[#8a00c4]/5 shadow-[0_0_10px_rgba(138,0,196,0.15)] ring-1 ring-[#8a00c4]'
                : 'border-white/10'
            }`}
          >
            {isSuggested && (
              <div className="absolute top-2 right-2 bg-[#8a00c4]/20 border border-[#8a00c4]/40 px-2 py-0.5 rounded-[3px]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#c084fc]">Suggested</span>
              </div>
            )}

            <div className="flex items-start gap-3 mb-3">
              <div className={`p-2 rounded-[3px] ${isSelected ? 'bg-[#8a00c4]/20 text-[#c084fc]' : 'bg-white/5 text-[#808080] group-hover:text-[#c084fc]'} transition-colors`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[#d4d4d4] font-bold text-sm font-mono">{pillar.name}</h3>
              </div>
            </div>

            <p className="text-[#808080] text-xs mb-3 line-clamp-2">{pillar.description}</p>

            <div className="flex items-center justify-between text-[10px] font-mono text-[#4a4a4a]">
              <span>{pillar.slideRange.min}-{pillar.slideRange.max} slides</span>
              <span className="truncate ml-2 max-w-[120px]">{pillar.ctaStyle.split('/')[0].trim()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
