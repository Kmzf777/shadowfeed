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

const PILLAR_SYSTEM_PROMPTS: Record<PillarId, string> = {
  'educational-value': `Você é especialista em pesquisa de conteúdo educacional para Instagram e marketing digital brasileiro.

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

  'brand-breakdown': `Você é especialista em pesquisa de estratégias de marca e branding digital no Brasil.

Gere queries de busca em PORTUGUÊS para encontrar:
- Análises de estratégia de conteúdo de grandes marcas no Instagram
- Cases de branding digital e posicionamento de marca no Brasil
- Dados sobre estratégias de conteúdo que constroem autoridade
- Comparações e dissecações de presença digital de marcas BR

Retorne APENAS JSON válido: { "queries": ["query1", "query2", "query3"] }

Regras:
- 3 a 5 queries
- Máximo 7 palavras cada
- Em português, sem aspas internas
- Prefira queries que retornem análises, dados de marcas, estratégias documentadas
- EVITE: press releases, parcerias corporativas, conteúdo patrocinado`,

  'proof-social': `Você é especialista em pesquisa de resultados e cases de sucesso em marketing digital brasileiro.

Gere queries de busca em PORTUGUÊS para encontrar:
- Resultados mensuráveis de automação de conteúdo no Brasil
- Dados de ROI em marketing de conteúdo para Instagram BR
- Cases reais de crescimento orgânico com sistemas automatizados
- Métricas de desempenho de ferramentas de criação de conteúdo

Retorne APENAS JSON válido: { "queries": ["query1", "query2", "query3"] }

Regras:
- 3 a 5 queries
- Máximo 7 palavras cada
- Em português, sem aspas internas
- Prefira queries que retornem dados concretos, métricas, resultados reais
- EVITE: releases de empresa, conteúdo genérico, promessas vagas`,

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

const PILLAR_FALLBACKS: Record<PillarId, string[]> = {
  'educational-value': [
    'instagram reels viral estratégia brasil',
    'algoritmo instagram tendências criadores 2026',
    'IA ferramentas criador conteúdo brasileiro',
  ],
  'wake-up-slap': [
    'criador conteúdo erros instagram brasil',
    'algoritmo instagram queda alcance 2026',
    'marketing digital verdade criadores BR',
  ],
  'brand-breakdown': [
    'estratégia marca instagram brasil 2026',
    'branding digital cases sucesso BR',
    'análise conteúdo marcas instagram brasil',
  ],
  'proof-social': [
    'automação conteúdo resultados mensuráveis brasil',
    'ROI marketing conteúdo instagram BR',
    'crescimento orgânico automatizado resultados',
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
 * Queries: max 7 words, Portuguese, prefer data/numbers.
 */
export async function generateShadowFeedQueries(
  input: QueryGeneratorInput
): Promise<string[]> {
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
      model: 'gpt-4.1-mini',
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
