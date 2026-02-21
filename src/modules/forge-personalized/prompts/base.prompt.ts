/**
 * base.prompt.ts — Shared block builders for the modular prompt system
 *
 * Story 2.3 (CE-03) — AC4
 * All blocks are pure functions that return formatted string segments
 * to be assembled by the orchestrator in prompt-builder.ts.
 */

import type { UserProfile } from '../../../shared/types/post-themes.types.js';
import type { ContentTypeId, ContentDepth } from '../../../shared/types/content-types.types.js';
import { getContentType } from '../../../shared/types/content-types.types.js';

// ── Extended UserProfile fields (v2) ──────────────────────────
// Story 2.5 will formalize these — here we use a local augmentation
// with optional fields so the builder degrades gracefully for legacy users.
type UserProfileV2 = UserProfile & {
    niche?: string | null;
    expertise_statement?: string | null;
    audience_dream_result?: string | null;
    audience_frustration?: string | null;
    content_pillars?: string[] | null;
    brand_personality?: string | null;
    transformation_before?: string | null;
    transformation_after?: string | null;
};

interface SourceContext {
    title: string;
    summary?: string | null;
    url?: string | null;
    category?: string | null;
    raw_content?: string | null;
}

interface ProductContext {
    enabled: boolean;
    name?: string;
    description?: string;
    type?: string;
    main_benefit?: string;
    cta_keyword?: string;
    ctaKeyword?: string; // legacy alias
    purchase_method?: string;
}

// ── BLOCK 0: Date ─────────────────────────────────────────────

/**
 * Returns current date string for temporal context.
 * AC4 — `buildDateBlock()`
 */
export function buildDateBlock(): string {
    const now = new Date();
    const nowStr = now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return [
        '# DATA ATUAL',
        `$now = ${nowStr}`,
        'IMPORTANTE: Ao mencionar datas ou períodos temporais, use esta data como referência.',
        'NUNCA escreva "em 2024 ainda não temos..." se estamos em 2026.',
        'SEMPRE verifique se as datas e referências temporais fazem sentido com $now.',
    ].join('\n');
}

// ── BLOCK 1: User Profile ─────────────────────────────────────

/**
 * Formats user's full strategic profile for AI context.
 * Supports both v1 (legacy) and v2 fields with graceful fallbacks.
 * AC4 — `buildProfileBlock(userProfile)`
 */
export function buildProfileBlock(userProfile: UserProfileV2): string {
    const lines: string[] = ['# PERFIL ESTRATÉGICO DO CRIADOR'];

    // Identity
    if (userProfile.instagram_handle) {
        lines.push(`Nome do Instagram: ${userProfile.instagram_handle}`);
    }
    if (userProfile.instagram_username) {
        lines.push(`Usuário: @${userProfile.instagram_username}`);
    }

    // Niche / Expertise (v2 preferred, v1 fallback)
    const niche = userProfile.niche ?? userProfile.target_audience ?? null;
    if (niche) lines.push(`Nicho de atuação: ${niche}`);

    const expertise = userProfile.expertise_statement ?? userProfile.user_prompt ?? null;
    if (expertise) lines.push(`Declaração de expertise: "${expertise}"`);

    // Audience
    const audience = userProfile.target_audience ?? null;
    if (audience) lines.push(`Público-alvo: ${audience}`);

    const pain = userProfile.audience_frustration ?? userProfile.main_pain_point ?? null;
    if (pain) lines.push(`Principal dor do público: "${pain}"`);

    const dream = userProfile.audience_dream_result ?? null;
    if (dream) lines.push(`Resultado sonhado pelo público: "${dream}"`);

    // Transformation
    const before = userProfile.transformation_before ?? null;
    const after = userProfile.transformation_after ?? null;
    if (before && after) {
        lines.push(`Transformação que entrega:`);
        lines.push(`  ANTES: ${before}`);
        lines.push(`  DEPOIS: ${after}`);
    }

    // Content Pillars
    const pillars = userProfile.content_pillars;
    if (pillars && pillars.length > 0) {
        lines.push(`Pilares de conteúdo: ${pillars.join(', ')}`);
    }

    // Brand Personality
    const personality = userProfile.brand_personality ?? null;
    if (personality) lines.push(`Personalidade da marca: ${personality}`);

    // Voice Tone
    lines.push(`Tom de voz: ${userProfile.voice_tone}`);

    return lines.join('\n');
}

