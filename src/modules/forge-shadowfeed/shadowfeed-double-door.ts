import type { PillarId, FunnelTier, SeedIntensity, SeedPlacement } from './forge-shadowfeed.types.js';

// ── Double Door Seed System (PRD §4.5 FR-FUNNEL-05) ─────────────────────────
// Every non-offer post contains a natural product seed via the double-door system.
// "Every free post is simultaneously content and product showcase."

export interface DoubleDoorSeed {
  pillarId: PillarId;
  seedText: string;
  placement: SeedPlacement;
  intensity: SeedIntensity;
}

interface SeedTemplate {
  seedText: string;
  placement: SeedPlacement;
  intensity: SeedIntensity;
}

// ── Seed templates per pillar (2-3 variants each for rotation) ───────────────

const PILLAR_SEED_TEMPLATES: Record<Exclude<PillarId, 'the-offer'>, SeedTemplate[]> = {
  'educational-value': [
    {
      seedText: 'O ShadowFeed já tem essa estrutura embutida.',
      placement: 'caption',
      intensity: 'whisper',
    },
    {
      seedText: 'Esse framework já vem pronto no ShadowFeed — é só ativar.',
      placement: 'caption',
      intensity: 'whisper',
    },
    {
      seedText: 'Tudo isso que você aprendeu aqui? O ShadowFeed aplica automaticamente.',
      placement: 'caption',
      intensity: 'whisper',
    },
  ],

  'wake-up-slap': [
    {
      seedText: 'Manter consistência é fácil quando a máquina nunca para.',
      placement: 'caption',
      intensity: 'mention',
    },
    {
      seedText: 'O algoritmo recompensa quem posta todo dia. O ShadowFeed posta todo dia.',
      placement: 'caption',
      intensity: 'mention',
    },
    {
      seedText: 'Consistência não é disciplina — é automação. ShadowFeed resolve isso.',
      placement: 'caption',
      intensity: 'mention',
    },
  ],

  'brand-breakdown': [
    {
      seedText: 'Essa estratégia inteira pode ser replicada com ShadowFeed.',
      placement: 'caption',
      intensity: 'whisper',
    },
    {
      seedText: 'Quer aplicar a mesma fórmula? O ShadowFeed faz isso no automático.',
      placement: 'caption',
      intensity: 'whisper',
    },
    {
      seedText: 'Não precisa de uma equipe de 10 pessoas. Precisa de uma engine.',
      placement: 'caption',
      intensity: 'whisper',
    },
  ],

  'proof-social': [
    {
      seedText: 'Quer o mesmo resultado? Comece grátis — 160 tokens na casa.',
      placement: 'last',
      intensity: 'spotlight',
    },
    {
      seedText: 'Esses números são reais. Os seus podem ser também — shadowfeed.io.',
      placement: 'last',
      intensity: 'spotlight',
    },
    {
      seedText: 'Resultados assim não são sorte. São sistema. Teste grátis em shadowfeed.io.',
      placement: 'last',
      intensity: 'spotlight',
    },
  ],
};

// ── Agency/freelancer cost comparison seeds (cross-pillar, used for spotlight) ──

const COST_COMPARISON_SEEDS: SeedTemplate[] = [
  {
    seedText: 'R$40/mês vs R$3.000/mês. A matemática não mente.',
    placement: 'penultimate',
    intensity: 'spotlight',
  },
  {
    seedText: 'Agência cobra R$3.000. Freelancer R$1.500. ShadowFeed? R$50. Faça as contas.',
    placement: 'penultimate',
    intensity: 'spotlight',
  },
];

// ── Funnel tier mapping (70/20/10 distribution) ──────────────────────────────

const PILLAR_FUNNEL_TIER: Record<PillarId, FunnelTier> = {
  'educational-value': 'top',
  'wake-up-slap': 'top',
  'brand-breakdown': 'top',
  'proof-social': 'middle',
  'the-offer': 'bottom',
};

export function getFunnelTier(pillarId: PillarId): FunnelTier {
  return PILLAR_FUNNEL_TIER[pillarId];
}

// ── Seed selection ───────────────────────────────────────────────────────────

/**
 * Selects a random product seed for the given pillar.
 * Returns null for 'the-offer' pillar (it IS the offer — no seed needed).
 */
export function selectSeed(pillarId: PillarId): DoubleDoorSeed | null {
  if (pillarId === 'the-offer') return null;

  const templates = PILLAR_SEED_TEMPLATES[pillarId];

  // 10% chance to use cost comparison seed instead of pillar-specific
  if (Math.random() < 0.1) {
    const costSeed = COST_COMPARISON_SEEDS[Math.floor(Math.random() * COST_COMPARISON_SEEDS.length)];
    return { pillarId, ...costSeed };
  }

  const selected = templates[Math.floor(Math.random() * templates.length)];
  return { pillarId, ...selected };
}

// ── Offer pillar constants (price anchoring + social proof + guarantee) ──────

export const OFFER_PILLAR_INSTRUCTIONS = {
  priceAnchoring: {
    individualValue: 'R$800+ em ferramentas separadas (design + copy + agendamento + analytics)',
    comboPrice: 'R$50/mês (Starter) ou R$100/mês (Micro-Op)',
    savingsMessage: 'Economia de 90%+ vs contratar separadamente',
  },
  socialProof: {
    message: 'Centenas de criadores já usam o ShadowFeed para manter presença consistente',
    metric: '160 tokens grátis para começar — sem cartão',
  },
  guarantee: {
    type: '7 dias incondicional',
    message: 'Se não gostar, cancela em 7 dias. Sem perguntas, sem burocracia.',
  },
  installmentHighlight: {
    monthly: 'Menos de R$2/dia no plano Starter',
    comparison: 'Preço de um café por dia para nunca mais ficar sem conteúdo',
  },
} as const;
