import { supabase } from '../../config/supabase.js';
import type { PillarId, HookArchetype } from './forge-shadowfeed.types.js';

// ── Hook Archetype Definition ────────────────────────────────────────────────

export interface HookArchetypeDefinition {
  id: HookArchetype;
  structureTemplate: string;
  examples: [string, string, string];
  bestForPillars: PillarId[];
  weight: number;
  description: string;
}

// ── 6 Archetypes (Source: Research §06 — Brand Spy Report) ───────────────────

export const HOOK_ARCHETYPES: HookArchetypeDefinition[] = [
  {
    id: 'direct-controversy',
    structureTemplate: '{fato contraintuitivo} que {grupo} não quer que você saiba',
    examples: [
      'O branding que você aprendeu na faculdade está te sabotando',
      'Agências de marketing lucram mais quando você NÃO cresce',
      'Seu logo não vale nada — e nenhum designer vai te contar isso',
    ],
    bestForPillars: ['wake-up-slap', 'educational-value'],
    weight: 0.15,
    description: 'Afirmação controversa que desafia crença popular. Gera tensão imediata ao atacar algo aceito como verdade pelo público.',
  },
  {
    id: 'specific-number',
    structureTemplate: '{X} coisas que {consequência negativa}',
    examples: [
      '7 erros que destroem o alcance do seu perfil',
      '3 métricas que todo mundo olha — e que não servem pra nada',
      '5 posts que marcas de milhões nunca publicam',
    ],
    bestForPillars: ['educational-value', 'brand-breakdown'],
    weight: 0.25,
    description: 'Dado numérico específico que choca. O número concreto cria expectativa de lista e promete conteúdo tangível e escaneável.',
  },
  {
    id: 'transformative-promise',
    structureTemplate: 'Como {pessoa} fez {resultado impossível} em {tempo curto}',
    examples: [
      'Como uma marca desconhecida fez R$200k em 90 dias sem tráfego pago',
      'Como um perfil de 800 seguidores vendeu mais que influencers de 500k',
      'Como uma loja de bairro virou referência nacional em 6 meses',
    ],
    bestForPillars: ['proof-social', 'brand-breakdown'],
    weight: 0.15,
    description: 'Resultado concreto prometido sem guru-speak. Prova social embutida que demonstra transformação real e mensurável.',
  },
  {
    id: 'polarization',
    structureTemplate: '{declaração que divide opiniões}',
    examples: [
      'Conteúdo de valor é a maior mentira do marketing digital',
      'Se você posta todo dia, está desperdiçando tempo',
      'Engajamento alto não significa que você vai vender',
    ],
    bestForPillars: ['wake-up-slap'],
    weight: 0.15,
    description: 'Divisão clara entre dois grupos. Obriga o leitor a se posicionar — concordar ou discordar — gerando engajamento visceral.',
  },
  {
    id: 'curiosity-mystery',
    structureTemplate: 'O motivo real pelo qual {X} não funciona',
    examples: [
      'O motivo real pelo qual seu conteúdo não converte',
      'Ninguém fala sobre o que realmente faz uma marca crescer',
      'O que as marcas que mais vendem fazem — e escondem de você',
    ],
    bestForPillars: ['educational-value', 'wake-up-slap'],
    weight: 0.15,
    description: 'Informação incompleta que demanda continuação. Cria um gap de curiosidade que só se fecha ao consumir todo o carousel.',
  },
  {
    id: 'brand-comparison',
    structureTemplate: '{Marca A} vs {Marca B}',
    examples: [
      'Nike vs Adidas: a estratégia que separa bilhões de milhões',
      'Nubank vs Itaú: por que um é amado e o outro tolerado',
      'Apple vs Samsung: a diferença não é o produto',
    ],
    bestForPillars: ['brand-breakdown'],
    weight: 0.15,
    description: 'Comparação direta entre marca e mercado. Formato versus naturalmente polariza e contextualiza análise de estratégia.',
  },
];

