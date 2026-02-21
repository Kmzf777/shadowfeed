/**
 * Content Types Foundation — Story 2.2
 * Canonical TypeScript definitions for all 7 content types.
 *
 * PRD Reference: docs/prd-content-engine-v2.md §6.1, §6.2, §9.1
 */

// ── Primitive types ──────────────────────────────────────────────────────────

export type ContentTypeId =
    | 'educational'
    | 'tutorial'
    | 'sales'
    | 'authority'
    | 'story'
    | 'list'
    | 'controversy';

export type ContentDepth = 'shallow' | 'balanced' | 'dense';

export type CtaStyle = 'engagement' | 'product' | 'follow' | 'debate';

export type PrimaryGoal =
    | 'grow_audience'
    | 'generate_leads'
    | 'direct_sales'
    | 'build_authority'
    | 'balanced';

// ── Composite interfaces ─────────────────────────────────────────────────────

export interface SlideRange {
    min: number;
    max: number;
}

export interface NarrativeTemplate {
    shallow?: string[];
    balanced?: string[];
    dense?: string[];
}

export interface ContentTypeConfig {
    id: ContentTypeId;
    label: string;
    emoji: string;
    description: string;
    primaryGoal: string;
    psychologicalTriggers: string[];
    compatibleDepths: ContentDepth[];
    needsExternalSource: boolean;
    bestFor: PrimaryGoal[];
    ctaStyle: CtaStyle;
    requiresOffer?: boolean;
    narrativeTemplate: NarrativeTemplate;
    slideCountRange: Partial<Record<ContentDepth, SlideRange>>;
}

// ── 7 Content Types ──────────────────────────────────────────────────────────

export const CONTENT_TYPES: ContentTypeConfig[] = [
    // 1 — EDUCACIONAL
    {
        id: 'educational',
        label: 'Educacional',
        emoji: '📚',
        description: 'Ensina algo útil e valioso para o público',
        primaryGoal: 'Salvamentos e compartilhamentos',
        psychologicalTriggers: ['curiosidade', 'valor antecipado', 'utilidade imediata'],
        compatibleDepths: ['shallow', 'balanced', 'dense'],
        needsExternalSource: true,
        bestFor: ['grow_audience', 'build_authority'],
        ctaStyle: 'engagement',
        narrativeTemplate: {
            shallow: ['hook', 'content', 'content', 'content', 'pattern-interrupt', 'cta'],
            balanced: [
                'hook', 'content', 'content', 'content', 'content', 'content',
                'pattern-interrupt', 'conclusion', 'cta',
            ],
            dense: [
                'hook', 'content', 'content', 'content', 'content', 'content',
                'content', 'content', 'pattern-interrupt', 'content', 'content',
                'content', 'content', 'conclusion', 'cta',
            ],
        },
        slideCountRange: {
            shallow: { min: 4, max: 8 },
            balanced: { min: 8, max: 15 },
            dense: { min: 15, max: 20 },
        },
    },

    // 2 — TUTORIAL / PASSO A PASSO
    {
        id: 'tutorial',
        label: 'Tutorial',
        emoji: '🎯',
        description: 'Ensina como fazer algo em passos específicos',
        primaryGoal: 'Salvamentos massivos (post de referência)',
        psychologicalTriggers: ['praticidade', 'completude', 'confiança no processo'],
        compatibleDepths: ['balanced', 'dense'],
        needsExternalSource: false,
        bestFor: ['grow_audience', 'build_authority'],
        ctaStyle: 'engagement',
        narrativeTemplate: {
            balanced: [
                'hook', 'context', 'content', 'content', 'content',
                'content', 'content', 'conclusion', 'cta',
            ],
            dense: [
                'hook', 'context', 'content', 'content', 'content',
                'content', 'content', 'content', 'content', 'content',
                'content', 'content', 'content', 'conclusion', 'cta',
            ],
        },
        slideCountRange: {
            balanced: { min: 8, max: 15 },
            dense: { min: 15, max: 20 },
        },
    },

    // 3 — VENDAS / PRODUTO
    {
        id: 'sales',
        label: 'Venda de Produto',
        emoji: '💰',
        description: 'Apresenta e vende diretamente um produto ou serviço',
        primaryGoal: 'DM triggers, leads, vendas diretas',
        psychologicalTriggers: ['dor', 'desejo', 'prova social', 'urgência', 'autoridade'],
        compatibleDepths: ['shallow', 'balanced'],
        needsExternalSource: false,
        bestFor: ['generate_leads', 'direct_sales'],
        ctaStyle: 'product',
        requiresOffer: true,
        narrativeTemplate: {
            shallow: ['hook', 'problem', 'solution', 'proof', 'offer', 'cta'],
            balanced: [
                'hook', 'problem', 'agitate', 'solution', 'proof',
                'social_proof', 'offer', 'faq', 'cta',
            ],
        },
        slideCountRange: {
            shallow: { min: 5, max: 8 },
            balanced: { min: 8, max: 12 },
        },
    },

    // 4 — AUTORIDADE / POSICIONAMENTO
    {
        id: 'authority',
        label: 'Autoridade',
        emoji: '🏆',
        description: 'Posiciona o criador como referência no nicho',
        primaryGoal: 'Confiança, seguimento, DMs espontâneos',
        psychologicalTriggers: ['credibilidade', 'expertise', 'contrariedade', 'perspectiva única'],
        compatibleDepths: ['balanced', 'dense'],
        needsExternalSource: true,
        bestFor: ['build_authority', 'generate_leads'],
        ctaStyle: 'follow',
        narrativeTemplate: {
            balanced: [
                'hook', 'claim', 'content', 'content', 'content',
                'pattern-interrupt', 'conclusion', 'cta',
            ],
            dense: [
                'hook', 'claim', 'content', 'content', 'content',
                'content', 'content', 'content', 'pattern-interrupt',
                'content', 'content', 'conclusion', 'cta',
            ],
        },
        slideCountRange: {
            balanced: { min: 8, max: 15 },
            dense: { min: 12, max: 18 },
        },
    },

    // 5 — STORYTELLING / CASO
    {
        id: 'story',
        label: 'Storytelling',
        emoji: '✍️',
        description: 'Conta uma história real para criar conexão emocional',
        primaryGoal: 'Engajamento emocional, comentários, DMs',
        psychologicalTriggers: ['identificação', 'emoção', 'jornada', 'superação'],
        compatibleDepths: ['shallow', 'balanced'],
        needsExternalSource: false,
        bestFor: ['grow_audience', 'generate_leads', 'build_authority'],
        ctaStyle: 'engagement',
        narrativeTemplate: {
            shallow: ['hook', 'situation', 'conflict', 'decision', 'result', 'cta'],
            balanced: [
                'hook', 'situation', 'conflict', 'decision', 'struggle',
                'turning_point', 'result', 'lesson', 'cta',
            ],
        },
        slideCountRange: {
            shallow: { min: 5, max: 8 },
            balanced: { min: 8, max: 13 },
        },
    },

    // 6 — LISTA / CURADORIA
    {
        id: 'list',
        label: 'Lista / Curadoria',
        emoji: '📋',
        description: 'Lista curada de ferramentas, dicas, recursos ou exemplos',
        primaryGoal: 'Salvamentos massivos, compartilhamentos',
        psychologicalTriggers: ['completude', 'descoberta', 'utilidade', 'FOMO'],
        compatibleDepths: ['shallow', 'balanced', 'dense'],
        needsExternalSource: true,
        bestFor: ['grow_audience'],
        ctaStyle: 'engagement',
        narrativeTemplate: {
            shallow: ['hook', 'item', 'item', 'item', 'item', 'cta'],
            balanced: [
                'hook', 'item', 'item', 'item', 'item', 'item',
                'item', 'item', 'bonus', 'cta',
            ],
            dense: [
                'hook', 'item', 'item', 'item', 'item', 'item',
                'item', 'item', 'item', 'item', 'item', 'item',
                'item', 'bonus', 'conclusion', 'cta',
            ],
        },
        slideCountRange: {
            shallow: { min: 5, max: 8 },
            balanced: { min: 8, max: 13 },
            dense: { min: 13, max: 20 },
        },
    },

    // 7 — CONTROVÉRSIA / OPINIÃO FORTE
    {
        id: 'controversy',
        label: 'Opinião Forte',
        emoji: '🔥',
        description: 'Opinião contraintuitiva ou polêmica sobre o nicho',
        primaryGoal: 'Comentários, debate, compartilhamentos',
        psychologicalTriggers: ['discordância', 'curiosidade', 'indignação', 'concordância forte'],
        compatibleDepths: ['shallow', 'balanced'],
        needsExternalSource: false,
        bestFor: ['grow_audience', 'build_authority'],
        ctaStyle: 'debate',
        narrativeTemplate: {
            shallow: ['hook', 'claim', 'argument', 'argument', 'conclusion', 'cta'],
            balanced: [
                'hook', 'claim', 'why_most_disagree', 'argument', 'argument',
                'argument', 'reframe', 'conclusion', 'cta',
            ],
        },
        slideCountRange: {
            shallow: { min: 5, max: 8 },
            balanced: { min: 8, max: 12 },
        },
    },
];

