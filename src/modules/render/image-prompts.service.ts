import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { openai, OPENAI_MODEL } from '../../config/openai.js';
import { logger } from '../../config/logger.js';

// ── Types ──────────────────────────────────────────────────────────

interface SlideInput {
  slide: number;
  role: string;
  headline: string;
  body?: string | null;
  body_markdown?: string | null;
  layout: string;
  bg_color?: string;
  accent_color?: string;
  text_color?: string;
  image?: {
    type: string;
    prompt: string | null;
    url: string | null;
    style_ref?: string;
  } | null;
}

interface StructuredImagePrompt {
  slide: number;
  role: string;
  image_dimensions: string;
  image_placement: string;
  image_guidance: string | null;
  /** Flat text prompt for image generation, max 2000 characters */
  prompt: string;
  negative_prompt: string;
  style_keywords: string[];
}

const MAX_PROMPT_CHARS = 2000;

// ── System Prompt (AI-driven selection) ──────────────────────────

const IMAGE_PROMPT_SYSTEM = `You are a world-class art director. You receive ALL slides of an Instagram carousel and must:

1. DECIDE which slides should have images (maximum 6 images per carousel). Not every slide needs an image — text-heavy editorial slides often work better WITHOUT images.
2. For each selected slide, DETERMINE the correct image dimensions/placement based on its layout.
3. Generate a FLAT TEXT image prompt for each selected slide.

LAYOUT → IMAGE SPECIFICATION REFERENCE:
| Layout          | Dimensions              | Placement                                                        |
|-----------------|-------------------------|------------------------------------------------------------------|
| hero-image      | 4:5 vertical (1080×1350)| Full bleed background behind text with gradient overlay           |
| split-left      | 3:4 vertical (540×720)  | Image fills LEFT half of slide, content on right                  |
| split-right     | 3:4 vertical (540×720)  | Image fills RIGHT half of slide, content on left                  |
| hook (any layout)| 4:5 vertical (1080×1350)| Full bleed background, must leave negative space for headline     |

Slides with layouts like title-body, article-body, numbered-item, icon-title-body, list — these are TEXT-FOCUSED. Only give them images if it truly enhances the message.

SELECTION CRITERIA (use your editorial judgement):
- hook slides: almost always benefit from a dramatic image
- pattern-interrupt: strong candidate for visual break
- hero-image/split layouts: designed for images, high priority
- content/article-body: usually better without image (text-dense)
- cta: rarely needs image
- If a carousel has only 4-5 slides, 2-3 images may be enough
- If 10+ slides, 4-6 images create good rhythm

OUTPUT FORMAT: Return ONLY valid JSON with a "prompts" array. ONLY include slides you selected for images.
{
  "prompts": [
    {
      "slide": 1,
      "role": "hook",
      "image_dimensions": "4:5 vertical (1080x1350)",
      "image_placement": "Full bleed background behind text with gradient overlay",
      "image_guidance": null,
      "prompt": "A single flat-text image prompt. MAX 2000 CHARACTERS. Combine subject, camera, lighting, environment, mood, and color into one rich descriptive paragraph. Example: Ultra-realistic 8K editorial photograph of [subject with material/texture details], shot with [lens] at [aperture], [angle/perspective], [lighting description], [environment/setting], [color palette using slide bg_color and accent_color], [mood/atmosphere], [composition notes]. --no text, typography, watermarks",
      "negative_prompt": "text, typography, letters, words, watermarks, logos, UI, cartoon, anime, illustration, painting, sketch, low-res, blurry, pixelated, overexposed, underexposed, CGI, plastic, stock-photo, oversaturated, deformed, extra limbs",
      "style_keywords": ["keyword1", "keyword2"]
    }
  ]
}

RULES:
- The "prompt" field is a FLAT STRING (NOT a nested object). Max 2000 characters.
- Ultra-realistic, cinematic, 8K editorial photography. NEVER include text/typography in image.
- Include material and texture details for the main subject.
- Use technically correct camera specs (real lenses, valid f-stops).
- Use the slide's bg_color and accent_color as color palette base.
- negative_prompt MUST include: text, typography, letters, words, watermarks, logos, UI, cartoon, anime, illustration, painting, sketch, low-res, blurry, pixelated, overexposed, underexposed, CGI, plastic, stock-photo, oversaturated, deformed, extra limbs
- All prompts in ENGLISH.
- style_keywords: 5-10 keywords max.

ROLE-SPECIFIC STYLE:
- hook: DRAMATIC, extreme angle, bold, large negative space for headline.
- content: contextual, editorial, subtle.
- pattern-interrupt: CONTRASTING, abstract, inverted colors, unusual angle.
- conflict: TENSION, hard shadows, threatening.
- conclusion: PANORAMIC, synthesis, golden/warm lighting.

image_guidance: ONLY when slide mentions specific real person/company/product. Otherwise null.`;

// ── OpenAI Generation (single call, AI selects slides) ───────────

