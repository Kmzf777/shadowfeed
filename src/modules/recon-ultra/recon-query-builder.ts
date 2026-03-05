import { createHash } from 'crypto';
import { z } from 'zod';
import { gemini } from '../../config/gemini.js';
import { logger } from '../../config/logger.js';
import { supabase } from '../../config/supabase.js';
import { getPillarConfig } from '../pillar-system/pillar.service.js';
import type { PillarConfig, PillarId } from '../../shared/types/pillar.types.js';

// ── Zod Schema ─────────────────────────────────────────────────
const QueryOutputSchema = z.object({
  queries: z.array(z.string().min(3).max(80)).min(3).max(7),
});

// ── Types ──────────────────────────────────────────────────────
interface UserProfileFields {
  // V2 fields
  niche?: string | null;
  target_audience?: string | null;
  audience_frustration?: string | null;
  audience_desire?: string | null;
  expertise_statement?: string | null;
  content_pillars?: string[] | null;
  avoid_topics?: string | null;
  // V1 fields
  main_pain_point?: string | null;
  user_prompt?: string | null;
  setup_completed?: boolean;
}

// ── Profile Hash ───────────────────────────────────────────────
export function computeProfileHash(profile: UserProfileFields): string {
  const key = [
    profile.niche ?? '',
    profile.target_audience ?? '',
    profile.audience_frustration ?? '',
    profile.audience_desire ?? '',
    (profile.content_pillars ?? []).join(','),
  ].join('|');
  return createHash('sha256').update(key).digest('hex');
}

// ── Cache: Check ───────────────────────────────────────────────
async function getCachedQueries(
  userId: string,
  pillarId: string,
  profileHash: string
): Promise<string[] | null> {
  const { data, error } = await supabase
    .from('sf_recon_query_cache')
    .select('queries, profile_hash, expires_at')
    .eq('user_id', userId)
    .eq('pillar_id', pillarId)
    .single();

  if (error || !data) return null;

  // Check profile hash match
  if (data.profile_hash !== profileHash) return null;

  // Check expiry
  const expiresAt = new Date(data.expires_at);
  if (expiresAt <= new Date()) return null;

  return data.queries as string[];
}

// ── Cache: Store ───────────────────────────────────────────────
async function cacheQueries(
  userId: string,
  pillarId: string,
  queries: string[],
  profileHash: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('sf_recon_query_cache')
    .upsert(
      {
        user_id: userId,
        pillar_id: pillarId,
        queries,
        profile_hash: profileHash,
        expires_at: expiresAt,
      },
      { onConflict: 'user_id,pillar_id' }
    );

  if (error) {
    logger.error(
      { error: error.message, userId, pillarId },
      '[RECON-QUERY] Failed to cache queries'
    );
  }
}

// ── Gemini Prompt ──────────────────────────────────────────────
function buildSystemPrompt(
  profile: UserProfileFields,
  pillar: PillarConfig
): string {
  const angleCount = pillar.queryAngles.length;
  const angleList = pillar.queryAngles
    .map((angle, i) => `  ${i + 1}. ${angle}`)
    .join('\n');

  const avoidLine = profile.avoid_topics
    ? `- NEVER include topics related to: ${profile.avoid_topics}`
    : '';

  return `You are a content research query generator for a ${profile.niche ?? 'general'} professional.
Target audience: ${profile.target_audience ?? 'Not specified'}
Their main frustration: ${profile.audience_frustration ?? 'Not specified'}
Their desire: ${profile.audience_desire ?? 'Not specified'}
Expert positioning: ${profile.expertise_statement ?? 'Not specified'}

Generate exactly ${angleCount} search queries for finding ${pillar.name} content.
Each query must target one of these angles:
${angleList}

RULES:
- Max 10 words per query
- English only
- No quotes or special characters
- Prefer queries that return data-rich, actionable content
- Avoid: press releases, product announcements
${avoidLine}

Return JSON: { "queries": ["query1", "query2", ...] }`;
}

