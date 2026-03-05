/**
 * Tests for profile-scorer — Story 1.4 (RU-04)
 * Validates TF-IDF scoring, keyword extraction, pillar weights, and source multipliers.
 *
 * Run with: npx tsx --test src/modules/recon-ultra/__tests__/profile-scorer.test.ts
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  extractProfileKeywords,
  scoreReconCandidate,
  scoreAllReconCandidatesSync,
} from '../profile-scorer.js';
import type { ReconUltraCandidate } from '../recon-ultra.types.js';
import type { PillarConfig } from '../../../shared/types/pillar.types.js';
import { PILLAR_CONFIGS } from '../../pillar-system/pillar-configs.js';

// ── Helpers ───────────────────────────────────────────────────

function makeCandidate(overrides: Partial<ReconUltraCandidate> = {}): ReconUltraCandidate {
  return {
    source_type: 'google_news',
    title: 'Default test title',
    summary: null,
    body_content: null,
    url: 'https://example.com/article',
    author: 'John Doe',
    category: null,
    source_score: null,
    source_comments: null,
    source_retweets: null,
    source_views: null,
    recency_score: 0,
    engagement_score: 0,
    relevance_score: 0,
    richness_score: 0,
    pillar_alignment_score: 0,
    final_score: 0,
    pillar_tag: 'educate',
    query_used: 'test query',
    posted_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    ...overrides,
  };
}

const EDUCATE = PILLAR_CONFIGS.educate;
const PROVOKE = PILLAR_CONFIGS.provoke;

// ── Test 1: Keywords in title → relevance > 6.0 ──────────────

describe('profile-scorer', () => {
  const profileKeywords = extractProfileKeywords(
    'AI automation',
    'SaaS founders struggling with manual processes',
    'Too many manual tasks wasting time',
    'AI automation expert building intelligent agents',
    null,
  );

  it('1. Candidate with profile keywords in title → relevance > 6.0', () => {
    const candidate = makeCandidate({
      title: 'AI automation transforms SaaS founders manual processes',
      summary: 'How intelligent agents reduce manual tasks',
    });
    const scored = scoreReconCandidate(candidate, profileKeywords, EDUCATE);
    assert.ok(scored.relevance_score > 6.0, `Expected relevance > 6.0, got ${scored.relevance_score}`);
  });

  // ── Test 2: No keywords → relevance < 4.0 ────────────────

  it('2. Candidate without keywords → relevance < 4.0', () => {
    const candidate = makeCandidate({
      title: 'Celebrity gossip latest drama unfolds',
      summary: 'Entertainment news roundup',
    });
    const scored = scoreReconCandidate(candidate, profileKeywords, EDUCATE);
    assert.ok(scored.relevance_score < 4.0, `Expected relevance < 4.0, got ${scored.relevance_score}`);
  });

  // ── Test 3: Same candidate EDUCATE vs PROVOKE → different scores ──

  it('3. Same candidate scored EDUCATE vs PROVOKE → different final_scores', () => {
    const candidate = makeCandidate({
      source_type: 'google_news',
      title: 'AI automation research reveals surprising findings',
      source_score: 2000,
    });
    const educateScored = scoreReconCandidate(candidate, profileKeywords, EDUCATE);
    const provokeScored = scoreReconCandidate(candidate, profileKeywords, PROVOKE);
    assert.notEqual(
      educateScored.final_score,
      provokeScored.final_score,
      'EDUCATE and PROVOKE should produce different final_scores',
    );
  });

  // ── Test 4: Blog EDUCATE → 1.8× multiplier ───────────────

  it('4. Blog candidate EDUCATE → 1.8× multiplier applied', () => {
    const blogCandidate = makeCandidate({
      source_type: 'blog',
      title: 'AI automation guide for SaaS',
      source_score: 500,
    });
    const newsCandidate = makeCandidate({
      source_type: 'google_news',
      title: 'AI automation guide for SaaS',
      source_score: 500,
    });
    const blogScored = scoreReconCandidate(blogCandidate, profileKeywords, EDUCATE);
    const newsScored = scoreReconCandidate(newsCandidate, profileKeywords, EDUCATE);

    // blog multiplier is 1.8, news is 1.5 — blog should be higher
    const ratio = blogScored.final_score / newsScored.final_score;
    const expectedRatio = 1.8 / 1.5;
    assert.ok(
      Math.abs(ratio - expectedRatio) < 0.01,
      `Expected ratio ~${expectedRatio.toFixed(2)}, got ${ratio.toFixed(4)}`,
    );
  });

  // ── Test 5: Blog PROVOKE → 0.6× multiplier ───────────────

  it('5. Blog candidate PROVOKE → 0.6× multiplier applied', () => {
    const blogCandidate = makeCandidate({
      source_type: 'blog',
      title: 'AI automation myth debunked',
      source_score: 500,
    });
    const twitterCandidate = makeCandidate({
      source_type: 'twitter',
      title: 'AI automation myth debunked',
      source_score: 500,
    });
    const blogScored = scoreReconCandidate(blogCandidate, profileKeywords, PROVOKE);
    const twitterScored = scoreReconCandidate(twitterCandidate, profileKeywords, PROVOKE);

    // blog=0.6, twitter=1.5 — blog should be much lower
    const ratio = blogScored.final_score / twitterScored.final_score;
    const expectedRatio = 0.6 / 1.5;
    assert.ok(
      Math.abs(ratio - expectedRatio) < 0.01,
      `Expected ratio ~${expectedRatio.toFixed(2)}, got ${ratio.toFixed(4)}`,
    );
  });

  // ── Test 6: Richness: body_content > 200 chars → +5+3 bonus ──

  it('6. Richness: candidate with body_content gets +5+3 bonus', () => {
    const withBody = makeCandidate({
      body_content: 'A'.repeat(250),
      url: 'https://example.com',
      author: 'Jane',
    });
    const withoutBody = makeCandidate({
      body_content: null,
      url: 'https://example.com',
      author: 'Jane',
    });
    const scoredWith = scoreReconCandidate(withBody, profileKeywords, EDUCATE);
    const scoredWithout = scoreReconCandidate(withoutBody, profileKeywords, EDUCATE);

    // withBody: +5 (>200chars) +3 (url) +2 (author) +3 (body bonus) = 13 → capped 10
    // withoutBody: +0 +3 (url) +2 (author) +0 = 5
    assert.ok(scoredWith.richness_score > scoredWithout.richness_score,
      `Expected body_content to increase richness: ${scoredWith.richness_score} > ${scoredWithout.richness_score}`);
    assert.equal(scoredWith.richness_score, 10, 'Richness should cap at 10');
    assert.equal(scoredWithout.richness_score, 5, 'Without body: url(3) + author(2) = 5');
  });

  // ── Test 7: Recency tiers ────────────────────────────────

  it('7. Recency tiers return correct scores for each time range', () => {
    const now = Date.now();

    const cases: Array<{ hoursAgo: number | null; expected: number }> = [
      { hoursAgo: 2, expected: 10 },    // < 6h
      { hoursAgo: 12, expected: 8 },    // < 24h
      { hoursAgo: 36, expected: 6 },    // < 48h
      { hoursAgo: 100, expected: 4 },   // < 7d (168h)
      { hoursAgo: 200, expected: 2 },   // > 7d
      { hoursAgo: null, expected: 2 },  // null
    ];

    for (const { hoursAgo, expected } of cases) {
      const posted_at = hoursAgo !== null
        ? new Date(now - hoursAgo * 3600000).toISOString()
        : null;
      const candidate = makeCandidate({ posted_at });
      const scored = scoreReconCandidate(candidate, profileKeywords, EDUCATE);
      assert.equal(scored.recency_score, expected,
        `${hoursAgo}h ago should give recency=${expected}, got ${scored.recency_score}`);
    }
  });

  // ── Test 8: PR fluff penalty reduces relevance by 2.0 ────

  it('8. PR fluff penalty reduces relevance by 2.0', () => {
    // Use many matching keywords so base score is high enough to see penalty
    const highMatchKeywords = ['automation', 'founders', 'manual', 'processes', 'intelligent'];
    const normal = makeCandidate({
      title: 'automation founders manual processes intelligent tips',
    });
    const prFluff = makeCandidate({
      title: 'automation founders manual processes intelligent announces partnership',
    });
    const normalScored = scoreReconCandidate(normal, highMatchKeywords, EDUCATE);
    const prScored = scoreReconCandidate(prFluff, highMatchKeywords, EDUCATE);
    // normal gets how-to bonus (+0.3 for "tips"), pr gets -2 penalty
    // Difference should be >= 2.0 (penalty) minus 0.3 (tips bonus normal has)
    assert.ok(
      normalScored.relevance_score > prScored.relevance_score,
      `PR penalty should reduce relevance: normal=${normalScored.relevance_score}, pr=${prScored.relevance_score}`,
    );
    assert.ok(
      normalScored.relevance_score - prScored.relevance_score >= 1.5,
      `Difference should be >= 1.5: diff=${normalScored.relevance_score - prScored.relevance_score}`,
    );
  });

  // ── extractProfileKeywords ────────────────────────────────

  describe('extractProfileKeywords', () => {
    it('extracts max 15 keywords, excludes stopwords, min 4 chars', () => {
      const keywords = extractProfileKeywords(
        'AI automation and machine learning',
        'SaaS founders who want to scale',
        'Too many manual processes',
        'Expert in building intelligent systems',
        'Help me create content about productivity',
      );
      assert.ok(keywords.length <= 15, `Expected <= 15 keywords, got ${keywords.length}`);
      assert.ok(keywords.every(k => k.length >= 4), 'All keywords >= 4 chars');
      assert.ok(!keywords.includes('and'), 'Should exclude stopword "and"');
      assert.ok(!keywords.includes('the'), 'Should exclude stopword "the"');
      assert.ok(!keywords.includes('para'), 'Should exclude Portuguese stopword "para"');
    });

    it('handles null fields gracefully', () => {
      const keywords = extractProfileKeywords(null, 'target audience', null, null, null);
      assert.ok(Array.isArray(keywords));
      assert.ok(keywords.length >= 0);
    });
  });

  // ── scoreAllReconCandidatesSync ───────────────────────────────

  describe('scoreAllReconCandidatesSync', () => {
    it('returns sorted array by final_score DESC', () => {
      const candidates = [
        makeCandidate({ title: 'Unrelated celebrity news today', source_score: 10 }),
        makeCandidate({ title: 'AI automation SaaS founders guide manual processes', source_score: 5000 }),
        makeCandidate({ title: 'Some tech article about automation', source_score: 200 }),
      ];
      const sorted = scoreAllReconCandidatesSync(candidates, profileKeywords, EDUCATE);
      assert.equal(sorted.length, 3);
      for (let i = 1; i < sorted.length; i++) {
        assert.ok(sorted[i - 1].final_score >= sorted[i].final_score,
          `Expected sorted DESC: ${sorted[i - 1].final_score} >= ${sorted[i].final_score}`);
      }
    });

    it('returns empty array for empty input', () => {
      const result = scoreAllReconCandidatesSync([], profileKeywords, EDUCATE);
      assert.deepEqual(result, []);
    });
  });
});
