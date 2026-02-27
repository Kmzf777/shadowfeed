import { gemini } from '../../config/gemini.js';
import { supabase } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import { buildPersonalizedPrompt, getPersonalizedSystemInstruction } from './prompt-builder.js';
import { selectHookArchetype, populateHookVariables } from '../pillar-system/hook-archetypes.js';
import { parseAndValidateContent } from '../../shared/schemas/content-validator.js';
import { applyTheme } from '../../shared/themes/theme-applier.js';
import { extractKeywordFromSlide } from '../../shared/utils/keyword-extractor.js';
import { fetchPexelsImageByKeyword } from '../../shared/services/pexels.service.js';
import { scrapeUrl } from '../manual-news/url-scraper.js';
import { getThemeConfig, getThemeById, POST_THEMES } from '../../shared/themes/post-themes.library.js';
import { retry } from '../../shared/utils/retry.js';
import { calculateRealCost, calculateTokensRequired } from '../../shared/utils/token-estimator.js';
import { hasEnoughTokens, deductTokens } from '../credits/credits.service.js';
import { getPillarConfig } from '../pillar-system/pillar.service.js';
import type { GeneratedPost } from '../../shared/types/global.types.js';
import type { ForgePersonalizedRequest } from './forge-personalized.types.js';
import type { UserProfile, PersonalizedForgeContext } from '../../shared/types/post-themes.types.js';

/**
 * Fetch user profile from Supabase
 */
async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      logger.error({ error, userId }, '[FORGE-PERSONALIZED] Failed to fetch user profile');
      return null;
    }

    return data as UserProfile;
  } catch (err) {
    logger.error({ error: err, userId }, '[FORGE-PERSONALIZED] Error fetching user profile');
    return null;
  }
}

/**
 * Fetch content from URL (direct scraping)
 */
async function fetchUrlContent(url: string): Promise<{ title: string; summary: string; rawContent: string }> {
  try {
    const scraped = await scrapeUrl(url);

    return {
      title: scraped.title,
      summary: scraped.content.slice(0, 500), // Create a brief summary
      rawContent: scraped.content,
    };
  } catch (err) {
    logger.error({ error: err, url }, '[FORGE-PERSONALIZED] Failed to fetch URL content');
    throw new Error('Could not extract content from URL');
  }
}

/**
 * Create carousel with personalized content
 */
