import { openai } from '../../config/openai.js';
import { logger } from '../../config/logger.js';
import type { SmartQueryGeneratorInput } from './forge-smart.types.js';
import { z } from 'zod';

const QueryOutputSchema = z.object({
  queries: z.array(z.string().min(3).max(80)).min(3).max(7),
});

const QUERY_GENERATOR_SYSTEM = `You are a content research specialist and SEO expert.
Given a content creator's profile, generate search queries to find RICH, DATA-BACKED content.

Return ONLY valid JSON: { "queries": ["query1", "query2", "query3", "query4", "query5"] }

Rules:
- Generate exactly 5 queries
- Each query must have a DISTINCT angle:
  1. trending: what is happening RIGHT NOW in this niche (news, launch, change)
  2. pain: content directly addressing the main pain point with evidence or stories
  3. solution: how-to / actionable tips backed by data or expert opinion
  4. story: real case study, success story, or cautionary tale from this niche
  5. data: statistic, survey result, or research finding from the last 90 days
- Queries in English for maximum coverage
- No special characters, no quotes inside queries
- Maximum 7 words per query
- PREFER queries likely to return articles with: numbers, percentages, study results, expert quotes
- AVOID queries likely to return: press releases, product announcements, generic advice
- Be hyper-specific to the niche — a generic query is a wasted slot`;

export async function generateSmartQueries(
  input: SmartQueryGeneratorInput
): Promise<string[]> {
  const userMessage = `Content creator profile:
- Niche: ${input.niche ?? 'Not specified'}
- Target audience: ${input.target_audience}
- Main pain point: ${input.main_pain_point}
- Voice tone: ${input.voice_tone}
- Business context: ${input.user_prompt ?? 'Not specified'}

Generate 5 diverse search queries to find relevant content for this creator's audience.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_completion_tokens: 512,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: QUERY_GENERATOR_SYSTEM },
        { role: 'user', content: userMessage },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);
    const validated = QueryOutputSchema.parse(parsed);

    logger.info(
      { queries: validated.queries, targetAudience: input.target_audience },
      '[FORGE-SMART:QUERY] Queries generated'
    );

    return validated.queries;
  } catch (err) {
    logger.error(
      { error: (err as Error).message },
      '[FORGE-SMART:QUERY] Query generation failed — using fallback'
    );
    // Fallback: derive queries from profile (prefer niche when available)
    const base = input.niche || input.target_audience;
    return [
      input.main_pain_point,
      `${base} tips`,
      `${base} trends 2026`,
    ].filter(Boolean);
  }
}
