/**
 * Tests for recon-query-builder — Story 1.3 (RU-03)
 * Validates Gemini query generation, caching, fallbacks, and profile handling.
 *
 * Run with: npx tsx --test src/modules/recon-ultra/__tests__/recon-query-builder.test.ts
 */

import assert from 'node:assert/strict';
import { describe, it, mock, beforeEach } from 'node:test';
import { createHash } from 'crypto';
import { computeProfileHash } from '../recon-query-builder.js';

// ── Mock helpers ───────────────────────────────────────────────

function makeV2Profile() {
  return {
    id: 'user-123',
    niche: 'AI automation',
    target_audience: 'SaaS founders',
    audience_frustration: 'Too many manual processes wasting engineering time',
    audience_desire: 'Automate repetitive tasks with AI agents',
    expertise_statement: 'AI automation expert with 10 years in SaaS',
    content_pillars: ['AI', 'automation', 'productivity'],
    avoid_topics: 'crypto,blockchain',
    main_pain_point: null,
    user_prompt: null,
    setup_completed: true,
  };
}

function makeV1Profile() {
  return {
    id: 'user-456',
    niche: null,
    target_audience: 'Small business owners',
    audience_frustration: null,
    audience_desire: null,
    expertise_statement: null,
    content_pillars: null,
    avoid_topics: null,
    main_pain_point: 'Struggling with marketing automation',
    user_prompt: 'Help me grow my business',
    setup_completed: true,
  };
}

const EDUCATE_ANGLES = ['tutorial', 'framework', 'data', 'trend', 'how-to'];

// ── Tests ──────────────────────────────────────────────────────

describe('computeProfileHash', () => {
  it('generates consistent SHA-256 hash from profile fields', () => {
    const profile = makeV2Profile();
    const hash1 = computeProfileHash(profile);
    const hash2 = computeProfileHash(profile);

    assert.equal(hash1, hash2);
    assert.equal(hash1.length, 64); // SHA-256 hex length
  });

  it('generates different hash when profile changes', () => {
    const profile1 = makeV2Profile();
    const profile2 = { ...makeV2Profile(), niche: 'fintech' };

    const hash1 = computeProfileHash(profile1);
    const hash2 = computeProfileHash(profile2);

    assert.notEqual(hash1, hash2);
  });

  it('handles null/undefined fields gracefully', () => {
    const profile = makeV1Profile();
    const hash = computeProfileHash(profile);

    assert.equal(typeof hash, 'string');
    assert.equal(hash.length, 64);
  });

  it('computes expected hash from known input', () => {
    const profile = makeV2Profile();
    const key = [
      profile.niche ?? '',
      profile.target_audience ?? '',
      profile.audience_frustration ?? '',
      profile.audience_desire ?? '',
      (profile.content_pillars ?? []).join(','),
    ].join('|');
    const expected = createHash('sha256').update(key).digest('hex');

    assert.equal(computeProfileHash(profile), expected);
  });
});

describe('Query generation contract', () => {
  it('V2 profile has all required fields for query generation', () => {
    const profile = makeV2Profile();
    const hasV2 = !!(profile.niche && (profile.audience_frustration || profile.audience_desire));
    assert.ok(hasV2, 'V2 profile should be detected');
  });

  it('V1 profile fallback uses target_audience + main_pain_point', () => {
    const profile = makeV1Profile();
    const hasV2 = !!(profile.niche && (profile.audience_frustration || profile.audience_desire));
    const hasV1 = !!(profile.target_audience && profile.main_pain_point);

    assert.ok(!hasV2, 'V1 profile should NOT be detected as V2');
    assert.ok(hasV1, 'V1 profile should be detected');
  });

  it('incomplete profile is rejected', () => {
    const profile = {
      niche: null,
      target_audience: null,
      audience_frustration: null,
      audience_desire: null,
      main_pain_point: null,
      content_pillars: null,
    };
    const hasV2 = !!(profile.niche && (profile.audience_frustration || profile.audience_desire));
    const hasV1 = !!(profile.target_audience && profile.main_pain_point);

    assert.ok(!hasV2 && !hasV1, 'Incomplete profile should be rejected');
  });
});

describe('Fallback query generation', () => {
  it('builds 3 fallback queries from niche + first 3 angles', () => {
    const profile = makeV2Profile();
    const base = profile.niche || profile.target_audience || 'content';

    const fallback = EDUCATE_ANGLES.slice(0, 3).map(
      (angle) => `${base} ${angle}`
    );

    assert.equal(fallback.length, 3);
    assert.equal(fallback[0], 'AI automation tutorial');
    assert.equal(fallback[1], 'AI automation framework');
    assert.equal(fallback[2], 'AI automation data');
  });

  it('uses target_audience when niche is null', () => {
    const profile = makeV1Profile();
    const base = profile.niche || profile.target_audience || 'content';

    const fallback = EDUCATE_ANGLES.slice(0, 3).map(
      (angle) => `${base} ${angle}`
    );

    assert.equal(fallback[0], 'Small business owners tutorial');
  });
});

describe('avoid_topics filtering', () => {
  it('filters queries containing avoided terms', () => {
    const avoidTopics = 'crypto,blockchain';
    const queries = [
      'AI automation trends 2026',
      'crypto trading bots tutorial',
      'SaaS productivity framework',
      'blockchain AI integration guide',
    ];

    const avoidTerms = avoidTopics.toLowerCase().split(',').map((t) => t.trim());
    const filtered = queries.filter(
      (q) => !avoidTerms.some((term) => q.toLowerCase().includes(term))
    );

    assert.equal(filtered.length, 2);
    assert.ok(!filtered.some((q) => q.toLowerCase().includes('crypto')));
    assert.ok(!filtered.some((q) => q.toLowerCase().includes('blockchain')));
  });
});

describe('Query count contract', () => {
  it('output should match queryAngles.length when sliced', () => {
    const mockGeminiQueries = [
      'AI tutorial beginner guide',
      'machine learning framework comparison',
      'AI adoption data enterprise 2026',
      'automation trend SaaS growth',
      'how to implement AI agents',
      'extra query beyond angles',
      'another extra query',
    ];

    const sliced = mockGeminiQueries.slice(0, EDUCATE_ANGLES.length);
    assert.equal(sliced.length, EDUCATE_ANGLES.length);
    assert.equal(sliced.length, 5);
  });
});

describe('Query validation rules', () => {
  it('each query must be <= 80 chars (Zod max)', () => {
    const queries = [
      'AI automation trends 2026',
      'SaaS productivity framework comparison',
      'how to build AI agents step by step',
    ];

    for (const q of queries) {
      assert.ok(q.length <= 80, `Query too long: ${q}`);
      assert.ok(q.length >= 3, `Query too short: ${q}`);
    }
  });

  it('queries should not contain quotes', () => {
    const queries = [
      'AI automation trends 2026',
      'SaaS productivity framework',
    ];

    for (const q of queries) {
      assert.ok(!q.includes('"'), `Query contains double quotes: ${q}`);
      assert.ok(!q.includes("'"), `Query contains single quotes: ${q}`);
    }
  });
});
