import type { HookArchetypeId, PillarConfig } from '../../shared/types/pillar.types.js';
import type { UserProfile } from '../../shared/types/post-themes.types.js';
import type { SupabaseClient } from '@supabase/supabase-js';

// ── Hook Archetype Definitions (PRD §11.1) ──────────────────────────────────

export interface HookArchetype {
  id: HookArchetypeId;
  name: string;
  template: string;
  example: string;
  description: string;
  variableKeys: (keyof HookVariableMap)[];
}

interface HookVariableMap {
  counterIntuitiveFact: string;
  group: string;
  concept: string;
  consequence: string;
  person: string;
  result: string;
  shortTime: string;
  statement: string;
  topic: string;
  concreteResult: string;
}

const HOOK_ARCHETYPES: Record<HookArchetypeId, HookArchetype> = {
  'direct-controversy': {
    id: 'direct-controversy',
    name: 'Direct Controversy',
    template: '{counterIntuitiveFact} that {group} doesn\'t want you to know',
    example: '"The productivity hack that top executives don\'t want you to know"',
    description: 'Opens with a counter-intuitive fact that challenges conventional wisdom, creating immediate tension and curiosity.',
    variableKeys: ['counterIntuitiveFact', 'group'],
  },
  'specific-number': {
    id: 'specific-number',
    name: 'Specific Number',
    template: '{concept} things that {consequence}',
    example: '"7 habits that are silently killing your business growth"',
    description: 'Uses a specific number to promise concrete, listable value, triggering completionism bias.',
    variableKeys: ['concept', 'consequence'],
  },
  'transformative-promise': {
    id: 'transformative-promise',
    name: 'Transformative Promise',
    template: 'How {person} achieved {result} in {shortTime}',
    example: '"How a freelancer went from $2K to $15K/month in 90 days"',
    description: 'Presents a specific transformation story that makes the reader think "that could be me".',
    variableKeys: ['person', 'result', 'shortTime'],
  },
  'polarization': {
    id: 'polarization',
    name: 'Polarization',
    template: '{statement}',
    example: '"If you\'re still using funnels in 2026, you\'ve already lost"',
    description: 'Makes a bold statement that divides the audience — people either strongly agree or disagree, driving comments.',
    variableKeys: ['statement'],
  },
  'curiosity-mystery': {
    id: 'curiosity-mystery',
    name: 'Curiosity Mystery',
    template: 'The real reason why {topic} doesn\'t work',
    example: '"The real reason why your content strategy isn\'t getting results"',
    description: 'Creates an information gap the reader must close by swiping, leveraging curiosity bias.',
    variableKeys: ['topic'],
  },
  'social-proof': {
    id: 'social-proof',
    name: 'Social Proof',
    template: '{concreteResult} — and how to replicate it',
    example: '"10,000 followers in 60 days — and how to replicate it"',
    description: 'Leads with a verified result, making the reader want to know the method behind it.',
    variableKeys: ['concreteResult'],
  },
};

// ── Personalized Variable Mapping (PRD §11.2) ──────────────────────────────

function fb(value: string | null | undefined, fallback: string): string {
  return value && value.trim() ? value : fallback;
}

function deriveVariables(archetype: HookArchetype, profile: UserProfile): HookVariableMap {
  const niche = fb(profile.niche, 'your industry');
  const audience = fb(profile.target_audience, 'professionals');
  const frustration = fb(profile.audience_frustration, 'common challenges');
  const desire = fb(profile.audience_desire, 'growth and success');
  const transformAfter = fb(profile.transformation_after, 'extraordinary results');
  const pillars = profile.content_pillars?.length ? profile.content_pillars[0] : niche;

  return {
    counterIntuitiveFact: `The hidden truth about ${niche}`,
    group: audience,
    concept: pillars,
    consequence: frustration,
    person: audience,
    result: transformAfter,
    shortTime: '30 days',
    statement: `If you're still ignoring ${niche} fundamentals, you're already behind`,
    topic: `${niche} for ${audience}`,
    concreteResult: desire,
  };
}

export function populateHookVariables(archetype: HookArchetype, profile: UserProfile): string {
  const variables = deriveVariables(archetype, profile);
  let filled = archetype.template;

  for (const key of archetype.variableKeys) {
    filled = filled.replace(`{${key}}`, variables[key]);
  }

  return filled;
}

// ── Selection Algorithm (PRD §11.3) ─────────────────────────────────────────

export async function selectHookArchetype(
  pillarConfig: PillarConfig,
  userId: string,
  supabaseClient: SupabaseClient,
): Promise<HookArchetype> {
  // 1. Get all archetype IDs
  const allIds = Object.keys(HOOK_ARCHETYPES) as HookArchetypeId[];

  // 2. Query user's last 2 posts' hook_archetype for anti-repeat
  const recentlyUsed = await getRecentHookArchetypes(userId, supabaseClient);

  // 3. Build weighted list: base weight × pillar affinity boost, exclude recent
  const weighted: { archetype: HookArchetype; weight: number }[] = [];

  for (const id of allIds) {
    if (recentlyUsed.includes(id)) continue; // Anti-repeat: skip last 2

    const boost = pillarConfig.hookAffinityBoost[id] ?? 1.0;
    const weight = 1.0 * boost; // base weight (1.0) × pillar affinity

    if (weight > 0) {
      weighted.push({ archetype: HOOK_ARCHETYPES[id], weight });
    }
  }

  // Fallback: if all excluded (edge case), use all with weights
  if (weighted.length === 0) {
    for (const id of allIds) {
      const boost = pillarConfig.hookAffinityBoost[id] ?? 1.0;
      weighted.push({ archetype: HOOK_ARCHETYPES[id], weight: 1.0 * boost });
    }
  }

  // 4. Weighted random selection
  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;

  for (const entry of weighted) {
    random -= entry.weight;
    if (random <= 0) return entry.archetype;
  }

  // Should never reach here, but return last as safety
  return weighted[weighted.length - 1].archetype;
}

async function getRecentHookArchetypes(
  userId: string,
  supabaseClient: SupabaseClient,
): Promise<HookArchetypeId[]> {
  const { data, error } = await supabaseClient
    .from('sf_posts')
    .select('hook_archetype')
    .eq('user_id', userId)
    .not('hook_archetype', 'is', null)
    .order('created_at', { ascending: false })
    .limit(2);

  if (error || !data) return [];

  return data
    .map((row: { hook_archetype: string | null }) => row.hook_archetype)
    .filter((id): id is HookArchetypeId => id !== null);
}

// ── Exports ─────────────────────────────────────────────────────────────────

export function getHookArchetype(id: HookArchetypeId): HookArchetype {
  return HOOK_ARCHETYPES[id];
}

export function getAllHookArchetypes(): HookArchetype[] {
  return Object.values(HOOK_ARCHETYPES);
}
