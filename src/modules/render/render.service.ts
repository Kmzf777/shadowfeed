import { supabase } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import { captureSlides } from './capture.js';
import { startSlideServer, stopSlideServer } from './slide-server.js';
import { generateImagePromptsAndWait } from './image-prompts.service.js';
import type { RenderResult } from './render.types.js';

export async function renderPost(postId: string): Promise<RenderResult> {
  // 1. Fetch post from Supabase
  const { data: post, error } = await supabase
    .from('sf_posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (error || !post) {
    throw new Error(`[RENDER] Post not found: ${postId}`);
  }

  if (post.status !== 'draft') {
    throw new Error(`[RENDER] Post status is "${post.status}", expected "draft"`);
  }

  const slides = post.slides as unknown[];
  if (!slides || slides.length === 0) {
    throw new Error(`[RENDER] Post has no slides`);
  }

  // 2. Generate image prompts and wait for user upload
  const updatedSlides = await generateImagePromptsAndWait(
    slides,
    post.theme,
    post.style
  );

  // 2.5. Logo extraction logic
  // If the last slide (likely CTA) has an uploaded image (logo), use it as the profile avatar
  // for all slides (branding consistency).
  let globalAvatarUrl: string | undefined;

  // Check specifically the last slide or any slide with role='cta' that has an image
  const potentialLogoSlide = [...updatedSlides].reverse().find(
    (s) => (s as any).image?.url && (s as any).image.type === 'upload'
  );

  if (potentialLogoSlide) {
    globalAvatarUrl = (potentialLogoSlide as any).image.url;
    logger.info(
      { slide: (potentialLogoSlide as any).slide, url: globalAvatarUrl },
      '[RENDER] Found authoritative logo/avatar in slides, applying to profile'
    );
  }

  // 3. Start slide server (serves the React app build + public images)
  await startSlideServer();

  try {
    // 4. Capture all slides with Puppeteer
    const fullJson: Record<string, unknown> = {
      theme: post.theme,
      style: post.style,
      total_slides: post.slide_count,
      color_palette: post.color_palette,
      fonts: post.fonts,
      branding: post.branding || { name: 'Vistra IA', handle: '@vistra.ai' },
      slides: updatedSlides,
      caption: post.caption,
      hashtags: post.hashtags,
      cta_text: post.cta_text,
      best_posting_time: post.posting_time,
    };

    // Include profile data for tweet-thread carousels
    if (post.profile) {
      fullJson.profile = post.profile;
      if (globalAvatarUrl) {
        (fullJson.profile as any).avatar_url = globalAvatarUrl;
      }
    } else if (globalAvatarUrl) {
      // If no profile exists but we found a logo, create/patch a default one
      fullJson.profile = {
        display_name: 'Vistra IA',
        username: '@vistra.ai',
        avatar_url: globalAvatarUrl,
        verified: true,
      };
    }

    const paths = await captureSlides(postId, updatedSlides, fullJson);

    // 5. Update post in Supabase
    const { error: updateError } = await supabase
      .from('sf_posts')
      .update({
        status: 'rendered',
        rendered_paths: paths,
        rendered_at: new Date().toISOString(),
      })
      .eq('id', postId);

    if (updateError) {
      throw new Error(`[RENDER] Failed to update post status: ${updateError.message}`);
    }

    logger.info({ postId, slides: paths.length }, '[RENDER] Post rendered successfully');

    return {
      postId,
      slideCount: paths.length,
      paths,
      outputDir: paths[0]?.replace(/\/[^/]+$/, '') || '',
    };
  } finally {
    await stopSlideServer();
  }
}
