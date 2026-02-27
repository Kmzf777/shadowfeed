import type { PersonalizedForgeContext, AudienceAwareness } from '../../shared/types/post-themes.types.js';
import type { PillarConfig, HookArchetypeId } from '../../shared/types/pillar.types.js';
import { getSystemPromptForTheme, VOICE_TONE_INSTRUCTIONS } from '../../shared/themes/post-themes.library.js';
import { FEW_SHOT_EXAMPLES } from '../forge/prompts/fewshot.prompt.js';
import type { HookArchetype } from '../pillar-system/hook-archetypes.js';
import { generateProductSeed, buildProductSeedPrompt } from '../pillar-system/product-seeding.js';

// ── Awareness Calibration Map (PRD §12) ─────────────────────────────────────
interface AwarenessCalibration {
  hookStrategy: string;
  contentDepth: string;
  ctaDirectness: string;
}

const AWARENESS_CALIBRATION: Record<AudienceAwareness, AwarenessCalibration> = {
  unaware: {
    hookStrategy: 'Use provocation or curiosity — the audience does NOT know they have this problem. Lead with shocking data, storytelling, or a pattern-interrupt that creates awareness before any pitch.',
    contentDepth: 'Heavy context needed. Explain the problem from scratch. Use analogies and real-world scenarios to build understanding.',
    ctaDirectness: 'Soft CTA only. Save/Share/Follow — no selling. The goal is awareness, not conversion.',
  },
  problem_aware: {
    hookStrategy: 'Validate the pain — the audience knows they struggle but not what to do. Open with a relatable frustration or "you\'ve tried X and it didn\'t work" angle.',
    contentDepth: 'Diagnosis + framework. Show WHY the problem persists and introduce a structured approach. Medium-length slides.',
    ctaDirectness: 'Medium. Engagement CTAs (comment, share) or soft lead-gen (DM for more). No hard sell.',
  },
  solution_aware: {
    hookStrategy: 'Differentiation + proof — the audience knows solutions exist. Lead with what makes THIS approach unique or superior. Use comparative angles.',
    contentDepth: 'Comparative content. Show advantages vs alternatives. Use specific metrics and case references.',
    ctaDirectness: 'Medium-direct. Can mention offers subtly. "Want the full framework? Link in bio."',
  },
  brand_aware: {
    hookStrategy: 'Specific results — the audience already knows the brand. Lead with concrete outcomes, case studies, or client transformations.',
    contentDepth: 'Case study depth. Detailed before/after, specific numbers, process documentation.',
    ctaDirectness: 'Direct. Can present offers openly. "Join 500+ who already..." or "Start today."',
  },
  most_aware: {
    hookStrategy: 'Direct offer — the audience trusts the brand. Go straight to the value proposition. No need to build awareness or trust.',
    contentDepth: 'Benefits + pricing focus. Concise, action-oriented. Skip the education.',
    ctaDirectness: 'Maximum directness. Hard CTA. "Buy now / Enroll today / DM [keyword] to start."',
  },
};

// ── Fallback defaults for null Setup V2 fields (AC: 10) ─────────────────────
function fb(value: string | null | undefined, fallback: string): string {
  return value && value.trim() ? value : fallback;
}

function fbArray(value: string[] | null | undefined, fallback: string[]): string[] {
  return value && value.length > 0 ? value : fallback;
}

export interface HookArchetypeInput {
  archetype: HookArchetype;
  filledTemplate: string;
}

export interface PersonalizedPromptResult {
  prompt: string;
  hookArchetypeId: HookArchetypeId;
}

/**
 * Build personalized forge prompt with 10-block pillar-aware architecture.
 *
 * Blocks: PERSONA → PILLAR RULES → AUDIENCE CONTEXT → COPY PHASES →
 *         SOURCE DOCUMENT → HOOK ARCHETYPE → PRODUCT SEED →
 *         ANTI-PATTERNS → AWARENESS CALIBRATION → OUTPUT FORMAT
 */