function buildUserMessage(
  profile: UserProfileFields,
  pillar: PillarConfig
): string {
  const hasV2 = !!(profile.niche && (profile.audience_frustration || profile.audience_desire));
  const angleCount = pillar.queryAngles.length;

  if (hasV2) {
    return `Content creator profile:
- Niche: ${profile.niche}
- Target audience: ${profile.target_audience ?? 'Not specified'}
- Audience frustration: ${profile.audience_frustration ?? 'Not specified'}
- Audience desire: ${profile.audience_desire ?? 'Not specified'}
- Content pillars: ${(profile.content_pillars ?? []).join(', ') || 'Not specified'}

Pillar: ${pillar.name} — ${pillar.description}
Query angles to cover: ${pillar.queryAngles.join(', ')}

Generate ${angleCount} diverse search queries aligned to the "${pillar.name}" pillar for this creator's audience.`;
  }

  // V1 fallback
  return `Content creator profile:
- Target audience: ${profile.target_audience ?? 'Not specified'}
- Main pain point: ${profile.main_pain_point ?? 'Not specified'}
- Business context: ${profile.user_prompt ?? 'Not specified'}

Pillar: ${pillar.name} — ${pillar.description}
Query angles to cover: ${pillar.queryAngles.join(', ')}

Generate ${angleCount} diverse search queries aligned to the "${pillar.name}" pillar for this creator's audience.`;
}

// ── Fallback Queries ───────────────────────────────────────────
function buildFallbackQueries(
  profile: UserProfileFields,
  pillar: PillarConfig
): string[] {
  const base = profile.niche || profile.target_audience || 'content';
  return pillar.queryAngles.slice(0, 3).map(
    (angle) => `${base} ${angle}`
  );
}

// ── Main Function ──────────────────────────────────────────────
export async function generateReconQueries(
  userId: string,
  pillarId: PillarId
): Promise<string[]> {
  const pillarConfig = getPillarConfig(pillarId);

  // 1. Load user profile
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !userProfile) {
    throw new Error('[RECON-QUERY] User profile not found');
  }

  const profile = userProfile as UserProfileFields;

  // 2. Determine V2 vs V1 fields
  const hasV2 = !!(profile.niche && (profile.audience_frustration || profile.audience_desire));
  const hasV1 = !!(profile.target_audience && profile.main_pain_point);

  if (!hasV2 && !hasV1) {
    throw new Error('[RECON-QUERY] User profile incomplete: complete setup before generating queries');
  }

  // 3. Compute profile hash
  const profileHash = computeProfileHash(profile);

  // 4. Check cache
  const cached = await getCachedQueries(userId, pillarId, profileHash);
  if (cached) {
    logger.info(
      { userId, pillarId, queriesCount: cached.length },
      '[RECON-QUERY] Cache hit — returning cached queries'
    );
    return cached;
  }

  // 5. Call Gemini
  try {
    const model = gemini.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 512,
      },
    });

    const result = await model.generateContent({
      systemInstruction: buildSystemPrompt(profile, pillarConfig),
      contents: [{ role: 'user', parts: [{ text: buildUserMessage(profile, pillarConfig) }] }],
    });

    const raw = result.response.text();
    const parsed = JSON.parse(raw);
    const validated = QueryOutputSchema.parse(parsed);

    // Ensure exact count matches queryAngles.length
    const queries = validated.queries.slice(0, pillarConfig.queryAngles.length);

    // Validate no avoid_topics terms in queries
    if (profile.avoid_topics) {
      const avoidTerms = profile.avoid_topics.toLowerCase().split(',').map((t) => t.trim());
      const filtered = queries.filter(
        (q) => !avoidTerms.some((term) => q.toLowerCase().includes(term))
      );
      if (filtered.length < queries.length) {
        logger.warn(
          { removed: queries.length - filtered.length },
          '[RECON-QUERY] Removed queries containing avoid_topics terms'
        );
      }
    }

    logger.info(
      { userId, pillarId, queriesCount: queries.length },
      '[RECON-QUERY] Queries generated via Gemini'
    );

    // 6. Cache queries
    await cacheQueries(userId, pillarId, queries, profileHash);

    return queries;
  } catch (err) {
    logger.error(
      { error: (err as Error).message, userId, pillarId },
      '[RECON-QUERY] Gemini query generation failed — using fallback'
    );

    const fallback = buildFallbackQueries(profile, pillarConfig);
    return fallback;
  }
}