// ── BLOCK 2: Depth ───────────────────────────────────────────

/**
 * Builds depth block with slide count range and AI decision rules.
 * AC4+AC5 — `buildDepthBlock(depth, contentType)`
 */
export function buildDepthBlock(depth: ContentDepth, contentType: ContentTypeId): string {
    const config = getContentType(contentType);
    const range = config.slideCountRange[depth] ?? config.slideCountRange['balanced'];

    const depthLabels: Record<ContentDepth, string> = {
        shallow: 'Superficial (rápido, direto, menor número de slides)',
        balanced: 'Equilibrado (profundidade moderada, cobertura completa)',
        dense: 'Denso (aprofundado, máximo valor por slide, mais slides)',
    };

    const lines: string[] = [
        `# PROFUNDIDADE DE CONTEÚDO`,
        `Nível selecionado: **${depth.toUpperCase()}** — ${depthLabels[depth]}`,
    ];

    if (range) {
        lines.push(`Número de slides: Decida de forma autônoma entre ${range.min} e ${range.max} slides.`);
        lines.push(`REGRAS DE DECISÃO DE NÚMERO DE SLIDES:`);
        lines.push(`- Use ${range.min} slides: para tópicos simples ou audiência iniciante`);
        lines.push(`- Use ${range.max} slides: para tópicos complexos, múltiplos pontos ou audiência avançada`);
        lines.push(`- Para qualquer valor intermediário: ajuste à profundidade real necessária pelo conteúdo`);
        lines.push(`- Nunca sacrifique qualidade por quantidade — prefira menos slides com mais qualidade`);
    }

    return lines.join('\n');
}

// ── BLOCK 3: Narrative ────────────────────────────────────────

/**
 * Maps narrative template roles to descriptions based on depth.
 * AC4+AC6 — `buildNarrativeBlock(contentType, depth)`
 */
export function buildNarrativeBlock(contentType: ContentTypeId, depth: ContentDepth): string {
    const config = getContentType(contentType);
    const template = config.narrativeTemplate[depth] ?? config.narrativeTemplate['balanced'];

    if (!template || template.length === 0) {
        return '';
    }

    const roleDescriptions: Record<string, string> = getRoleDescriptions(contentType, depth);

    const lines: string[] = [
        `# ESTRUTURA NARRATIVA — ${config.label.toUpperCase()}`,
        `Siga esta sequência de papéis para os slides:`,
        '',
    ];

    template.forEach((role, index) => {
        const desc = roleDescriptions[role] ?? `Slide de ${role}`;
        lines.push(`${index + 1}. **${role.toUpperCase()}** — ${desc}`);
    });

    return lines.join('\n');
}

/**
 * Returns role description map for a given content type + depth.
 * Used internally by buildNarrativeBlock.
 */
