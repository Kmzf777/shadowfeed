import { openai, OPENAI_MODEL } from '../../config/openai.js';
import { groq } from '../../config/groq.js';
import { gemini } from '../../config/gemini.js';
import { logger } from '../../config/logger.js';
import { parseAndValidateContent } from '../../shared/schemas/content-validator.js';
import { applyTheme } from '../../shared/themes/theme-applier.js';
import { extractKeywordFromSlide } from '../../shared/utils/keyword-extractor.js';
import { fetchPexelsImageByKeyword } from '../../shared/services/pexels.service.js';
import { getThemeConfig } from '../../shared/themes/post-themes.library.js';
import { retry } from '../../shared/utils/retry.js';
import { SHADOWFEED_PRODUCT_CONTEXT, selectHashtags, selectCaptionStyle, CAPTION_STYLES, PILLAR_CTA_MAPPINGS } from './shadowfeed-constants.js';
import {
  SHADOWFEED_PERSONA_VOICE,
  SHADOWFEED_ANTI_PATTERNS,
  PILLAR_PROMPT_RULES,
} from './shadowfeed-persona.js';
import { PILLAR_FEW_SHOTS } from './shadowfeed-few-shots.js';
import { PILLARS } from './forge-shadowfeed.types.js';
import type { PillarId, HookArchetype, DiscoverySource, PillarTemplate, ResearchDigest, CaptionStyle, LlmProvider, PromptSource } from './forge-shadowfeed.types.js';
export type { PromptSource } from './forge-shadowfeed.types.js';
import type { ContentCarousel } from '../../shared/schemas/content-schema.js';
import { getArchetypeDefinition, shouldAddVisualSignature } from './shadowfeed-hook-archetypes.js';
import { selectSeed, OFFER_PILLAR_INSTRUCTIONS } from './shadowfeed-double-door.js';
import type { DoubleDoorSeed } from './shadowfeed-double-door.js';

// ── Prompt builder params ─────────────────────────────────────

export interface PromptBuilderParams {
  pillarId: PillarId;
  source: PromptSource;
  captionStyle: CaptionStyle;
  hashtags: string[];
  hookArchetype?: HookArchetype;
  doubleDoorSeed?: DoubleDoorSeed | null;
  slideRangeOverride?: { min: number; max: number };
}

// ── Generation result ─────────────────────────────────────────

export interface ShadowFeedGenerationResult {
  carousel: ContentCarousel;
  themeApplied: ReturnType<typeof applyTheme>;
  pillarId: PillarId;
  captionStyle: CaptionStyle;
  hashtags: string[];
  sourceType: 'discovery' | 'research' | 'template';
  hookArchetype?: HookArchetype;
  doubleDoorSeed: DoubleDoorSeed | null;
}

// ─────────────────────────────────────────────────────────────
// 9-BLOCK PROMPT BUILDERS (PRD §6.3)
// ─────────────────────────────────────────────────────────────

function buildBlock1Persona(): string {
  return `## BLOCO 1 — PERSONA (Quem está falando)

${SHADOWFEED_PERSONA_VOICE}`;
}

function buildBlock2PillarRules(pillarId: PillarId, slideRangeOverride?: { min: number; max: number }): string {
  const rules = PILLAR_PROMPT_RULES[pillarId];
  const pillar = PILLARS.find((p) => p.id === pillarId)!;
  const cta = PILLAR_CTA_MAPPINGS[pillarId];
  const slideRange = slideRangeOverride ?? rules.slideRange;

  const additional = rules.additionalRules.map((r) => `- ${r}`).join('\n');

  return `## BLOCO 2 — PILAR ATIVO (Regras do pilar + slide roles)

Pilar: ${rules.name} (${pillarId})
Horário de publicação: ${pillar.time}
Tipo de conteúdo: ${pillar.contentType}

${rules.toneDescription}

${rules.contentObjective}

Objetivo de engajamento: ${rules.engagementObjective}

Número de slides: entre ${slideRange.min} e ${slideRange.max}

Roles permitidos nos slides: ${rules.allowedRoles.join(', ')}

Regras estruturais:
${additional}

CTA contextual deste pilar: "${cta.primary}"
CTA secundário: "${cta.secondary}"
${rules.ctaStyle}`;
}

