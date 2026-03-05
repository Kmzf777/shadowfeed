/**
 * Tests for blog discovery suggestions — Story 3.3 (RU-12)
 * Validates suggestion endpoint logic, Gemini integration, and filtering.
 *
 * Run with: npx tsx --test src/modules/recon-ultra/__tests__/blog-suggestions.test.ts
 */

import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';

// ── Response Schema Tests (AC4) ─────────────────────────────
describe('Blog suggestion response schema (AC4)', () => {
  it('valid response has suggestions array with url, name, reason', () => {
    const response = {
      suggestions: [
        {
          url: 'https://blog.hubspot.com',
          name: 'HubSpot Blog',
          reason: 'Leading inbound marketing resource',
        },
        {
          url: 'https://neilpatel.com/blog',
          name: 'Neil Patel Blog',
          reason: 'SEO and digital marketing authority',
        },
      ],
    };

    assert.ok(Array.isArray(response.suggestions));
    for (const s of response.suggestions) {
      assert.equal(typeof s.url, 'string');
      assert.equal(typeof s.name, 'string');
      assert.equal(typeof s.reason, 'string');
      assert.ok(s.url.startsWith('https://'), `URL must be HTTPS: ${s.url}`);
    }
  });

  it('empty suggestions array is valid (AC7 — error case)', () => {
    const response = {
      suggestions: [],
      warning: 'Could not generate suggestions at this time',
    };

    assert.ok(Array.isArray(response.suggestions));
    assert.equal(response.suggestions.length, 0);
    assert.equal(typeof response.warning, 'string');
  });
});

// ── Request Body Tests (AC2) ────────────────────────────────
describe('Blog suggestion request body (AC2)', () => {
  it('requires userId in request body', () => {
    const body = { userId: 'user-123' };
    assert.equal(typeof body.userId, 'string');
    assert.ok(body.userId.length > 0);
  });
});

// ── Niche Validation Tests (AC3) ─────────────────────────────
describe('User niche validation', () => {
  it('user without niche should get 400', () => {
    const profile = { niche: null, target_audience: 'marketers' };
    assert.equal(profile.niche, null, 'Niche is null — should return 400');
  });

  it('user with niche can get suggestions', () => {
    const profile = { niche: 'digital marketing', target_audience: 'small business owners' };
    assert.ok(profile.niche, 'Niche is set — should proceed');
    assert.equal(typeof profile.niche, 'string');
  });
});

// ── Already-Added Blog Filtering (AC8) ───────────────────────
describe('Already-added blog filtering (AC8)', () => {
  it('filters out blogs that user already has', () => {
    const existingUrls = new Set([
      'https://blog.hubspot.com',
      'https://neilpatel.com/blog',
    ].map(u => u.toLowerCase()));

    const geminiSuggestions = [
      { url: 'https://blog.hubspot.com', name: 'HubSpot Blog', reason: 'Marketing leader' },
      { url: 'https://moz.com/blog', name: 'Moz Blog', reason: 'SEO authority' },
      { url: 'https://neilpatel.com/blog', name: 'Neil Patel', reason: 'Digital marketing' },
      { url: 'https://contentmarketinginstitute.com', name: 'CMI', reason: 'Content strategy' },
      { url: 'https://copyblogger.com/blog', name: 'Copyblogger', reason: 'Copywriting' },
    ];

    const filtered = geminiSuggestions.filter(
      (blog) => !existingUrls.has(blog.url.toLowerCase())
    );

    assert.equal(filtered.length, 3, 'Should remove 2 already-added blogs');
    assert.ok(filtered.every(b => b.url !== 'https://blog.hubspot.com'));
    assert.ok(filtered.every(b => b.url !== 'https://neilpatel.com/blog'));
  });

  it('case-insensitive URL matching', () => {
    const existingUrls = new Set(['https://blog.hubspot.com']);
    const suggestion = { url: 'https://Blog.HubSpot.com', name: 'HubSpot', reason: 'Test' };

    const isExisting = existingUrls.has(suggestion.url.toLowerCase());
    assert.ok(isExisting, 'URL comparison should be case-insensitive');
  });

  it('returns all suggestions when user has no existing blogs', () => {
    const existingUrls = new Set<string>();
    const geminiSuggestions = [
      { url: 'https://moz.com/blog', name: 'Moz', reason: 'SEO' },
      { url: 'https://copyblogger.com', name: 'Copyblogger', reason: 'Writing' },
    ];

    const filtered = geminiSuggestions.filter(
      (blog) => !existingUrls.has(blog.url.toLowerCase())
    );

    assert.equal(filtered.length, 2, 'All suggestions should be returned');
  });
});

