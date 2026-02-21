import { openai, OPENAI_MODEL } from '../../config/openai.js';
import { logger } from '../../config/logger.js';
import { parseAndValidateContent } from '../../shared/schemas/content-validator.js';
import { applyTheme } from '../../shared/themes/theme-applier.js';
import { extractKeywordFromSlide } from '../../shared/utils/keyword-extractor.js';
import { fetchPexelsImageByKeyword } from '../../shared/services/pexels.service.js';
import { getThemeConfig } from '../../shared/themes/post-themes.library.js';
import { retry } from '../../shared/utils/retry.js';
import { SHADOWFEED_PRODUCT_CONTEXT, selectHashtags, selectCaptionStyle, CAPTION_STYLES } from './shadowfeed-constants.js';
import {
  SHADOWFEED_PERSONA_VOICE,
  SHADOWFEED_ANTI_PATTERNS,
  PILLAR_PROMPT_RULES,
} from './shadowfeed-persona.js';
import { PILLAR_FEW_SHOTS } from './shadowfeed-few-shots.js';
import { PILLARS } from './forge-shadowfeed.types.js';
import type { PillarId, DiscoverySource, PillarTemplate, CaptionStyle } from './forge-shadowfeed.types.js';
import type { ContentCarousel } from '../../shared/schemas/content-schema.js';

// ── Source union type ─────────────────────────────────────────

export type PromptSource =
  | { type: 'discovery'; data: DiscoverySource }
  | { type: 'template'; data: PillarTemplate };

// ── Prompt builder params ─────────────────────────────────────

export interface PromptBuilderParams {
  pillarId: PillarId;
  source: PromptSource;
  captionStyle: CaptionStyle;
  hashtags: string[];
}

// ── Generation result ─────────────────────────────────────────

export interface ShadowFeedGenerationResult {
  carousel: ContentCarousel;
  themeApplied: ReturnType<typeof applyTheme>;
  pillarId: PillarId;
  captionStyle: CaptionStyle;
  hashtags: string[];
  sourceType: 'discovery' | 'template';
}

// ─────────────────────────────────────────────────────────────
// BLOCK BUILDERS
// ─────────────────────────────────────────────────────────────

function buildBlock1Persona(): string {
  return `## BLOCO 1 — PERSONA (Quem está falando)

${SHADOWFEED_PERSONA_VOICE}`;
}

function buildBlock2Pillar(pillarId: PillarId): string {
  const rules = PILLAR_PROMPT_RULES[pillarId];
  const pillar = PILLARS.find((p) => p.id === pillarId)!;

  return `## BLOCO 2 — PILAR ATIVO

Pilar: ${rules.name} (${pillarId})
Horário de publicação: ${pillar.time}
Tipo de conteúdo: ${pillar.contentType}

${rules.toneDescription}

${rules.contentObjective}

Número de slides: entre ${rules.slideRange.min} e ${rules.slideRange.max}`;
}

function buildBlock3Rules(pillarId: PillarId): string {
  const rules = PILLAR_PROMPT_RULES[pillarId];

  const additional = rules.additionalRules.map((r) => `- ${r}`).join('\n');

  return `## BLOCO 3 — REGRAS DO PILAR

Roles permitidos nos slides: ${rules.allowedRoles.join(', ')}

Regras estruturais:
${additional}

${rules.ctaStyle}`;
}

function buildBlock4Source(source: PromptSource): string {
  if (source.type === 'discovery') {
    const { title, url, source: sourceName, score, trending } = source.data;
    return `## BLOCO 4 — FONTE DE CONTEÚDO (Discovery Winner)

Tipo: Conteúdo descoberto via discovery engine
Título: ${title}
URL de referência: ${url}
Fonte: ${sourceName}
Score de relevância: ${score.toFixed(2)}
Trending: ${trending ? 'Sim' : 'Não'}

Instrução: Use este conteúdo como base factual para o carousel. Extraia dados, conceitos e ângulos relevantes. Não copie verbatim — reinterprete pelo filtro da persona ShadowFeed.`;
  }

  const { theme, hookLine, bodyHints, variables, toneIntensity } = source.data;
  const hintsFormatted = bodyHints.map((h) => `- ${h}`).join('\n');
  const variablesNote =
    variables.length > 0
      ? `Variáveis a preencher com dados plausíveis: ${variables.map((v) => `{${v}}`).join(', ')}`
      : '';

  return `## BLOCO 4 — FONTE DE CONTEÚDO (Template Hardcoded)

Tipo: Template pré-definido
Tema: ${theme}
Hook line sugerida: "${hookLine}"
Intensidade de tom: ${toneIntensity}
${variablesNote}

Hints de corpo:
${hintsFormatted}

Instrução: Use o tema, hook e hints como estrutura base. Preencha variáveis com valores realistas para o público-alvo (criadores de conteúdo, profissionais autônomos, pequenos negócios no Brasil). Mantenha a linha narrativa dos hints mas construa slides completos.`;
}

