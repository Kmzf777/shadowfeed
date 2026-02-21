import { CaptionStyle, PillarId } from './forge-shadowfeed.types.js';

// § 6 — Hashtag pool (10 tags; #shadowfeed and #contentmachine are always included)
export const SHADOWFEED_HASHTAGS: string[] = [
  '#shadowfeed',
  '#contentmachine',
  '#marketingdigital',
  '#instagrambrasil',
  '#carrossel',
  '#iamarketing',
  '#criacaodeconteudo',
  '#instagramtips',
  '#marketingdeconteudo',
  '#automacao',
];

const FIXED_HASHTAGS = ['#shadowfeed', '#contentmachine'] as const;
const ROTATABLE_HASHTAGS = SHADOWFEED_HASHTAGS.filter(
  (h) => !FIXED_HASHTAGS.includes(h as (typeof FIXED_HASHTAGS)[number]),
);

/**
 * Returns exactly 5 hashtags: 2 fixed (#shadowfeed, #contentmachine) + 3 rotated.
 * Uses Fisher-Yates shuffle on rotatable pool.
 */
export function selectHashtags(): string[] {
  const shuffled = [...ROTATABLE_HASHTAGS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return [...FIXED_HASHTAGS, ...shuffled.slice(0, 3)];
}

// § 7 — Caption style definitions
export interface CaptionStyleDefinition {
  type: CaptionStyle;
  name: string;
  description: string;
  structure: string;
  maxChars: number;
}

export const CAPTION_STYLES: Record<CaptionStyle, CaptionStyleDefinition> = {
  A: {
    type: 'A',
    name: 'One-liner',
    description: 'Uma única linha incisiva que resume o post sem rodeios.',
    structure: '[Afirmação provocativa ou dado impactante].',
    maxChars: 150,
  },
  B: {
    type: 'B',
    name: 'Micro-story',
    description: 'Uma mini narrativa de 3-4 linhas com problema, reviravolta e ponto.',
    structure: '[Situação] → [Revelação inesperada] → [O que isso significa pra você].',
    maxChars: 400,
  },
  C: {
    type: 'C',
    name: 'Challenge',
    description: 'Desafio direto ao leitor — confronta uma crença ou comportamento.',
    structure: 'Se [condição], então [consequência]. Você está nesse grupo?',
    maxChars: 300,
  },
};

// § 13 — Caption preference map per pillar
// Each pillar has a primary and secondary caption style preference.
export const PILLAR_CAPTION_PREFERENCE: Record<PillarId, CaptionStyle[]> = {
  'wake-up-slap': ['A', 'C'],      // One-liner or Challenge — max impact, no fluff
  'proof-of-machine': ['A', 'B'],  // One-liner or Micro-story — factual, authority
  'shadow-school': ['B', 'A'],     // Micro-story or One-liner — educational, contextual
  'the-offer': ['C', 'B'],         // Challenge or Micro-story — friction, then offer
};

/**
 * Returns the preferred caption style for a given pillar.
 * Uses primary preference with 70% probability, secondary with 30%.
 */
export function selectCaptionStyle(pillarId: PillarId): CaptionStyle {
  const preferences = PILLAR_CAPTION_PREFERENCE[pillarId];
  return Math.random() < 0.7 ? preferences[0] : preferences[1];
}

// § 12 — Product context constant
export const SHADOWFEED_PRODUCT_CONTEXT = {
  name: 'ShadowFeed',
  tagline: 'A máquina de conteúdo que nunca para',
  description:
    'ShadowFeed é uma engine de geração automatizada de conteúdo para Instagram, focada em criadores de conteúdo, profissionais autônomos e pequenas empresas que precisam de presença consistente sem dedicar tempo manual à criação.',

  features: [
    'Geração automática de carrosséis em 4 pilares de conteúdo',
    'Templates de alto impacto com personalização por persona',
    'Publicação agendada via Instagram Graph API',
    'Rotação automática de temas e hashtags',
    'Discovery engine para conteúdo baseado em tendências',
    'Dashboard de controle completo',
    'Tokens que nunca expiram',
  ],

  plans: {
    starter: {
      name: 'Starter',
      price: '$9.99',
      priceBRL: 'R$ ~50',
      tokens: 1000,
      postsEstimate: '~140 posts/mês (Marketing Friend)',
      idealFor: 'Profissionais autônomos iniciando presença digital',
    },
    microOp: {
      name: 'Micro-Op',
      price: '$19.99',
      priceBRL: 'R$ ~100',
      tokens: 2000,
      postsEstimate: '~280 posts/mês (Marketing Friend)',
      idealFor: 'Pequenos negócios com presença ativa',
    },
    booster: {
      name: 'Booster',
      price: '$39.99',
      priceBRL: 'R$ ~200',
      tokens: 4000,
      postsEstimate: '~560 posts/mês (Marketing Friend)',
      idealFor: 'Agências e operações de alto volume',
    },
  },

  billingCycles: {
    monthly: { discount: 0, label: 'Mensal' },
    quarterly: { discount: 0.1, label: 'Trimestral (-10%)' },
    annual: { discount: 0.2, label: 'Anual (-20%)' },
  },

  extraTokens: {
    pricePerToken: '$0.012',
    neverExpire: true,
    minPurchase: 'Sem mínimo definido',
  },

  freeTokens: {
    initial: 160,
    drip: 25,
    dripIntervalDays: 4,
    cap: 160,
  },

  differentials: [
    'Conteúdo 100% em português brasileiro com persona afiada',
    'Sem reuniões, sem briefings, sem espera de aprovação',
    'Publicação automática — zero intervenção manual necessária',
    'Pilares de conteúdo pré-definidos e validados',
    'Custo fixo previsível vs custo variável de agência',
  ],

  ctas: {
    primary: 'Começar agora em shadowfeed.io',
    trial: 'Teste grátis com tokens iniciais',
    compare: 'Compare os planos em shadowfeed.io/planos',
  },

  competitors: {
    humanAgency: {
      avgCostBRL: 'R$ 1.500–5.000/mês',
      postsPerWeek: '3–5',
      turnaround: '3–7 dias por peça',
      scalability: 'Baixa — depende de headcount',
    },
    freelancer: {
      avgCostBRL: 'R$ 500–2.000/mês',
      postsPerWeek: '2–4',
      turnaround: '1–3 dias por peça',
      scalability: 'Muito baixa — 1 pessoa',
    },
    genericAI: {
      examples: ['ChatGPT', 'Gemini', 'Copilot'],
      limitation: 'Gera texto — não publica, não agenda, não tem pilares nem persona',
      additionalWork: 'Ainda requer formatação, design, agendamento e hashtags manual',
    },
  },
} as const;

// § 13 — Theme rotation: 70% brand / 30% showcase
export type ThemeRotationSource = 'brand' | 'showcase';

export const BRAND_THEMES = [
  'shadowfeed-brand-authority',
  'shadowfeed-brand-efficiency',
  'shadowfeed-brand-scale',
  'shadowfeed-brand-machine',
  'shadowfeed-brand-system',
] as const;

export const SHOWCASE_THEMES = [
  'social-media-trends',
  'instagram-algorithm',
  'content-strategy',
  'digital-marketing',
  'audience-growth',
  'content-production',
  'personal-branding',
] as const;

export type BrandTheme = (typeof BRAND_THEMES)[number];
export type ShowcaseTheme = (typeof SHOWCASE_THEMES)[number];