function getRoleDescriptions(contentType: ContentTypeId, depth: ContentDepth): Record<string, string> {
    // Shared role descriptions across content types
    const shared: Record<string, string> = {
        hook: 'Frase ou dado que para o scroll — deve criar curiosidade imediata',
        cta: 'Chamada para ação — salvar, comentar, compartilhar ou acionar palavra-chave',
        content: 'Slide de valor — insight, dado, exemplo ou aplicação prática',
        conclusion: 'Síntese do aprendizado ou lição principal',
        'pattern-interrupt': 'Slide de contraste, surpresa ou revelação inesperada',
        engagement: 'Pergunta ou afirmação que convida à reflexão ou debate',
    };

    // Per-type overrides
    const overrides: Partial<Record<ContentTypeId, Record<string, string>>> = {
        educational: {
            hook: 'Pergunta ou dado surpreendente que cria lacuna de curiosidade',
            content: 'Insight aplicável com dado concreto (%, estudo, exemplo)',
        },
        tutorial: {
            hook: 'Resultado mensurável que o leitor vai alcançar com este tutorial',
            step: 'Passo numerado: o quê fazer, como fazer, com o quê, em quanto tempo',
            overview: 'Visão geral do processo — mapa dos passos que virão',
            troubleshoot: 'Erros comuns neste processo e como evitá-los',
        },
        sales: {
            hook: 'Dor ou desejo que ressoa com o público e para o scroll',
            attention: 'Afirmação que captura atenção com a dor ou desejo principal',
            interest: 'Benefício do produto com linguagem de transformação',
            desire: 'Resultado específico e tangível que o produto entrega',
            proof: 'Evidência, resultado ou validação da oferta',
            action: 'Instrução clara de como obter — com a palavra-chave em negrito',
            objection: 'Resposta elegante à principal objeção sem confronto',
        },
        authority: {
            hook: 'Posicionamento ousado ou contra-corrente que gera curiosidade',
            positioning: 'Contexto da experiência que fundamenta a opinião',
            insight: 'Observação profunda que só um expert com experiência real pode ter',
            counterpoint: 'Reconhecimento justo do lado oposto com elegância',
            claim: 'A afirmação principal — o que você defende e por quê',
        },
        story: {
            hook: 'Resultado ou conflito central que captura atenção imediatamente',
            setup: 'Apresenta o protagonista e o contexto inicial da história',
            conflict: 'O problema ou obstáculo que muda tudo',
            struggle: 'As tentativas falhas antes da virada — humaniza o protagonista',
            'turning-point': 'O momento de decisão ou insight que muda o rumo',
            resolution: 'O resultado concreto após a mudança',
            lesson: 'A lição universal que emerge naturalmente da história',
            situation: 'A situação inicial do protagonista — o mundo ordinário',
            decision: 'A decisão que muda o curso da história',
            result: 'O resultado concreto e mensurável da decisão',
            'ordinary-world': 'O antes — como era a vida do protagonista antes da mudança',
            transformation: 'A mudança interna que acontece durante a jornada',
        },
        list: {
            hook: 'Número de itens + promessa da lista — ex: "X [coisas] que [benefício]"',
            item: 'Item da lista: nome + por que está aqui + diferencial',
            'surprise-item': 'O item inesperado — o que ninguém esperava ver na lista',
            bonus: 'Item bônus não anunciado — aumenta percepção de valor do post',
        },
        controversy: {
            thesis: 'A posição clara e defensável — o que você defende (não apenas provoca)',
            context: 'Por que esse debate existe — o pano de fundo que torna relevante',
            argument: 'Argumento com dado, estudo ou caso real que sustenta a tese',
            evidence: 'Evidência empírica que robustesce a posição',
            counterpoint: 'O que os que discordam dizem — com honestidade e fairness',
            rebuttal: 'Por que a tese ainda se sustenta após considerar o contraponto',
            nuance: 'As exceções e os limites da tese — mostra pensamento crítico',
            claim: 'A afirmação polêmica ou contraintuitiva bem fundamentada',
            why_most_disagree: 'Por que a maioria pensa diferente — contexto sem julgamento',
            reframe: 'A maneira alternativa de ver o problema que sustenta a tese',
        },
    };

    return { ...shared, ...(overrides[contentType] ?? {}) };
}

// ── BLOCK 4: Source ───────────────────────────────────────────

/**
 * Formats the fetched source content for AI consumption.
 * AC4 — `buildSourceBlock(source)`
 */