// ── Weighted Selection with Anti-Repeat (AC2) ───────────────────────────────

const PILLAR_AFFINITY_BOOST = 1.5;

const CADENCE_PREFERRED_BOOST = 1.3;

export function selectHookArchetype(
  pillarId: PillarId,
  recentArchetypes: HookArchetype[],
  cadencePreferred?: HookArchetype[],
): HookArchetype {
  // Filter out archetypes used in last 2 consecutive posts
  const available = HOOK_ARCHETYPES.filter(
    (a) => !recentArchetypes.includes(a.id),
  );

  // If somehow all are excluded (shouldn't happen with 6 archetypes and max 2 excluded),
  // fall back to full list
  const pool = available.length > 0 ? available : HOOK_ARCHETYPES;

  // Build weighted pool with pillar affinity boost + cadence preferred boost
  const weighted = pool.map((a) => {
    const affinityMatch = a.bestForPillars.includes(pillarId);
    let adjustedWeight = affinityMatch ? a.weight * PILLAR_AFFINITY_BOOST : a.weight;
    if (cadencePreferred?.includes(a.id)) {
      adjustedWeight *= CADENCE_PREFERRED_BOOST;
    }
    return { archetype: a, adjustedWeight };
  });

  // Normalize weights
  const totalWeight = weighted.reduce((sum, w) => sum + w.adjustedWeight, 0);
  const normalized = weighted.map((w) => ({
    ...w,
    normalizedWeight: w.adjustedWeight / totalWeight,
  }));

  // Weighted random selection
  const rand = Math.random();
  let cumulative = 0;

  for (const item of normalized) {
    cumulative += item.normalizedWeight;
    if (rand <= cumulative) {
      return item.archetype.id;
    }
  }

  // Fallback (floating point edge case)
  return normalized[normalized.length - 1].archetype.id;
}

// ── Query recent archetypes from queue (for anti-repeat) ─────────────────────

export async function getRecentHookArchetypes(): Promise<HookArchetype[]> {
  const { data, error } = await supabase
    .from('sf_shadowfeed_queue')
    .select('hook_archetype')
    .neq('status', 'failed')
    .not('hook_archetype', 'is', null)
    .order('created_at', { ascending: false })
    .limit(2);

  if (error || !data) return [];

  return data
    .map((row: { hook_archetype: string | null }) => row.hook_archetype)
    .filter((v): v is HookArchetype => v !== null);
}

// ── Get archetype definition by ID ───────────────────────────────────────────

export function getArchetypeDefinition(id: HookArchetype): HookArchetypeDefinition | undefined {
  return HOOK_ARCHETYPES.find((a) => a.id === id);
}

// ── Visual signature prefix (FR-HOOK-08, ~30%) ──────────────────────────────

export function shouldAddVisualSignature(): boolean {
  return Math.random() < 0.3;
}

// ── Hook archetype usage stats (AC6) ─────────────────────────────────────────

export interface HookArchetypeUsageStats {
  id: HookArchetype;
  description: string;
  weight: number;
  bestForPillars: PillarId[];
  usageLast30Days: number;
}

export async function getHookArchetypeStats(): Promise<HookArchetypeUsageStats[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since = thirtyDaysAgo.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('sf_shadowfeed_queue')
    .select('hook_archetype')
    .gte('scheduled_date', since)
    .neq('status', 'failed')
    .not('hook_archetype', 'is', null);

  // Count per archetype
  const counts: Record<string, number> = {};
  if (!error && data) {
    for (const row of data) {
      const key = (row as { hook_archetype: string }).hook_archetype;
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }

  return HOOK_ARCHETYPES.map((a) => ({
    id: a.id,
    description: a.description,
    weight: a.weight,
    bestForPillars: a.bestForPillars,
    usageLast30Days: counts[a.id] ?? 0,
  }));
}