export function buildPersonalizedPrompt(ctx: PersonalizedForgeContext, hookInput?: HookArchetypeInput): PersonalizedPromptResult {
  const { source, userProfile, theme, pillar, product } = ctx;
  const niche = fb(userProfile.niche, 'general business');

  let prompt = '';

  // ── BLOCK 0: DATE CONTEXT (utility — not counted in 10) ─────────────────
  const now = new Date();
  const nowStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  prompt += `# CURRENT DATE\n`;
  prompt += `$now = ${nowStr}\n`;
  prompt += `IMPORTANT: When mentioning dates or time periods, use this date as reference.\n`;
  prompt += `NEVER write "in 2024 we still don't have..." if we're in 2026.\n\n`;

  // ── BLOCK 1: PERSONA (Dynamic from Setup V2) ───────────────────────────
  prompt += `# BLOCK 1 — PERSONA\n`;
  const personality = fbArray(userProfile.brand_personality, ['Professional', 'Knowledgeable']);
  const voiceTone = fb(userProfile.voice_tone, 'professional');
  const expertise = fb(userProfile.expertise_statement, `Expert in ${niche}`);

  prompt += `You are a content creator with the following identity:\n`;
  prompt += `- Brand personality: ${personality.join(', ')}\n`;
  prompt += `- Voice tone: ${voiceTone}\n`;
  prompt += `- Expertise: "${expertise}"\n`;
  prompt += `- Niche: ${niche}\n`;
  if (userProfile.instagram_handle) {
    prompt += `- Instagram: ${userProfile.instagram_handle} (@${userProfile.instagram_username || 'N/A'})\n`;
  }
  prompt += VOICE_TONE_INSTRUCTIONS[userProfile.voice_tone] || '';
  prompt += `\n`;

  // ── BLOCK 2: PILLAR RULES ──────────────────────────────────────────────
  prompt += `# BLOCK 2 — PILLAR RULES (${pillar.name.toUpperCase()})\n`;
  prompt += `Pillar objective: ${pillar.objective}\n`;
  prompt += `Tone override: ${pillar.toneOverride}\n`;
  prompt += `Slide range: ${pillar.slideRange.min}-${pillar.slideRange.max} slides\n`;
  prompt += `CTA style: ${pillar.ctaStyle}\n`;
  prompt += `Caption style: ${pillar.captionStyle}\n`;
  prompt += `\nREQUIRED ELEMENTS (must appear in the carousel):\n`;
  for (const el of pillar.requiredElements) {
    prompt += `- ${el}\n`;
  }
  prompt += `\nFORBIDDEN ELEMENTS (never include):\n`;
  for (const el of pillar.forbiddenElements) {
    prompt += `- ${el}\n`;
  }
  prompt += `\n`;

  // ── BLOCK 3: AUDIENCE CONTEXT ──────────────────────────────────────────
  prompt += `# BLOCK 3 — AUDIENCE CONTEXT\n`;
  prompt += `Target audience: ${fb(userProfile.target_audience, `People interested in ${niche}`)}\n`;
  prompt += `Main frustration: "${fb(userProfile.audience_frustration, `Common challenges in ${niche}`)}"\n`;
  prompt += `Core desire: "${fb(userProfile.audience_desire, `Success and growth in ${niche}`)}"\n`;
  prompt += `Common objection: "${fb(userProfile.audience_objection, `"I don't have time/money for this"`)}"\n`;
  prompt += `Awareness level: ${fb(userProfile.audience_awareness, 'problem_aware')}\n`;
  if (userProfile.audience_objection) {
    prompt += `COPY INSTRUCTION: In an intermediate slide, subtly break this objection without sounding defensive.\n`;
  }
  if (userProfile.transformation_before && userProfile.transformation_after) {
    prompt += `Transformation offered: From "${userProfile.transformation_before}" → "${userProfile.transformation_after}"\n`;
    prompt += `INSTRUCTION: Use this before/after contrast as a narrative device (hook, proof, or CTA).\n`;
  }
  prompt += `\n`;

  // ── BLOCK 4: COPY PHASES ───────────────────────────────────────────────
  prompt += `# BLOCK 4 — COPY PHASES\n`;
  prompt += `Every carousel follows a 3-phase copy structure:\n`;
  prompt += `Phase 1 — HOOK: Stop the scroll. First slide must create instant curiosity or tension.\n`;
  prompt += `Phase 2 — BODY: Deliver the value. Each content slide deepens understanding or builds proof.\n`;
  prompt += `Phase 3 — CTA: Close with purpose. The final slide drives action aligned with the pillar's CTA style.\n`;
  prompt += `Intensity calibration: Follow the "${pillar.name}" pillar tone — ${pillar.toneOverride}\n`;
  prompt += `\n`;

  // ── BLOCK 5: SOURCE DOCUMENT ───────────────────────────────────────────
  prompt += `# BLOCK 5 — SOURCE DOCUMENT\n`;
  prompt += `Title: ${source.title}\n`;
  prompt += `Summary: ${source.summary || 'Elaborate based on the title'}\n`;
  if (source.url) prompt += `URL: ${source.url}\n`;
  if (source.category) prompt += `Category: ${source.category}\n`;
  if (source.raw_content) {
    const truncated = source.raw_content.slice(0, 3000);
    prompt += `Content:\n${truncated}\n`;
  }
  prompt += `\n`;

  // ── BLOCK 6: HOOK ARCHETYPE (PDCE-05) ─────────────────────────────────
  prompt += `# BLOCK 6 — HOOK ARCHETYPE\n`;
  if (hookInput) {
    prompt += `Selected archetype: **${hookInput.archetype.name}** (${hookInput.archetype.id})\n`;
    prompt += `Description: ${hookInput.archetype.description}\n`;
    prompt += `Template pattern: "${hookInput.archetype.template}"\n`;
    prompt += `Personalized hook direction: "${hookInput.filledTemplate}"\n`;
    prompt += `\nINSTRUCTION: Use this hook archetype as the psychological pattern for slide 1.\n`;
    prompt += `You may adapt the wording but MUST follow the archetype's core pattern.\n`;
    prompt += `The hook must align with the "${pillar.name}" pillar's tone: ${pillar.toneOverride}\n`;
  } else {
    prompt += `Generate a compelling hook that stops the scroll.\n`;
    prompt += `The hook must align with the "${pillar.name}" pillar's tone and objective.\n`;
  }
  prompt += `\n`;

  // ── BLOCK 7: PRODUCT SEED (PDCE-08 — Graduated Intensity) ─────────────
  const seed = generateProductSeed(
    pillar,
    product?.enabled ? (ctx.userProfile as any).offers ?? (product.offer ? [product.offer] : null) : null,
    product?.enabled ?? false,
  );

  if (seed) {
    prompt += `# BLOCK 7 — PRODUCT SEED\n`;
    prompt += buildProductSeedPrompt(seed);
    prompt += `\n`;
  }
  // When seed is null (none intensity, no offers, or productMode off), Block 7 is omitted entirely

  // ── BLOCK 8: ANTI-PATTERNS ─────────────────────────────────────────────
  prompt += `# BLOCK 8 — ANTI-PATTERNS\n`;
  prompt += `NEVER do the following:\n`;
  for (const el of pillar.forbiddenElements) {
    prompt += `- ${el}\n`;
  }
  if (userProfile.avoid_topics) {
    prompt += `\nFORBIDDEN TOPICS: Do NOT mention or address: "${userProfile.avoid_topics}"\n`;
  }
  prompt += `\n`;

  // ── BLOCK 9: AWARENESS CALIBRATION ─────────────────────────────────────
  const awarenessLevel = (userProfile.audience_awareness || 'problem_aware') as AudienceAwareness;
  const calibration = AWARENESS_CALIBRATION[awarenessLevel];

  prompt += `# BLOCK 9 — AWARENESS CALIBRATION (Level: ${awarenessLevel})\n`;
  prompt += `Hook strategy: ${calibration.hookStrategy}\n`;
  prompt += `Content depth: ${calibration.contentDepth}\n`;
  prompt += `CTA directness: ${calibration.ctaDirectness}\n`;
  if (userProfile.content_depth) {
    const depthLabels: Record<string, string> = {
      shallow: 'Quick and direct — short posts, immediate impact. Strong headlines over long paragraphs.',
      balanced: 'Balanced — mix of quick data points and brief explanations.',
      dense: 'Dense and educational — long carousels with detailed value and concrete examples.',
    };
    prompt += `User depth preference: ${depthLabels[userProfile.content_depth] || userProfile.content_depth}\n`;
  }
  prompt += `\n`;

  // ── BLOCK 10: OUTPUT FORMAT ────────────────────────────────────────────
  prompt += `# BLOCK 10 — OUTPUT FORMAT\n`;
  prompt += `Create a complete ${theme.name.toLowerCase()} carousel about the topic above.\n`;
  prompt += `Decide autonomously the ideal number of slides (${pillar.slideRange.min}-${pillar.slideRange.max}) based on content depth.\n\n`;

  prompt += `IMAGE RULES:\n`;
  prompt += `- The hook (slide 1) MUST have image: true.\n`;
  prompt += `- You decide which content slides have images.\n`;
  prompt += `- image: true/false only. Do NOT generate image prompts.\n\n`;

  if (seed && seed.intensity === 'full') {
    prompt += `CTA RULES (FINAL SLIDE):\n`;
    prompt += `- REQUIRED: Use the product format as instructed in Block 7.\n`;
    prompt += `- The keyword "${seed.ctaKeyword}" MUST be in **bold**.\n`;
    prompt += `- Connect the product to the content presented in previous slides.\n\n`;
  } else {
    prompt += `CTA RULES (FINAL SLIDE):\n`;
    prompt += `- Use the pillar CTA style: ${pillar.ctaStyle}\n\n`;
  }

  prompt += `CAPTION RULES:\n`;
  prompt += `- Caption style: ${pillar.captionStyle}\n`;
  prompt += `- The caption MUST follow a 3-block structure separated by "---".\n`;
  prompt += `- Block 1: Editorial content.\n`;
  prompt += `- Block 2: SEO keywords.\n`;
  prompt += `- Block 3: Hashtags (max 5).\n\n`;

  prompt += `REQUIRED JSON FIELDS (root level):\n`;
  prompt += `- theme: String — the carousel title/theme (e.g., "5 AI Tools You Need").\n`;
  prompt += `- total_slides: Number — total number of slides.\n`;
  prompt += `- slides: Array of slide objects. Each slide has: role, headline, body_markdown, image (boolean).\n`;
  prompt += `- caption: String — 3-block caption separated by "---" (editorial + SEO keywords + hashtags).\n`;
  prompt += `- hashtags: Array of strings (e.g., ["#AI", "#Tech"]).\n`;
  prompt += `- cta_text: Short text for action button (e.g., "Learn more", "Save post").\n`;
  prompt += `- best_posting_time: Time suggestion (e.g., "18:00 BRT").\n\n`;

  prompt += FEW_SHOT_EXAMPLES;
  prompt += `\n`;

  prompt += `Follow the JSON format STRICTLY.\n`;
  prompt += `Return ONLY the JSON. No text before or after.\n`;

  return {
    prompt,
    hookArchetypeId: hookInput?.archetype.id ?? ('curiosity-mystery' as HookArchetypeId),
  };
}

/**
 * Get personalized system instruction enriched with brand personality and avoid topics
 */
export function getPersonalizedSystemInstruction(themeId: string, userProfile: {
  voice_tone: string;
  brand_personality?: string[] | null;
  avoid_topics?: string | null;
  niche?: string | null;
}): string {
  const basePrompt = getSystemPromptForTheme(themeId);

  let extra = `\n\n# PERSONALIZATION CONTEXT`;
  extra += `\nPrimary voice tone: ${userProfile.voice_tone}.`;

  if (userProfile.niche) {
    extra += `\nAuthor's niche: ${userProfile.niche}.`;
  }
  if (userProfile.brand_personality && userProfile.brand_personality.length > 0) {
    extra += `\nBrand personality: ${userProfile.brand_personality.join(', ')}.`;
  }
  if (userProfile.avoid_topics) {
    extra += `\nABSOLUTE RESTRICTION: Never address these topics: ${userProfile.avoid_topics}.`;
  }

  return `${basePrompt}${extra}`;
}