function buildBlock3CopyPhases(): string {
  return `## BLOCO 3 — FASES DE COPY (Progressão obrigatória)

Todo carousel DEVE seguir estas 3 fases de copy na ordem:

### FASE 1 — INTERRUPÇÃO (slides 1-2)
- Zero explicação. Apenas tensão.
- Técnicas permitidas: choque numérico, afirmação polarizante, palavra tabu, negação de identidade
- O leitor deve parar de scrollar. Não entender — apenas sentir.
- Slide 1 (hook): AFIRMA. Nunca pergunta. Declaração que incomoda.
- Slide 2 (context): Contextualiza a afirmação — amplia o desconforto com dados ou cenário.

### FASE 2 — DESENVOLVIMENTO (slides 3-N)
- Cada slide tem título + 2-4 linhas de corpo.
- Linguagem direta. Sem rodeio. Cada frase existe por um motivo.
- Transições entre slides com "→" ou construção lógica progressiva.
- O conteúdo ENSINA, CONFRONTA ou COMPROVA — nunca decora.

### FASE 3 — CONVERSÃO (slides finais)
- Antepenúltimo slide (tension): A virada. Dado ou revelação que muda tudo.
- Penúltimo slide (soft-cta): Transição suave. Conecta o conteúdo à ação sem pressão.
- Último slide (cta): CTA contextual do pilar. Direto. Sem drama.
- Nunca implorar engajamento. O conteúdo já fez o trabalho.`;
}

