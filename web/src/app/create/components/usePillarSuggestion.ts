import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

type PillarId = 'educate' | 'provoke' | 'prove' | 'connect' | 'convert';

const ALL_PILLAR_IDS: PillarId[] = ['educate', 'provoke', 'prove', 'connect', 'convert'];

interface UserProfile {
  primary_goal?: string;
}

export function usePillarSuggestion(userId: string | undefined): string | null {
  const [suggested, setSuggested] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    async function computeSuggestion() {
      // Fetch last 10 posts with pillar_id
      const { data: posts } = await supabase
        .from('carousel_posts')
        .select('pillar_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch user profile for primary_goal
      const { data: profile } = await supabase
        .from('users')
        .select('primary_goal')
        .eq('id', userId)
        .single() as { data: UserProfile | null };

      if (!posts || posts.length === 0) {
        setSuggested('educate');
        return;
      }

      const pillarHistory = posts
        .map((p) => p.pillar_id as PillarId)
        .filter(Boolean);

      // Rule 1: Last 3 posts same pillar → suggest different
      if (pillarHistory.length >= 3) {
        const lastThree = pillarHistory.slice(0, 3);
        if (lastThree.every((p) => p === lastThree[0])) {
          const others = ALL_PILLAR_IDS.filter((id) => id !== lastThree[0]);
          setSuggested(others[Math.floor(Math.random() * others.length)]);
          return;
        }
      }

      const now = new Date();
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

      const recentPosts = posts.filter(
        (p) => new Date(p.created_at) >= fourteenDaysAgo
      );
      const recentPillars = recentPosts
        .map((p) => p.pillar_id as PillarId)
        .filter(Boolean);

      // Rule 2: No CONVERT in 14 days AND primary_goal includes sales → suggest CONVERT
      const hasConvertRecently = recentPillars.includes('convert');
      const hasSalesGoal = profile?.primary_goal?.toLowerCase().includes('sales') ||
        profile?.primary_goal?.toLowerCase().includes('vend');
      if (!hasConvertRecently && hasSalesGoal) {
        setSuggested('convert');
        return;
      }

      // Rule 3: No PROVE in 10 days → suggest PROVE
      const tenDayPosts = posts.filter(
        (p) => new Date(p.created_at) >= tenDaysAgo
      );
      const tenDayPillars = tenDayPosts
        .map((p) => p.pillar_id as PillarId)
        .filter(Boolean);
      if (!tenDayPillars.includes('prove')) {
        setSuggested('prove');
        return;
      }

      // Rule 4: Default — suggest least-used pillar in last 14 days
      const counts: Record<PillarId, number> = {
        educate: 0,
        provoke: 0,
        prove: 0,
        connect: 0,
        convert: 0,
      };
      for (const p of recentPillars) {
        if (counts[p] !== undefined) counts[p]++;
      }
      const leastUsed = ALL_PILLAR_IDS.reduce((min, id) =>
        counts[id] < counts[min] ? id : min
      );
      setSuggested(leastUsed);
    }

    computeSuggestion();
  }, [userId]);

  return suggested;
}