function buildBlock5Product(): string {
  const p = SHADOWFEED_PRODUCT_CONTEXT;
  const features = p.features.map((f) => `- ${f}`).join('\n');
  const diffs = p.differentials.map((d) => `- ${d}`).join('\n');

  return `## BLOCO 5 — CONTEXTO DO PRODUTO

Nome: ${p.name}
Tagline: ${p.tagline}
Descrição: ${p.description}

Features principais:
${features}

Diferenciais:
${diffs}

Planos:
- Starter: ${p.plans.starter.price} (${p.plans.starter.priceBRL})/mês → ${p.plans.starter.tokens} tokens → ${p.plans.starter.postsEstimate}
- Micro-Op: ${p.plans.microOp.price} (${p.plans.microOp.priceBRL})/mês → ${p.plans.microOp.tokens} tokens → ${p.plans.microOp.postsEstimate}
- Booster: ${p.plans.booster.price} (${p.plans.booster.priceBRL})/mês → ${p.plans.booster.tokens} tokens → ${p.plans.booster.postsEstimate}

Tokens grátis: ${p.freeTokens.initial} iniciais + ${p.freeTokens.drip} a cada ${p.freeTokens.dripIntervalDays} dias (cap: ${p.freeTokens.cap})

CTAs disponíveis:
- Principal: "${p.ctas.primary}"
- Trial: "${p.ctas.trial}"
- Planos: "${p.ctas.compare}"

Concorrentes para comparação:
- Agência humana: ${p.competitors.humanAgency.avgCostBRL}/mês, ${p.competitors.humanAgency.postsPerWeek} posts/semana
- Freelancer: ${p.competitors.freelancer.avgCostBRL}/mês
- IA genérica (ChatGPT, etc.): ${p.competitors.genericAI.limitation}`;
}

function buildBlock6AntiPatterns(): string {
  return `## BLOCO 6 — ANTI-PATTERNS (O que NUNCA fazer)

${SHADOWFEED_ANTI_PATTERNS}`;
}

function buildBlock7FewShots(pillarId: PillarId): string {
  const examples = PILLAR_FEW_SHOTS[pillarId];
  const examplesJson = examples.map((ex, i) => {
    return `### Exemplo ${i + 1}:
\`\`\`json
${JSON.stringify(ex, null, 2)}
\`\`\``;
  });

  return `## BLOCO 7 — EXEMPLOS FEW-SHOT (Referência de qualidade esperada)

Os exemplos abaixo mostram o nível de qualidade, estrutura e voz esperados. Siga o padrão mas NÃO copie — crie conteúdo original baseado na fonte fornecida no Bloco 4.

${examplesJson.join('\n\n')}`;
}

function buildBlock8OutputFormat(
  pillarId: PillarId,
  captionStyle: CaptionStyle,
  hashtags: string[],
): string {
  const rules = PILLAR_PROMPT_RULES[pillarId];
  const pillar = PILLARS.find((p) => p.id === pillarId)!;
  const captionDef = CAPTION_STYLES[captionStyle];

  return `## BLOCO 8 — FORMATO DE SAÍDA

Retorne EXCLUSIVAMENTE um JSON válido (sem markdown, sem texto extra) seguindo este schema:

{
  "theme": "string — tema principal do carousel (5–200 chars)",
  "total_slides": number (entre ${rules.slideRange.min} e ${rules.slideRange.max}),
  "slides": [
    {
      "slide": number (1-based, sequencial),
      "role": "string — um de: ${rules.allowedRoles.join(' | ')}",
      "headline": "string — título principal do slide (obrigatório, max 300 chars)",
      "subtitle": "string | null — subtítulo opcional",
      "body_markdown": "string | null — corpo em markdown (bold, listas, \\n para quebras)",
      "image": boolean (true apenas em slides onde imagem agrega valor visual real),
      "list": ["string"] | null — lista de itens se o slide usar formato de lista,
      "number_label": "string | null — rótulo numérico como '01', '02' (opcional)"
    }
  ],
  "caption": "string — legenda do post em PT-BR (50–2200 chars)",
  "hashtags": ${JSON.stringify(hashtags)},
  "cta_text": "string — texto de chamada para ação",
  "best_posting_time": "${pillar.time}"
}

REGRAS OBRIGATÓRIAS DE ESTRUTURA:
- Slide 1: role DEVE ser "hook"
- Último slide: role DEVE ser "cta"
- total_slides DEVE ser igual ao número de objetos em slides[]
- Todos os textos em PT-BR

CAPTION — Estilo ${captionStyle} (${captionDef.name}):
${captionDef.description}
Estrutura: ${captionDef.structure}
Máximo: ${captionDef.maxChars} caracteres

HASHTAGS: Use exatamente estas — não substitua nem adicione: ${hashtags.join(' ')}`;
}