function buildBlock4Source(source: PromptSource): string {
  if (source.type === 'research') {
    const d = source.data;
    const dataPointsList = d.dataPoints.length > 0
      ? d.dataPoints.map((dp) => `- ${dp}`).join('\n')
      : '(Nenhum dado concreto extraído — NÃO invente números)';
    const quotables = d.quotableLines.length > 0
      ? d.quotableLines.map((q) => `- "${q}"`).join('\n')
      : '';
    const brands = d.brandMentions.length > 0
      ? `Marcas mencionadas: ${d.brandMentions.join(', ')}`
      : '';

    return `## BLOCO 4 — FONTE DE CONTEÚDO (Research — Artigo Completo)

Tipo: Conteúdo pesquisado e sumarizado via discovery engine v2
Profundidade: ${d.contentDepth}

### Insight principal:
${d.keyInsight}

### Dados concretos extraídos (USE estes — NÃO invente):
${dataPointsList}

### Ângulo provocativo (wake-up-slap):
${d.provocativeAngle}

### Ângulo educacional:
${d.educationalAngle}

${brands}

### Headlines sugeridas (inspiração para slides):
${quotables}

### Corpo do artigo original (contexto completo):
${d.rawBody}

Instrução: Este conteúdo foi extraído de um artigo REAL. Use os dados concretos acima como base factual OBRIGATÓRIA. NÃO invente números ou estatísticas — use APENAS o que está listado em "Dados concretos extraídos". Reinterprete pelo filtro da persona ShadowFeed.`;
  }

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

function buildBlock5HookArchetype(hookArchetype?: HookArchetype): string {
  const archDef = hookArchetype ? getArchetypeDefinition(hookArchetype) : undefined;

  if (!archDef) {
    return `## BLOCO 5 — HOOK ARCHETYPE

Regra base: O hook AFIRMA. Nunca pergunta. Use uma declaração que incomoda.`;
  }

  // Pick 1 random example from the archetype's 3
  const exampleIndex = Math.floor(Math.random() * archDef.examples.length);
  const example = archDef.examples[exampleIndex];

  // FR-HOOK-08: ~30% chance of // visual signature prefix
  const useVisualSignature = shouldAddVisualSignature();
  const signatureInstruction = useVisualSignature
    ? `\nPrefixe o hook com "// " (duas barras + espaço) como assinatura visual da marca.\nExemplo: "// ${example}"`
    : '';

  return `## BLOCO 5 — HOOK ARCHETYPE (${archDef.id})

Arquétipo selecionado: **${archDef.id}**
${archDef.description}

Estrutura do hook: "${archDef.structureTemplate}"

Exemplo de referência (adapte ao conteúdo fonte do Bloco 4):
"${example}"

REGRA OBRIGATÓRIA (FR-HOOK-07): O hook DEVE ser uma AFIRMAÇÃO. NUNCA uma pergunta. Zero interrogações no slide 1.${signatureInstruction}

Instrução: Siga a estrutura do arquétipo acima para construir o hook (slide 1). Adapte ao conteúdo da fonte (Bloco 4), mantendo o padrão estrutural e o tom do arquétipo.`;
}

function buildBlock6DoubleDoorSeed(pillarId: PillarId, seed: DoubleDoorSeed | null | undefined): string {
  // the-offer pillar — special treatment with price anchoring + social proof + guarantee
  if (pillarId === 'the-offer') {
    const offer = OFFER_PILLAR_INSTRUCTIONS;
    return `## BLOCO 6 — DOUBLE DOOR SEED (Offer Pillar — Conversão Direta)

Este é o pilar de OFERTA DIRETA. Não há seed sutil — o post inteiro É a oferta.

### Price Anchoring (OBRIGATÓRIO em pelo menos 1 slide):
- Valor individual das ferramentas: ${offer.priceAnchoring.individualValue}
- Preço real: ${offer.priceAnchoring.comboPrice}
- Mensagem: "${offer.priceAnchoring.savingsMessage}"

### Social Proof (OBRIGATÓRIO em pelo menos 1 slide):
- "${offer.socialProof.message}"
- Destaque: "${offer.socialProof.metric}"

### Garantia (OBRIGATÓRIO no penúltimo ou último slide):
- Tipo: ${offer.guarantee.type}
- Mensagem: "${offer.guarantee.message}"

### Parcelamento (RECOMENDADO):
- "${offer.installmentHighlight.monthly}"
- "${offer.installmentHighlight.comparison}"

Instrução: Distribua esses elementos nos slides de forma natural. O anchoring deve vir antes do preço real. Social proof reforça a decisão. Garantia elimina objeções.`;
  }

  // Non-offer pillars — inject product seed subtly
  if (!seed) {
    return `## BLOCO 6 — DOUBLE DOOR SEED

Nenhum seed selecionado para este post. Use apenas o CTA contextual do pilar (Bloco 2) no último slide.`;
  }

  const intensityGuide: Record<string, string> = {
    whisper: 'Mencione sutilmente no final da legenda, sem chamar atenção. Uma frase natural, quase como pensamento em voz alta.',
    mention: 'Referencie o produto pelo nome na legenda e no penúltimo slide. Tom casual mas intencional.',
    spotlight: 'Destaque o produto com preço/benefício explícito. O leitor deve entender que existe uma solução.',
  };

  const placementGuide: Record<string, string> = {
    caption: 'Insira o seed text no final da legenda (caption), como última frase ou penúltima.',
    penultimate: 'Insira o seed text no penúltimo slide do carousel, integrado ao conteúdo do slide.',
    last: 'Insira o seed text no último slide, junto ao CTA.',
  };

  return `## BLOCO 6 — DOUBLE DOOR SEED (${seed.intensity})

### Seed Text (OBRIGATÓRIO — inclua no conteúdo gerado):
"${seed.seedText}"

### Posicionamento:
${placementGuide[seed.placement]}

### Intensidade (${seed.intensity}):
${intensityGuide[seed.intensity]}

Instrução: O seed deve parecer uma conclusão natural do conteúdo, NÃO um anúncio inserido. O leitor deve absorver a mensagem do produto sem perceber que está sendo vendido. Mantenha o tom da persona ShadowFeed.`;
}

function buildBlock7Product(): string {
  const p = SHADOWFEED_PRODUCT_CONTEXT;
  const features = p.features.map((f) => `- ${f}`).join('\n');
  const diffs = p.differentials.map((d) => `- ${d}`).join('\n');

  return `## BLOCO 7 — CONTEXTO DO PRODUTO

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

function buildBlock8AntiPatterns(): string {
  return `## BLOCO 8 — ANTI-PATTERNS (O que NUNCA fazer)

${SHADOWFEED_ANTI_PATTERNS}`;
}

function buildBlock9OutputFormat(
  pillarId: PillarId,
  captionStyle: CaptionStyle,
  hashtags: string[],
  slideRangeOverride?: { min: number; max: number },
): string {
  const rules = PILLAR_PROMPT_RULES[pillarId];
  const pillar = PILLARS.find((p) => p.id === pillarId)!;
  const captionDef = CAPTION_STYLES[captionStyle];
  const slideRange = slideRangeOverride ?? rules.slideRange;

  return `## BLOCO 9 — FORMATO DE SAÍDA

Retorne EXCLUSIVAMENTE um JSON válido (sem markdown, sem texto extra) seguindo este schema:

{
  "theme": "string — tema principal do carousel (5–200 chars)",
  "total_slides": number (entre ${slideRange.min} e ${slideRange.max}),
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

REGRAS OBRIGATÓRIAS DE ESTRUTURA (7-zone carousel anatomy):
- Slide 1: role DEVE ser "hook" (AFIRMAÇÃO, nunca pergunta)
- Slides 2-3: role DEVE ser "context" (contextualização)
- Slides 4-N: role "content" (corpo do conteúdo)
- Antepenúltimo slide: role DEVE ser "tension" (virada/revelação)
- Penúltimo slide: role DEVE ser "soft-cta" (transição suave)
- Último slide: role DEVE ser "cta" (chamada para ação)
- total_slides DEVE ser igual ao número de objetos em slides[]
- Todos os textos em PT-BR

CAPTION — Estilo ${captionStyle} (${captionDef.name}):
${captionDef.description}
Estrutura: ${captionDef.structure}
Máximo: ${captionDef.maxChars} caracteres

HASHTAGS: Use exatamente estas — não substitua nem adicione: ${hashtags.join(' ')}`;
}

// ─────────────────────────────────────────────────────────────
// MAIN PROMPT BUILDER (9 blocks assembled — PRD §6.3)
// ─────────────────────────────────────────────────────────────

export function buildShadowFeedPrompt(params: PromptBuilderParams): string {
  const { pillarId, source, captionStyle, hashtags, hookArchetype, doubleDoorSeed, slideRangeOverride } = params;

  const blocks = [
    buildBlock1Persona(),
    buildBlock2PillarRules(pillarId, slideRangeOverride),
    buildBlock3CopyPhases(),
    buildBlock4Source(source),
    buildBlock5HookArchetype(hookArchetype),
    buildBlock6DoubleDoorSeed(pillarId, doubleDoorSeed),
    buildBlock7Product(),
    buildBlock8AntiPatterns(),
    buildBlock9OutputFormat(pillarId, captionStyle, hashtags, slideRangeOverride),
  ];

  return [
    '# INSTRUÇÃO DE GERAÇÃO — SHADOWFEED CAROUSEL v2 (Decoded Content Machine)',
    '',
    'Você é o motor de geração do ShadowFeed. Gere um carousel de Instagram completo seguindo RIGOROSAMENTE os 9 blocos abaixo.',
    '',
    ...blocks,
  ].join('\n\n');
}

export function buildShadowFeedSystemInstruction(): string {
  return [
    'Você é o motor de geração de conteúdo do ShadowFeed.',
    'Responda APENAS com JSON válido — sem texto, sem markdown, sem explicações.',
    'Siga exatamente o schema especificado no Bloco 9.',
    'Todo conteúdo deve estar em português brasileiro (PT-BR).',
    'A persona ShadowFeed deve ser consistente em todos os slides.',
    'O hook AFIRMA. Nunca pergunta.',
    'Siga as 3 fases de copy: interrupção → desenvolvimento → conversão.',
  ].join(' ');
}

// ─────────────────────────────────────────────────────────────
// GENERATION PIPELINE (reuses forge-personalized flow)
// ─────────────────────────────────────────────────────────────

export async function generateShadowFeedCarousel(
  pillarId: PillarId,
  source: PromptSource,
  themeId: string,
  llmProvider: LlmProvider = 'openai',
  hookArchetype?: HookArchetype,
  slideRangeOverride?: { min: number; max: number },
): Promise<ShadowFeedGenerationResult> {
  // Select hashtags (5 total: 2 fixed + 3 rotated)
  const hashtags = selectHashtags();

  // Select caption style based on pillar preference
  const captionStyle = selectCaptionStyle(pillarId);

  // Select double-door seed (null for the-offer pillar)
  const doubleDoorSeed = selectSeed(pillarId);

  // Build the 9-block prompt
  const userPrompt = buildShadowFeedPrompt({ pillarId, source, captionStyle, hashtags, hookArchetype, doubleDoorSeed, slideRangeOverride });
  const systemInstruction = buildShadowFeedSystemInstruction();

  logger.info(
    { pillarId, sourceType: source.type, themeId, captionStyle },
    '[SHADOWFEED-PROMPT] Generating carousel',
  );

  // Call LLM with retry
  const result = await retry(
    async () => {
      let text = '';

      if (llmProvider === 'groq') {
        const response = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt },
          ],
        });
        text = response.choices[0]?.message?.content || '';
      } else if (llmProvider === 'gemini') {
        const model = gemini.getGenerativeModel({
          model: 'gemini-2.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 8192,
          },
        });
        const result = await model.generateContent(systemInstruction + '\n\n' + userPrompt);
        text = result.response.text();
      } else {
        const response = await openai.chat.completions.create({
          model: 'gpt-4.1-mini',
          max_completion_tokens: 8192,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt },
          ],
        });
        text = response.choices[0]?.message?.content || '';
      }

      // Validate using the shared content-validator (universal SlideRole)
      const content = parseAndValidateContent(text);

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
      label: `SHADOWFEED:${llmProvider}`,
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
    hookArchetype,
    doubleDoorSeed,
  };
}
