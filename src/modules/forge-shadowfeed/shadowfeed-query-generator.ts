import { z } from 'zod';
import { openai } from '../../config/openai.js';
import { logger } from '../../config/logger.js';
import type { PillarId } from './forge-shadowfeed.types.js';

// ─── Input ────────────────────────────────────────────────────────

export interface QueryGeneratorInput {
  pillarId: PillarId;
  date: string;
  lastPostsHistory: string[]; // last 30 post themes to avoid repeating
}

// ─── Schema ───────────────────────────────────────────────────────

const QueryOutputSchema = z.object({
  queries: z.array(z.string().min(2).max(80)).min(3).max(5),
});

// ─── Per-pillar system prompts ────────────────────────────────────

const PILLAR_SYSTEM_PROMPTS: Record<Exclude<PillarId, 'proof-of-machine'>, string> = {
  'wake-up-slap': `Você é especialista em pesquisa de conteúdo viral para criadores de conteúdo brasileiros.

Gere queries de busca em PORTUGUÊS para encontrar:
- Polêmicas e frustrações reais de criadores de conteúdo no Brasil
- Dores específicas: queda de alcance, algoritmo injusto, monetização difícil
- Verdades inconvenientes e mitos do marketing digital BR
- Trending hooks emocionais para Instagram Brasil (raiva, surpresa, identificação)

Retorne APENAS JSON válido: { "queries": ["query1", "query2", "query3"] }

Regras:
- 3 a 5 queries
- Máximo 7 palavras cada
- Em português, sem aspas internas
- Prefira queries que retornem dados, percentuais, estudos reais
- EVITE: press releases, parcerias corporativas, conteúdo patrocinado`,

  'shadow-school': `Você é especialista em pesquisa de conteúdo educacional para Instagram e marketing digital brasileiro.

Gere queries de busca em PORTUGUÊS para encontrar:
- Tendências do algoritmo do Instagram no Brasil
- Estratégias virais com dados: reels, carrossel, stories
- Ferramentas de IA para criadores de conteúdo brasileiros
- Pesquisas e dados recentes de marketing digital BR

Retorne APENAS JSON válido: { "queries": ["query1", "query2", "query3"] }

Regras:
- 3 a 5 queries
- Máximo 7 palavras cada
- Em português, sem aspas internas
- Prefira queries que retornem dados, percentuais, pesquisas recentes
- EVITE: anúncios, press releases, conteúdo genérico`,

  'the-offer': `Você é especialista em pesquisa de mercado para negócios digitais e vendas no Brasil.

Gere queries de busca em PORTUGUÊS para encontrar:
- Frustração real de empreendedores com ferramentas de marketing
- Cases e resultados concretos de negócios digitais BR
- IA aplicada a marketing: resultados mensuráveis no Brasil
- Tendências de empreendedorismo digital brasileiro

Retorne APENAS JSON válido: { "queries": ["query1", "query2", "query3"] }

Regras:
- 3 a 5 queries
- Máximo 7 palavras cada
- Em português, sem aspas internas
- Prefira queries que retornem dados concretos, casos reais, números
- EVITE: releases de empresa, conteúdo de marca, parceria corporativa`,
};

// ─── Fallback queries per pillar ──────────────────────────────────

const PILLAR_FALLBACKS: Record<Exclude<PillarId, 'proof-of-machine'>, string[]> = {
  'wake-up-slap': [
    'criador conteúdo erros instagram brasil',
    'algoritmo instagram queda alcance 2026',
    'marketing digital verdade criadores BR',
  ],
  'shadow-school': [
    'instagram reels viral estratégia brasil',
    'algoritmo instagram tendências criadores 2026',
    'IA ferramentas criador conteúdo brasileiro',
  ],
  'the-offer': [
    'marketing digital IA resultados brasil 2026',
    'empreendedor digital crescimento conteúdo',
    'automação marketing resultados concretos BR',
  ],
};

// ─── Main export ──────────────────────────────────────────────────

/**
 * Generate 3–5 PT-BR search queries for a given pillar.
 * Returns [] for proof-of-machine (100% hardcoded — no discovery needed).
 * Queries: max 7 words, Portuguese, prefer data/numbers.
 */
export async function generateShadowFeedQueries(
  input: QueryGeneratorInput
): Promise<string[]> {
  // proof-of-machine pillar is 100% hardcoded — skip discovery entirely
  if (input.pillarId === 'proof-of-machine') {
    return [];
  }

  const systemPrompt = PILLAR_SYSTEM_PROMPTS[input.pillarId];
  const avoidTopics = input.lastPostsHistory.slice(0, 10).join(', ');

  const userMessage = [
    `Data: ${input.date}`,
    `Pilar: ${input.pillarId}`,
    avoidTopics ? `Não repita temas similares a: ${avoidTopics}` : '',
    'Gere as queries de busca para hoje.',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_completion_tokens: 256,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);
    const validated = QueryOutputSchema.parse(parsed);

    logger.info(
      { pillarId: input.pillarId, queries: validated.queries },
      '[SHADOWFEED:QUERY] Queries generated'
    );

    return validated.queries;
  } catch (err) {
    logger.error(
      { pillarId: input.pillarId, error: (err as Error).message },
      '[SHADOWFEED:QUERY] Query generation failed — using fallback'
    );

    return PILLAR_FALLBACKS[input.pillarId];
  }
}
