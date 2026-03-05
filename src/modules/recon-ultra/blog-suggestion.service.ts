import { z } from 'zod';
import { gemini } from '../../config/gemini.js';
import { logger } from '../../config/logger.js';
import { supabase } from '../../config/supabase.js';

// ── Zod Schema ─────────────────────────────────────────────────
const BlogSuggestionSchema = z.object({
  blogs: z.array(
    z.object({
      url: z.string().url(),
      name: z.string().min(1),
      reason: z.string().min(1),
    })
  ).min(1).max(7),
});

export type BlogSuggestion = z.infer<typeof BlogSuggestionSchema>['blogs'][number];

// ── Main Function ──────────────────────────────────────────────
export async function suggestBlogsForNiche(
  niche: string,
  targetAudience: string | null,
  userId: string
): Promise<BlogSuggestion[]> {
  // 1. Get existing blogs for user (to exclude)
  const { data: existingBlogs } = await supabase
    .from('sf_user_blog_sources')
    .select('blog_url')
    .eq('user_id', userId);

  const existingUrls = new Set(
    (existingBlogs ?? []).map((b: { blog_url: string }) => b.blog_url.toLowerCase())
  );

  // 2. Call Gemini
  const model = gemini.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: 1024,
    },
  });

  const systemPrompt = `You are a blog discovery assistant for content creators.
Given a niche and target audience, suggest 5 authoritative, real blog URLs that would be valuable sources for content research.

RULES:
- Return ONLY real, publicly accessible blog URLs
- All URLs must use HTTPS
- No social media platforms (Twitter, Reddit, Instagram, TikTok, Facebook, LinkedIn, YouTube)
- No paywalled content
- Focus on industry-leading blogs, thought leaders, and authoritative sources
- Each suggestion must include the full URL, blog name, and a brief reason why it's relevant

Return JSON: { "blogs": [{ "url": "https://...", "name": "Blog Name", "reason": "Why this is relevant" }] }`;

  const userMessage = `Content creator niche: ${niche}
Target audience: ${targetAudience ?? 'Not specified'}

Suggest 5 authoritative blog sources for this creator's content research.`;

  const result = await model.generateContent({
    systemInstruction: systemPrompt,
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
  });

  const raw = result.response.text();
  const parsed = JSON.parse(raw);
  const validated = BlogSuggestionSchema.parse(parsed);

  // 3. Filter out already-added blogs
  const filtered = validated.blogs.filter(
    (blog) => !existingUrls.has(blog.url.toLowerCase())
  );

  // 4. Return top 3-5
  const suggestions = filtered.slice(0, 5);

  logger.info(
    { userId, niche, total: validated.blogs.length, afterFilter: suggestions.length },
    '[BLOG-SUGGEST] Suggestions generated'
  );

  return suggestions;
}
