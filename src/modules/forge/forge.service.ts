import { openai, OPENAI_MODEL } from '../../config/openai.js';
import { supabase } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import { buildForgePrompt, getSystemInstruction } from './prompt-builder.js';
import { parseAndValidateContent } from '../../shared/schemas/content-validator.js';
import { applyTheme } from '../../shared/themes/theme-applier.js';
import { EDITORIAL_THEME } from '../../shared/themes/editorial.theme.js';
import { retry } from '../../shared/utils/retry.js';
import { calculateRealCost } from '../../shared/utils/token-estimator.js';
import type { IntelSource, GeneratedPost } from '../../shared/types/global.types.js';

export async function forgeCarousel(
  sourceId?: string,
  manualTheme?: string,
  manualSource?: Partial<IntelSource>,
  userId?: string
): Promise<GeneratedPost> {
  // 1. Select intel source
  let source: IntelSource;

  if (sourceId) {
    const { data } = await supabase
      .from('sf_intel_sources')
      .select('*')
      .eq('id', sourceId)
      .single();
    source = data as IntelSource;
  } else if (manualSource || manualTheme) {
    source = {
      id: manualSource?.id || 'manual',
      source_type: 'manual',
      title: manualSource?.title || manualTheme || 'Untitled',
      summary: manualSource?.summary || null,
      url: manualSource?.url || null,
      author: manualSource?.author || null,
      category: manualSource?.category || 'ai_tools',
      source_score: manualSource?.source_score || null,
      source_comments: manualSource?.source_comments || null,
      relevance_score: 10,
      used: false,
      used_in_post_id: null,
      collected_at: new Date().toISOString(),
      expires_at: new Date().toISOString(),
      raw_content: manualSource?.raw_content,
    } as IntelSource;
  } else {
    // Pick top unused Twitter source
    const { data } = await supabase
      .from('sf_intel_sources')
      .select('*')
      .eq('used', false)
      .eq('source_type', 'twitter')
      .order('relevance_score', { ascending: false })
      .limit(1)
      .single();
    source = data as IntelSource;
  }

  if (!source) throw new Error('[FORGE] No intel source available');

  // 2. Build prompt
  const userPrompt = buildForgePrompt({ source });
  const systemInstruction = getSystemInstruction();

  // 3. Call OpenAI with retry
  const startTime = Date.now();

  const result = await retry(
    async () => {
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        max_completion_tokens: 8192, // Reduced from 16384 (content-only output)
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userPrompt },
        ],
      });

      const text = response.choices[0]?.message?.content || '';
      const usage = response.usage;

      // Validate content-only JSON
      const content = parseAndValidateContent(text, 'editorial');

      // Apply theme to generate full design JSON
      const carouselData = applyTheme(content, EDITORIAL_THEME);

      // Return carouselData, content, and usage
      return { carouselData, content, usage };
    },
    {
      retries: 2,
      delay: 3000,
      label: 'FORGE:openai',
    }
  );

  const generationTime = Date.now() - startTime;

  // result is now { carouselData, content, usage }
  const carouselData = result.carouselData;
  const content = result.content;
  const usage = result.usage;

  // Calculate token usage and cost
  const inputTokens = usage?.prompt_tokens ?? null;
  const outputTokens = usage?.completion_tokens ?? null;
  const generationCostUsd = inputTokens != null && outputTokens != null
    ? calculateRealCost(inputTokens, outputTokens)
    : null;

  // 4. Save to Supabase
  const { data: post, error } = await supabase
    .from('sf_posts')
    .insert({
      intel_source_id: source.id !== 'manual' ? source.id : null,
      user_id: userId || null,
      theme: carouselData.theme,
      style: carouselData.style,
      slides: carouselData.slides,
      slide_count: carouselData.total_slides,
      caption: carouselData.caption,
      hashtags: carouselData.hashtags,
      cta_text: carouselData.cta_text,
      posting_time: carouselData.best_posting_time,
      color_palette: carouselData.color_palette,
      fonts: carouselData.fonts,
      gemini_model: OPENAI_MODEL,
      generation_time_ms: generationTime,
      prompt_version: 'v4', // New content-only version
      status: 'draft',
      content_json: content, // Store original content-only JSON
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      generation_cost_usd: generationCostUsd,
    })
    .select()
    .single();

  if (error) throw new Error(`[FORGE] DB insert failed: ${error.message}`);

  // 5. Mark intel source as used
  if (source.id !== 'manual') {
    await supabase
      .from('sf_intel_sources')
      .update({ used: true, used_in_post_id: post.id })
      .eq('id', source.id);
  }

  logger.info(
    {
      postId: post.id,
      theme: carouselData.theme,
      slides: carouselData.total_slides,
      timeMs: generationTime,
      promptVersion: 'v4',
    },
    '[FORGE] Carousel forged successfully (content-only v4)'
  );

  return post as GeneratedPost;
}