export function buildSourceBlock(source: SourceContext): string {
    const lines: string[] = ['# CONTEÚDO-FONTE'];

    lines.push(`Título: ${source.title}`);

    if (source.summary) {
        lines.push(`Resumo: ${source.summary}`);
    }

    if (source.url) {
        lines.push(`URL: ${source.url}`);
    }

    if (source.category) {
        lines.push(`Categoria: ${source.category}`);
    }

    if (source.raw_content && source.raw_content.length > 0) {
        const truncated = source.raw_content.slice(0, 3000);
        lines.push(`\nConteúdo completo:\n${truncated}${source.raw_content.length > 3000 ? '\n[...truncado]' : ''}`);
    }

    if (!source.summary && !source.raw_content) {
        lines.push('(Elabore baseado no título — use seu conhecimento sobre o tema)');
    }

    return lines.join('\n');
}

// ── BLOCK 5: Product ─────────────────────────────────────────

/**
 * Formats offer/product data for sales-type content.
 * AC4 — `buildProductBlock(product)`
 */
export function buildProductBlock(product: ProductContext): string {
    const keyword = product.cta_keyword ?? product.ctaKeyword ?? 'INFO';

    const lines: string[] = [
        '# CONFIGURAÇÃO DE PRODUTO / OFERTA',
        'IMPORTANTE: O conteúdo está divulgando um produto ou oferta. Integre naturalmente.',
        '',
    ];

    if (product.name) lines.push(`Produto: ${product.name}`);
    if (product.type) lines.push(`Tipo: ${product.type}`);
    if (product.description) lines.push(`Descrição: ${product.description}`);
    if (product.main_benefit) lines.push(`Benefício principal: ${product.main_benefit}`);
    if (product.purchase_method) lines.push(`Como adquirir: ${product.purchase_method}`);

    lines.push('');
    lines.push(`Palavra-chave do CTA: "${keyword}"`);
    lines.push('');
    lines.push('REGRAS DO PRODUTO:');
    lines.push('- NUNCA mencione preço');
    lines.push('- Um benefício por slide — não sobrecarregue');
    lines.push(`- A palavra-chave "${keyword}" DEVE estar em **negrito** no CTA`);
    lines.push(`- Formato: "Quer [benefício]? Comenta **${keyword.toUpperCase()}** que te envio na DM!"`);
    lines.push('- Seja natural e persuasivo — conecte o conteúdo dos slides ao produto');

    return lines.join('\n');
}

// ── BLOCK 6: Output Instructions ─────────────────────────────

/**
 * Final instructions for JSON output format.
 * AC4 — `buildOutputInstructions()`
 */
export function buildOutputInstructions(): string {
    return [
        '# INSTRUÇÃO DE OUTPUT',
        '',
        'Retorne APENAS um JSON válido, sem texto antes ou depois.',
        '',
        'CAMPOS OBRIGATÓRIOS NO NÍVEL RAIZ:',
        '- theme: string — descrição do tema do carrossel',
        '- total_slides: number — número total de slides',
        '- slides: array — cada slide conforme estrutura abaixo',
        '- caption: string — legenda completa em 3 blocos separados por "---"',
        '  Bloco 1: Conteúdo editorial (narrativa + valor)',
        '  Bloco 2: Keywords de SEO',
        '  Bloco 3: Hashtags (máx 5)',
        '- hashtags: string[] — array de hashtags ex: ["#AI", "#Tech"]',
        '- cta_text: string — texto curto para o botão CTA',
        '- best_posting_time: string — sugestão de horário ex: "18:00 BRT"',
        '',
        'ESTRUTURA DE CADA SLIDE:',
        '- slide: number (1-indexed)',
        '- role: string (hook | content | cta | etc)',
        '- headline: string (máx 300 chars)',
        '- body_markdown: string | null (conteúdo detalhado quando necessário)',
        '- image: boolean (true para hook e slides-chave)',
        '',
        'REGRAS DE IMAGEM:',
        '- O hook (slide 1) DEVE ter image: true',
        '- Você decide quais content slides têm image: true',
        '- image: true/false apenas — NÃO gere prompts de imagem',
        '',
        'Siga RIGOROSAMENTE o formato JSON especificado.',
        'Retorne APENAS o JSON. Nenhum texto antes ou depois.',
    ].join('\n');
}
