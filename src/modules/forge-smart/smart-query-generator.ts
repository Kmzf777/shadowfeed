import { gemini } from '../../config/gemini.js';
import { logger } from '../../config/logger.js';
import type { SmartQueryGeneratorInput } from './forge-smart.types.js';
import type { PillarConfig } from '../../shared/types/pillar.types.js';
import { z } from 'zod';

const QueryOutputSchema = z.object({
  queries: z.array(z.string().min(3).max(80)).min(3).max(7),
});

function buildQuerySystemPrompt(pillar: PillarConfig): string {
  const angleCount = pillar.queryAngles.length;
  const angleList = pillar.queryAngles
    .map((angle, i) => `  ${i + 1}. ${angle}`)
    .join('\n');

  return `You are a content research specialist and SEO expert.
Given a content creator's profile, generate search queries to find RICH, DATA-BACKED content.

Return ONLY valid JSON: { "queries": ["query1", ..., "query${angleCount}"] }

PILLAR: ${pillar.name}
OBJECTIVE: ${pillar.objective}

Rules:
- Generate exactly ${angleCount} queries
- Each query must target a DISTINCT angle from this pillar:
${angleList}
- Queries in Portuguese (Brazilian Portuguese) for Brazilian audience
- No special characters, no quotes inside queries
- Maximum 7 words per query
- PREFER queries likely to return articles with: numbers, percentages, study results, expert quotes
- AVOID queries likely to return: press releases, product announcements, generic advice
- Be hyper-specific to the niche — a generic query is a wasted slot
- Every query must serve the pillar objective: ${pillar.objective}`;
}

export async function generateSmartQueries(
  input: SmartQueryGeneratorInput
): Promise<string[]> {
  const { pillarConfig } = input;
  const angleCount = pillarConfig.queryAngles.length;

  const userMessage = `Content creator profile:
- Niche: ${input.niche ?? 'Not specified'}
- Target audience: ${input.target_audience}
- Main pain point: ${input.main_pain_point}
- Voice tone: ${input.voice_tone}
- Business context: ${input.user_prompt ?? 'Not specified'}

Pillar: ${pillarConfig.name} — ${pillarConfig.description}
Query angles to cover: ${pillarConfig.queryAngles.join(', ')}

Generate ${angleCount} diverse search queries aligned to the "${pillarConfig.name}" pillar for this creator's audience.`;

  try {
    const model = gemini.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 2048,
      },
    });

    const geminiResult = await model.generateContent({
      systemInstruction: buildQuerySystemPrompt(pillarConfig),
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    });

    const raw = geminiResult.response.text();
    logger.debug({ raw: raw.slice(0, 300) }, '[FORGE-SMART:QUERY] Raw Gemini response');

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error(`Invalid JSON from Gemini: ${raw.slice(0, 100)}`);
      }
    }

    const validated = QueryOutputSchema.parse(parsed);

    logger.info(
      { queries: validated.queries, pillar: pillarConfig.id, targetAudience: input.target_audience },
      '[FORGE-SMART:QUERY] Pillar-driven queries generated'
    );

    return validated.queries;
  } catch (err) {
    logger.error(
      { error: (err as Error).message, pillar: pillarConfig.id },
      '[FORGE-SMART:QUERY] Query generation failed — using fallback'
    );
    const base = input.niche || input.target_audience;
    const year = new Date().getFullYear();
    return [
      `${base} ${pillarConfig.queryAngles[0] ?? 'tips'}`,
      `${base} ${pillarConfig.queryAngles[1] ?? 'trends'} ${year}`,
      `${base} ${pillarConfig.queryAngles[2] ?? 'strategies'}`,
      `${input.main_pain_point} solutions ${year}`,
      `${base} case study results`,
      input.main_pain_point,
    ].filter(Boolean);
  }
}