async function generateImagePrompts(
  slides: SlideInput[],
  theme: string,
  style: string
): Promise<StructuredImagePrompt[]> {
  const userContent = JSON.stringify({
    theme,
    style,
    total_slides: slides.length,
    slides: slides.map((s) => ({
      slide: s.slide,
      role: s.role,
      headline: s.headline,
      body_summary: (s.body_markdown || s.body || '').slice(0, 200),
      layout: s.layout,
      bg_color: s.bg_color || '#050511',
      accent_color: s.accent_color || '#FF4500',
    })),
  });

  logger.info(
    { totalSlides: slides.length, model: OPENAI_MODEL },
    '[IMAGE-PROMPTS] Sending all slides to AI for selection + prompt generation'
  );

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    response_format: { type: 'json_object' },
    max_completion_tokens: 6000,
    messages: [
      { role: 'system', content: IMAGE_PROMPT_SYSTEM },
      { role: 'user', content: userContent },
    ],
  });

  const text = response.choices[0]?.message?.content || '{}';

  let parsed: { prompts: StructuredImagePrompt[] };
  try {
    parsed = JSON.parse(text) as { prompts: StructuredImagePrompt[] };
  } catch (parseErr) {
    logger.error(
      { rawResponse: text.slice(0, 500), error: (parseErr as Error).message },
      '[IMAGE-PROMPTS] Failed to parse OpenAI JSON response'
    );
    throw new Error('[IMAGE-PROMPTS] OpenAI returned invalid JSON');
  }

  if (!parsed.prompts || !Array.isArray(parsed.prompts)) {
    logger.error(
      { keys: Object.keys(parsed), rawResponse: text.slice(0, 500) },
      '[IMAGE-PROMPTS] OpenAI response missing "prompts" array'
    );
    throw new Error('[IMAGE-PROMPTS] OpenAI response missing "prompts" array');
  }

  // Safety cap: enforce max 6 even if AI returns more
  // Also enforce MAX_PROMPT_CHARS on each prompt
  const prompts = parsed.prompts.slice(0, 6).map((p) => ({
    ...p,
    prompt: typeof p.prompt === 'string'
      ? p.prompt.slice(0, MAX_PROMPT_CHARS)
      : String(p.prompt).slice(0, MAX_PROMPT_CHARS),
  }));

  logger.info(
    {
      selectedSlides: prompts.map((p) => p.slide),
      imageCount: prompts.length,
    },
    '[IMAGE-PROMPTS] AI selected slides for images'
  );

  return prompts.sort((a, b) => a.slide - b.slide);
}

// ── File & Display ────────────────────────────────────────────────

function savePromptsToFile(
  prompts: StructuredImagePrompt[],
  theme: string,
  outputDir: string
): string {
  const filepath = join(outputDir, 'image-prompts.json');

  writeFileSync(
    filepath,
    JSON.stringify(
      {
        carousel_theme: theme,
        generated_at: new Date().toISOString(),
        total_images: prompts.length,
        prompts,
      },
      null,
      2
    ),
    'utf-8'
  );

  return filepath;
}

function displayPromptsSummary(
  prompts: StructuredImagePrompt[],
  totalSlides: number,
  savedPath: string
): void {
  logger.info(
    {
      totalSlides,
      imagesSelected: prompts.length,
      slideNumbers: prompts.map((p) => p.slide),
      promptsFile: savedPath,
    },
    '[IMAGE-PROMPTS] Prompts saved. Add images later to renderer/public/slides/ (e.g. 1.png, 6.png)'
  );
}

// ── Image File Detection ──────────────────────────────────────────

function findImageFile(slidesDir: string, slideNumber: number): string | null {
  if (!existsSync(slidesDir)) return null;

  const extensions = ['.png', '.jpg', '.jpeg', '.webp'];
  const files = readdirSync(slidesDir);

  for (const ext of extensions) {
    const filename = `${slideNumber}${ext}`;
    if (files.includes(filename)) {
      return `/slides/${filename}`;
    }
  }

  return null;
}

function updateSlidesWithImages(
  allSlides: SlideInput[],
  prompts: StructuredImagePrompt[]
): SlideInput[] {
  const slidesDir = join(process.cwd(), 'renderer', 'public', 'slides');
  const promptSlideNumbers = new Set(prompts.map((p) => p.slide));

  return allSlides.map((slide) => {
    if (!promptSlideNumbers.has(slide.slide)) return slide;

    const imageUrl = findImageFile(slidesDir, slide.slide);
    const promptData = prompts.find((p) => p.slide === slide.slide);

    if (imageUrl) {
      return {
        ...slide,
        image: {
          type: 'upload' as const,
          prompt: promptData?.prompt || slide.image?.prompt || null,
          url: imageUrl,
          style_ref: slide.image?.style_ref,
        },
      };
    } else {
      logger.warn({ slide: slide.slide }, '[IMAGE-PROMPTS] No image found for slide');
      return slide;
    }
  });
}

// ── Main Export ────────────────────────────────────────────────────

export async function generateImagePromptsAndWait(
  slides: unknown[],
  theme: string,
  style: string = 'editorial-mono'
): Promise<unknown[]> {
  const typedSlides = slides as SlideInput[];

  // 1. Ensure renderer/public/slides/ exists
  const slidesDir = join(process.cwd(), 'renderer', 'public', 'slides');
  if (!existsSync(slidesDir)) {
    mkdirSync(slidesDir, { recursive: true });
  }

  // 2. Send ALL slides to OpenAI — AI decides which get images (max 6)
  const prompts = await generateImagePrompts(typedSlides, theme, style);
  logger.info(
    {
      totalSlides: typedSlides.length,
      imagesSelected: prompts.length,
      slideNumbers: prompts.map((p) => p.slide),
    },
    '[IMAGE-PROMPTS] Structured prompts generated'
  );

  // 3. Save full prompts JSON to file
  const savedPath = savePromptsToFile(prompts, theme, slidesDir);

  // 4. Log summary (no blocking — images can be added manually later)
  displayPromptsSummary(prompts, typedSlides.length, savedPath);

  // 5. Update slides with any images already present, otherwise continue without
  const updatedSlides = updateSlidesWithImages(typedSlides, prompts);

  const foundCount = updatedSlides.filter(
    (s) => s.image?.url && s.image.type === 'upload'
  ).length;

  logger.info(
    { total: typedSlides.length, withImages: foundCount },
    '[IMAGE-PROMPTS] Slides updated with images'
  );

  return updatedSlides;
}
