import { z } from 'zod';
import { gemini } from '../../config/gemini.js';
import type { PillarId } from '../../shared/types/pillar.types.js';

// ─── Types ───────────────────────────────────────────────────

export type PillarScores = Record<PillarId, number>;

const PILLAR_DESCRIPTIONS: Record<PillarId, string> = {
  educate: 'Teach something valuable and actionable — tutorials, frameworks, data, how-to',
  provoke: 'Challenge beliefs with surprising data — myths, controversies, unpopular opinions',
  prove: 'Show tangible results with evidence — case studies, before/after, metrics',
  connect: 'Create emotional identification — struggles, behind-scenes, relatable moments',
  convert: 'Present offers as natural solutions — comparisons, ROI data, objection-breakers',
};

const PillarScoresSchema = z.object({
  educate: z.number().min(0).max(10),
  provoke: z.number().min(0).max(10),
  prove: z.number().min(0).max(10),
  connect: z.number().min(0).max(10),
  convert: z.number().min(0).max(10),
});

// ─── Task 2: In-Memory LRU Cache ────────────────────────────

class PillarClassificationCache {
  private cache = new Map<string, { scores: PillarScores; timestamp: number }>();
  private readonly maxSize = 500;
  private readonly ttlMs = 72 * 60 * 60 * 1000; // 72h

  get(key: string): PillarScores | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }
    // Move to end for LRU
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.scores;
  }

  set(key: string, scores: PillarScores): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Delete oldest entry (first in Map = LRU)
      const oldest = this.cache.keys().next().value;
      if (oldest) this.cache.delete(oldest);
    }
    this.cache.set(key, { scores, timestamp: Date.now() });
  }

  get size(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
  }
}

// ─── Task 3: Daily Rate Limiter ─────────────────────────────

class DailyGeminiLimiter {
  private counts = new Map<string, { count: number; date: string }>();
  private readonly maxPerDay = 5;

  canCall(userId: string): boolean {
    const today = new Date().toISOString().slice(0, 10);
    const entry = this.counts.get(userId);
    if (!entry || entry.date !== today) return true;
    return entry.count < this.maxPerDay;
  }

  record(userId: string): void {
    const today = new Date().toISOString().slice(0, 10);
    const entry = this.counts.get(userId);
    if (!entry || entry.date !== today) {
      this.counts.set(userId, { count: 1, date: today });
    } else {
      entry.count++;
    }
  }

  getCount(userId: string): number {
    const today = new Date().toISOString().slice(0, 10);
    const entry = this.counts.get(userId);
    if (!entry || entry.date !== today) return 0;
    return entry.count;
  }
}

// ─── Singletons ─────────────────────────────────────────────

const pillarCache = new PillarClassificationCache();
const geminiLimiter = new DailyGeminiLimiter();

// Exported for testing
export { PillarClassificationCache, DailyGeminiLimiter, pillarCache, geminiLimiter };

// ─── Task 4: Heuristic Fallback ─────────────────────────────

const PILLAR_KEYWORDS: Record<PillarId, string[]> = {
  educate: ['tutorial', 'guide', 'how-to', 'how to', 'framework', 'step', 'learn', 'tips', 'teach', 'lesson', 'course', 'explain', 'understand'],
  provoke: ['myth', 'wrong', 'mistake', 'controversy', 'unpopular', 'truth', 'lie', 'debunk', 'challenge', 'disagree', 'controversial', 'surprising'],
  prove: ['case study', 'results', 'before', 'after', 'revenue', 'growth', 'metrics', 'data', 'evidence', 'proof', 'roi', 'outcome'],
  connect: ['struggle', 'journey', 'behind', 'story', 'honest', 'real', 'vulnerable', 'personal', 'emotion', 'feel', 'relate', 'human'],
  convert: ['compare', 'versus', 'roi', 'cost', 'pricing', 'alternative', 'switch', 'buy', 'offer', 'deal', 'discount', 'solution'],
};

function countMatches(text: string, keywords: string[]): number {
  let count = 0;
  for (const kw of keywords) {
    if (text.includes(kw)) count++;
  }
  return count;
}

export function heuristicPillarScores(title: string, summary: string | null): PillarScores {
  const text = `${title} ${summary ?? ''}`.toLowerCase();

  const scores: PillarScores = {
    educate: Math.min(countMatches(text, PILLAR_KEYWORDS.educate) * 1.5, 10),
    provoke: Math.min(countMatches(text, PILLAR_KEYWORDS.provoke) * 1.5, 10),
    prove: Math.min(countMatches(text, PILLAR_KEYWORDS.prove) * 1.5, 10),
    connect: Math.min(countMatches(text, PILLAR_KEYWORDS.connect) * 1.5, 10),
    convert: Math.min(countMatches(text, PILLAR_KEYWORDS.convert) * 1.5, 10),
  };

  return scores;
}

// ─── Task 6: Get Pillar Tag ─────────────────────────────────

export function getPillarTag(scores: PillarScores): PillarId {
  let maxPillar: PillarId = 'educate';
  let maxScore = -1;
  for (const [pillar, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxPillar = pillar as PillarId;
    }
  }
  return maxPillar;
}

// ─── Task 1: Gemini Pillar Classification ───────────────────

export async function classifyPillarAlignment(
  title: string,
  summary: string | null,
  userId: string,
  cacheKey?: string
): Promise<PillarScores> {
  const key = cacheKey ?? `${title}`;

  // Check cache first (AC6)
  const cached = pillarCache.get(key);
  if (cached) return cached;

  // Check rate limit (AC9)
  if (!geminiLimiter.canCall(userId)) {
    return heuristicPillarScores(title, summary);
  }

  try {
    const text = `${title}. ${(summary ?? '').slice(0, 200)}`;
    const model = gemini.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const pillarDescriptions = Object.entries(PILLAR_DESCRIPTIONS)
      .map(([id, desc]) => `- ${id}: ${desc}`)
      .join('\n');

    const prompt = `Classify this content against 5 content pillars. Score each 0-10.

Content: "${text}"

Pillars:
${pillarDescriptions}

Return JSON: { "educate": N, "provoke": N, "prove": N, "connect": N, "convert": N }`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);
    const scores = PillarScoresSchema.parse(parsed);

    // Record usage and cache (AC5, AC9)
    geminiLimiter.record(userId);
    pillarCache.set(key, scores);

    return scores;
  } catch {
    // AC11: Gemini error → fallback to heuristic (never blocks pipeline)
    return heuristicPillarScores(title, summary);
  }
}

// ─── Legacy Compatibility ───────────────────────────────────

export function assignPillarTag(
  candidate: { pillar_tag?: PillarId | null; title: string; summary: string | null },
  targetPillar: PillarId
): PillarId {
  if (candidate.pillar_tag) return candidate.pillar_tag;
  return targetPillar;
}