// ─────────────────────────────────────────────────────────────
// MAIN PROMPT BUILDER (8 blocks assembled)
// ─────────────────────────────────────────────────────────────

export function buildShadowFeedPrompt(params: PromptBuilderParams): string {
  const { pillarId, source, captionStyle, hashtags } = params;

  const blocks = [
    buildBlock1Persona(),
    buildBlock2Pillar(pillarId),
    buildBlock3Rules(pillarId),
    buildBlock4Source(source),
    buildBlock5Product(),
    buildBlock6AntiPatterns(),
    buildBlock7FewShots(pillarId),
    buildBlock8OutputFormat(pillarId, captionStyle, hashtags),
  ];

  return [
    '# INSTRUÇÃO DE GERAÇÃO — SHADOWFEED CAROUSEL',
    '',
    'Você é o motor de geração do ShadowFeed. Gere um carousel de Instagram completo seguindo RIGOROSAMENTE os 8 blocos abaixo.',
    '',
    ...blocks,
  ].join('\n\n');
}

export function buildShadowFeedSystemInstruction(): string {
  return [
    'Você é o motor de geração de conteúdo do ShadowFeed.',
    'Responda APENAS com JSON válido — sem texto, sem markdown, sem explicações.',
    'Siga exatamente o schema especificado no Bloco 8.',
    'Todo conteúdo deve estar em português brasileiro (PT-BR).',
    'A persona ShadowFeed deve ser consistente em todos os slides.',
  ].join(' ');
}

// ─────────────────────────────────────────────────────────────
// GENERATION PIPELINE (Task 7 — reuses forge-personalized flow)
// ─────────────────────────────────────────────────────────────

export async function generateShadowFeedCarousel(
  pillarId: PillarId,
  source: PromptSource,
  themeId: string,
): Promise<ShadowFeedGenerationResult> {
  // Select hashtags (5 total: 2 fixed + 3 rotated)
  const hashtags = selectHashtags();

  // Select caption style based on pillar preference
  const captionStyle = selectCaptionStyle(pillarId);

  // Build the 8-block prompt
  const userPrompt = buildShadowFeedPrompt({ pillarId, source, captionStyle, hashtags });
  const systemInstruction = buildShadowFeedSystemInstruction();

  logger.info(
    { pillarId, sourceType: source.type, themeId, captionStyle },
    '[SHADOWFEED-PROMPT] Generating carousel',
  );

  // Call OpenAI with retry — no credit check (system-funded)
  const result = await retry(
    async () => {
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        max_completion_tokens: 8192,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userPrompt },
        ],
      });

      const text = response.choices[0]?.message?.content || '';

      // Validate using the shared content-validator (reuse from forge-personalized)
      // ShadowFeed uses 'editorial' pipeline — supports all pillar role types
      const content = parseAndValidateContent(text, 'editorial');

      // Pexels image enrichment (same as forge-personalized)
      const slidesWithImages = await Promise.all(
        content.slides.map(async (slide, index) => {
          if (slide.image) {
            const isHook = index === 0;
            const keyword = extractKeywordFromSlide(slide.headline, slide.body_markdown ?? '', 'business');
            logger.info({ slideIndex: index, keyword, isHook }, '[SHADOWFEED-PEXELS] Fetching image');
            const pexelsData = await fetchPexelsImageByKeyword(keyword, isHook);
            if (pexelsData) {
              return {
                ...slide,
                image_keyword: keyword,
                image_url: pexelsData.url,
                image_credit: pexelsData.photographer,
              };
            }
          }
          return slide;
        }),
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content.slides = slidesWithImages as any;

      // Apply theme (same as forge-personalized)
      const themeConfig = getThemeConfig(themeId);
      const themeApplied = applyTheme(content, themeConfig);

      return { content, themeApplied };
    },
    {
      retries: 2,
      delay: 3000,
      label: 'SHADOWFEED:openai',
    },
  );

  logger.info(
    { pillarId, themeId, slides: result.content.total_slides },
    '[SHADOWFEED-PROMPT] Carousel generated successfully',
  );

  return {
    carousel: result.content,
    themeApplied: result.themeApplied,
    pillarId,
    captionStyle,
    hashtags,
    sourceType: source.type,
  };
}