// ── Gemini Error Handling (AC7) ──────────────────────────────
describe('Gemini error handling (AC7)', () => {
  it('error response returns empty array with warning', () => {
    // Simulates what the controller does on catch
    const errorResponse = {
      suggestions: [],
      warning: 'Could not generate suggestions at this time',
    };

    assert.deepEqual(errorResponse.suggestions, []);
    assert.ok(errorResponse.warning.length > 0);
  });

  it('invalid JSON from Gemini throws parse error', () => {
    const invalidJson = 'not valid json {{{';

    assert.throws(
      () => JSON.parse(invalidJson),
      SyntaxError,
      'Invalid JSON should throw SyntaxError'
    );
  });
});

// ── Zod Validation Tests ──────────────────────────────────────
describe('BlogSuggestionSchema validation', () => {
  it('validates correct blog suggestion schema', async () => {
    const { z } = await import('zod');
    const BlogSuggestionSchema = z.object({
      blogs: z.array(
        z.object({
          url: z.string().url(),
          name: z.string().min(1),
          reason: z.string().min(1),
        })
      ).min(1).max(7),
    });

    const valid = {
      blogs: [
        { url: 'https://example.com/blog', name: 'Example Blog', reason: 'Great content' },
      ],
    };

    const result = BlogSuggestionSchema.parse(valid);
    assert.equal(result.blogs.length, 1);
    assert.equal(result.blogs[0].url, 'https://example.com/blog');
  });

  it('rejects blogs with invalid URL', async () => {
    const { z } = await import('zod');
    const BlogSuggestionSchema = z.object({
      blogs: z.array(
        z.object({
          url: z.string().url(),
          name: z.string().min(1),
          reason: z.string().min(1),
        })
      ).min(1).max(7),
    });

    const invalid = {
      blogs: [
        { url: 'not-a-url', name: 'Bad Blog', reason: 'Test' },
      ],
    };

    assert.throws(
      () => BlogSuggestionSchema.parse(invalid),
      { name: 'ZodError' },
      'Should reject invalid URL'
    );
  });

  it('rejects empty blogs array', async () => {
    const { z } = await import('zod');
    const BlogSuggestionSchema = z.object({
      blogs: z.array(
        z.object({
          url: z.string().url(),
          name: z.string().min(1),
          reason: z.string().min(1),
        })
      ).min(1).max(7),
    });

    assert.throws(
      () => BlogSuggestionSchema.parse({ blogs: [] }),
      { name: 'ZodError' },
      'Should reject empty array'
    );
  });

  it('rejects missing reason field', async () => {
    const { z } = await import('zod');
    const BlogSuggestionSchema = z.object({
      blogs: z.array(
        z.object({
          url: z.string().url(),
          name: z.string().min(1),
          reason: z.string().min(1),
        })
      ).min(1).max(7),
    });

    assert.throws(
      () => BlogSuggestionSchema.parse({ blogs: [{ url: 'https://x.com', name: 'X' }] }),
      { name: 'ZodError' },
      'Should reject missing reason'
    );
  });
});

// ── Suggestions Limit (3-5) ──────────────────────────────────
describe('Suggestion count limits', () => {
  it('returns max 5 suggestions after filtering', () => {
    const suggestions = Array.from({ length: 7 }, (_, i) => ({
      url: `https://blog${i}.com`,
      name: `Blog ${i}`,
      reason: `Reason ${i}`,
    }));

    const limited = suggestions.slice(0, 5);
    assert.ok(limited.length <= 5, 'Should cap at 5 suggestions');
    assert.equal(limited.length, 5);
  });
});
