// src/modules/forge-shadowfeed/discovery/shadowfeed-content-summarizer.ts

import { openai } from '../../../config/openai.js';
import { logger } from '../../../config/logger.js';
import type { ResearchDigest, PillarId } from '../forge-shadowfeed.types.js';

const SUMMARIZER_SYSTEM_PROMPT = `You are a content intelligence extractor for ShadowFeed, an AI-powered Instagram content engine focused on Brazilian digital marketing.

Your job: Extract structured insights from article text. Be precise and factual.

RULES:
- NEVER invent data points — only extract what is explicitly stated in the text
- If no concrete numbers exist, return an empty dataPoints array
- keyInsight must be exactly 1 sentence
- quotableLines should be 2-3 punchy lines usable as carousel slide headlines
- contentDepth: "shallow" (<500 chars or lacks data), "medium" (has some data/examples), "deep" (rich data, multiple sources, statistics)
- rawBody: return the first 3000 chars of the original text as-is

Return ONLY valid JSON matching the schema. No markdown, no extra text.`;

function buildUserPrompt(body: string, pillarId: PillarId): string {
  return `ARTICLE TEXT:
---
${body.slice(0, 4000)}
---

PILLAR CONTEXT: ${pillarId}

Extract a ResearchDigest with this exact JSON schema:
{
  "keyInsight": "string — 1-sentence core takeaway",
  "dataPoints": ["string — concrete numbers/percentages from the article. NEVER invent."],
  "provocativeAngle": "string — how to frame this as a wake-up-slap / controversy",
  "educationalAngle": "string — how to frame this as educational value content",
  "brandMentions": ["string — companies, tools, or brands mentioned"],
  "quotableLines": ["string — 2-3 punchy lines usable as slide headlines"],
  "contentDepth": "shallow | medium | deep",
  "rawBody": "string — first 3000 chars of original text"
}`;
}

/**
 * Summarize scraped article body into a structured ResearchDigest using gpt-4.1-mini.
 *
 * Returns null on failure — caller falls back to title-only discovery.
 */
export async function summarizeContent(
  body: string,
  pillarId: PillarId,
): Promise<ResearchDigest | null> {
  if (!body || body.length < 50) {
    logger.warn(
      { bodyLength: body?.length ?? 0 },
      '[SHADOWFEED:SUMMARIZE] Body too short to summarize',
    );
    return null;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      max_completion_tokens: 2048,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SUMMARIZER_SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(body, pillarId) },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);

    // Validate required fields
    if (!parsed.keyInsight || typeof parsed.keyInsight !== 'string') {
      logger.warn('[SHADOWFEED:SUMMARIZE] Missing keyInsight in LLM response');
      return null;
    }

    const digest: ResearchDigest = {
      keyInsight: parsed.keyInsight,
      dataPoints: Array.isArray(parsed.dataPoints) ? parsed.dataPoints : [],
      provocativeAngle: parsed.provocativeAngle ?? '',
      educationalAngle: parsed.educationalAngle ?? '',
      brandMentions: Array.isArray(parsed.brandMentions) ? parsed.brandMentions : [],
      quotableLines: Array.isArray(parsed.quotableLines) ? parsed.quotableLines : [],
      contentDepth: ['shallow', 'medium', 'deep'].includes(parsed.contentDepth)
        ? parsed.contentDepth
        : 'shallow',
      rawBody: body.slice(0, 3000),
    };

    logger.info(
      {
        keyInsight: digest.keyInsight.slice(0, 80),
        dataPointCount: digest.dataPoints.length,
        contentDepth: digest.contentDepth,
      },
      '[SHADOWFEED:SUMMARIZE] ResearchDigest extracted successfully',
    );

    return digest;
  } catch (err) {
    logger.warn(
      { error: (err as Error).message },
      '[SHADOWFEED:SUMMARIZE] Summarization failed — returning null',
    );
    return null;
  }
}