export async function forgePersonalizedCarousel(
  request: ForgePersonalizedRequest
): Promise<GeneratedPost> {
  const { url, title, summary, rawContent, category, themeId, userId, pillarId, productMode, offer, modelConfigId } = request;

  // Map modelConfigId to Gemini model name
  const geminiModelName = modelConfigId === 'copywriter'
    ? 'gemini-3-flash-preview'
    : 'gemini-2.5-flash';


  // 1. Validate theme
  const theme = getThemeById(themeId);
  if (!theme) {
    throw new Error(`[FORGE-PERSONALIZED] Invalid theme: ${themeId}`);
  }

  // 2. Fetch user profile
  const userProfile = await getUserProfile(userId);
  if (!userProfile) {
    throw new Error('[FORGE-PERSONALIZED] User profile not found or incomplete');
  }

  if (!userProfile.setup_completed) {
    throw new Error('[FORGE-PERSONALIZED] User must complete setup first');
  }

  // 2b. Check credits
  const tokenCheck = await hasEnoughTokens(userId, themeId, !!productMode);
  if (!tokenCheck.enough) {
    throw new Error(
      `[FORGE-PERSONALIZED] Insufficient tokens: has ${tokenCheck.planRemaining + (tokenCheck.freeTokens ?? 0) + tokenCheck.extraTokens}, needs ${tokenCheck.required}`
    );
  }

  // 3. Get source content
  let sourceContent = { title: '', summary: null as string | null, url: null as string | null, rawContent: '' };

  if (url) {
    const fetched = await fetchUrlContent(url);
    sourceContent = {
      title: fetched.title,
      summary: fetched.summary,
      url,
      rawContent: fetched.rawContent,
    };
  } else {
    sourceContent = {
      title: title || 'Custom Content',
      summary: summary || null,
      url: null,
      rawContent: rawContent || '',
    };
  }

  // 4. Resolve pillar config (defaults to 'educate')
  const pillarConfig = getPillarConfig(pillarId);

  // 5. Build personalized prompt
  const context: PersonalizedForgeContext = {
    source: {
      title: sourceContent.title,
      summary: sourceContent.summary,
      url: sourceContent.url,
      category: category || null,
      raw_content: sourceContent.rawContent,
    },
    userProfile,
    theme,
    pillar: pillarConfig,
    product: productMode && offer ? {
      enabled: true,
      offer,
    } : undefined,
  };

  // 5b. Select hook archetype with anti-repeat logic
  const hookArchetype = await selectHookArchetype(pillarConfig, userId, supabase);
  const filledHookTemplate = populateHookVariables(hookArchetype, userProfile);

  const { prompt: userPrompt, hookArchetypeId } = buildPersonalizedPrompt(context, {
    archetype: hookArchetype,
    filledTemplate: filledHookTemplate,
  });
  const systemInstruction = getPersonalizedSystemInstruction(themeId, userProfile);

  logger.info(
    {
      userId,
      themeId,
      themeName: theme.name,
      pillarId: pillarConfig.id,
      pillarName: pillarConfig.name,
      hookArchetype: hookArchetypeId,
      geminiModel: geminiModelName,
      voiceTone: userProfile.voice_tone,
      targetAudience: userProfile.target_audience,
    },
    '[FORGE-PERSONALIZED] Building personalized prompt'
  );

  // 6. Call Gemini 2.5 Flash with retry
  const startTime = Date.now();

  const result = await retry(
    async () => {
      const model = gemini.getGenerativeModel({
        model: geminiModelName,
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 8192,
        },
      });

      const geminiResult = await model.generateContent({
        systemInstruction: systemInstruction,
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      });

      const text = geminiResult.response.text();
      const usage = geminiResult.response.usageMetadata;

      // Validate content-only JSON
      const content = parseAndValidateContent(text);

      // ENRIQUECIMENTO VISUAL SEM IA (Pexels)
      const slidesWithImages = await Promise.all(content.slides.map(async (slide, index) => {
        if (slide.image) {
          const isHook = index === 0;
          const localKeyword = extractKeywordFromSlide(slide.headline, slide.body_markdown, 'business');
          logger.info({ slideIndex: index, keyword: localKeyword, isHook }, '[PEXELS] Extracting keyword for slide');
          const pexelsData = await fetchPexelsImageByKeyword(localKeyword, isHook);
          if (pexelsData) {
            return { ...slide, image_keyword: localKeyword, image_url: pexelsData.url, image_credit: pexelsData.photographer };
          }
        }
        return slide;
      }));
      content.slides = slidesWithImages as any;

      // Apply theme to generate full design JSON
      const themeConfig = getThemeConfig(themeId);
      const carouselData = applyTheme(content, themeConfig);

      return { carouselData, content, usage };
    },
    {
      retries: 2,
      delay: 3000,
      label: 'FORGE-PERSONALIZED:gemini',
    }
  );

  const generationTime = Date.now() - startTime;
  const carouselData = result.carouselData;
  const content = result.content;
  const usage = result.usage;

  // Calculate token usage and cost
  const inputTokens = usage?.promptTokenCount ?? null;
  const outputTokens = usage?.candidatesTokenCount ?? null;
  const generationCostUsd = inputTokens != null && outputTokens != null
    ? calculateRealCost(inputTokens, outputTokens, geminiModelName)
    : null;
  const tokensUsed = calculateTokensRequired(themeId, !!productMode);

  // 7. Save to Supabase
  const { data: post, error } = await supabase
    .from('sf_posts')
    .insert({
      intel_source_id: null, // Manual posts don't have intel sources
      user_id: userId,
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
      pillar_id: pillarConfig.id,
      hook_archetype: hookArchetypeId,
      gemini_model: geminiModelName,
      generation_time_ms: generationTime,
      prompt_version: `personalized-${pillarConfig.id}-${themeId}`,
      status: 'draft',
      content_json: content,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      generation_cost_usd: generationCostUsd,
      credits_used: tokensUsed,
    })
    .select()
    .single();

  if (error) throw new Error(`[FORGE-PERSONALIZED] DB insert failed: ${error.message}`);

  // 8. Deduct credits after successful generation
  try {
    await deductTokens(
      userId,
      tokensUsed,
      post.id,
      `Post gerado: ${theme.name}${productMode ? ' + Produto' : ''}`
    );
  } catch (creditError) {
    logger.error({ error: creditError, postId: post.id, userId }, '[FORGE-PERSONALIZED] Failed to deduct credits (post was created)');
  }

  logger.info(
    {
      postId: post.id,
      userId,
      themeId,
      themeName: theme.name,
      pillarId: pillarConfig.id,
      slides: carouselData.total_slides,
      timeMs: generationTime,
      inputTokens,
      outputTokens,
      costUsd: generationCostUsd,
      tokensUsed,
    },
    '[FORGE-PERSONALIZED] Carousel forged successfully'
  );

  return post as GeneratedPost;
}

/**
 * Get all available themes
 */
export function getAvailableThemes() {
  return POST_THEMES;
}