// ── Lookup utility ───────────────────────────────────────────────────────────

export function getContentType(id: ContentTypeId): ContentTypeConfig {
    const type = CONTENT_TYPES.find((t) => t.id === id);
    if (!type) throw new Error(`[CONTENT-TYPES] Unknown content type: ${id}`);
    return type;
}

// ── Goal distribution map (PRD §9.1) — used by rotation logic (Story 2.6) ───

/**
 * Weighted distribution of content types per primary goal.
 * Keys are PrimaryGoal values; values are arrays of [ContentTypeId, weight] tuples.
 * Weights are relative probabilities (higher = more likely to be selected).
 */
export const GOAL_DISTRIBUTIONS: Record<
    PrimaryGoal,
    Array<[ContentTypeId, number]>
> = {
    grow_audience: [
        ['educational', 30],
        ['list', 25],
        ['story', 20],
        ['controversy', 15],
        ['tutorial', 10],
    ],
    generate_leads: [
        ['sales', 30],
        ['authority', 25],
        ['educational', 20],
        ['story', 15],
        ['controversy', 10],
    ],
    direct_sales: [
        ['sales', 40],
        ['authority', 25],
        ['educational', 15],
        ['list', 10],
        ['story', 10],
    ],
    build_authority: [
        ['authority', 35],
        ['educational', 25],
        ['controversy', 20],
        ['tutorial', 10],
        ['story', 10],
    ],
    balanced: [
        ['educational', 20],
        ['tutorial', 15],
        ['sales', 15],
        ['authority', 15],
        ['story', 15],
        ['list', 10],
        ['controversy', 10],
    ],
};

// ── Query Angles (Story 2.6 / 2.8 AC4) ───────────────────────────────────────

export const TYPE_QUERY_ANGLES = {
    trending: 'what is happening RIGHT NOW in this niche (news, launch, change)',
    pain: 'content directly addressing the main pain point with evidence or stories',
    solution: 'how-to / actionable tips backed by data or expert opinion',
    story: 'real case study, success story, or cautionary tale from this niche',
    data: 'statistic, survey result, or research finding from the last 90 days',
};
