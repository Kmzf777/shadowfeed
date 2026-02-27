/**
 * Tests for smart-content-scorer — Story 6.7 (PDCE-07)
 * Validates pillar-driven scoring weights and source weight multipliers.
 *
 * Run with: npx tsx --test src/modules/forge-smart/__tests__/smart-content-scorer.test.ts
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { selectBestCandidate } from '../smart-content-scorer.js';
import { PILLAR_CONFIGS } from '../../pillar-system/pillar-configs.js';
import type { SmartCandidate } from '../forge-smart.types.js';

// ─── Test Candidates ────────────────────────────────────────────

function makeCandidates(): SmartCandidate[] {
  return [
    {
      source_type: 'google_news',
      title: 'Deep-dive tutorial on AI frameworks',
      summary: 'A comprehensive 2000-word article covering neural network architectures with detailed code examples and benchmarks from leading research labs.',
      url: 'https://example.com/tutorial',
      author: 'Jane Doe',
      source_score: 200,       // moderate engagement
      source_comments: 15,
      posted_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days old
      relevance_score: 8,
      query_used: 'AI framework tutorial',
    },
    {
      source_type: 'twitter',
      title: 'Hot take: most startups waste money on AI',
      summary: 'Short punchy tweet thread',
      url: 'https://twitter.com/user/status/1',
      author: 'John Hot',
      source_score: 8000,      // very high engagement
      source_comments: 500,
      posted_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours old
      relevance_score: 6,
      query_used: 'AI startup controversy',
    },
    {
      source_type: 'reddit',
      title: 'My journey from 0 to 10k MRR — full breakdown',
      summary: 'Detailed post with before/after metrics, screenshots, and monthly revenue data from a SaaS founder sharing their growth strategy.',
      url: 'https://reddit.com/r/startups/123',
      author: 'startup_founder',
      source_score: 3000,      // high engagement
      source_comments: 200,
      posted_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), // 30 hours old
      relevance_score: 7,
      query_used: 'SaaS growth case study',
    },
    {
      source_type: 'google_news',
      title: 'New industry report: 73% of teams fail at scaling',
      summary: null,
      url: 'https://example.com/report',
      author: null,
      source_score: 50,        // low engagement
      source_comments: 2,
      posted_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours old
      relevance_score: 9,
      query_used: 'scaling failure report',
    },
    {
      source_type: 'reddit',
      title: 'Anyone else feel burnt out from hustle culture?',
      summary: 'A heartfelt post about work-life balance struggles and finding meaning beyond productivity metrics in the modern tech world.',
      url: 'https://reddit.com/r/entrepreneur/456',
      author: 'tired_dev',
      source_score: 6000,      // very high engagement
      source_comments: 800,
      posted_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), // 20 hours old
      relevance_score: 5,
      query_used: 'burnout hustle culture',
    },
  ];
}

// ─── AC1: Pillar scoring weights change ranking ──────────────────

describe('Pillar-driven scoring (PDCE-07)', () => {
  it('AC1/AC3: same candidates rank differently with EDUCATE vs PROVOKE weights', () => {
    const candidates = makeCandidates();

    const educateWinner = selectBestCandidate([...candidates], PILLAR_CONFIGS.educate);
    const provokeWinner = selectBestCandidate([...candidates], PILLAR_CONFIGS.provoke);

    // EDUCATE: richness=0.40, relevance=0.25 → favors rich, relevant content
    // PROVOKE: recency=0.40, engagement=0.30 → favors fresh, viral content
    assert.notEqual(
      educateWinner.title,
      provokeWinner.title,
      'EDUCATE and PROVOKE should produce different winners from the same candidates'
    );
  });

  it('AC2/AC4: source weight multipliers boost/penalize sources per pillar', () => {
    const candidates = makeCandidates();

    // Score all candidates with EDUCATE (google_news: 1.5, twitter: 0.8)
    const educateScored = selectBestCandidate([...candidates], PILLAR_CONFIGS.educate);
    // Score all candidates with PROVOKE (google_news: 0.8, twitter: 1.5)
    const provokeScored = selectBestCandidate([...candidates], PILLAR_CONFIGS.provoke);

    // Get the Twitter candidate and Google News candidate scores
    const twitterCandidate = [candidates[1]]; // "Hot take" tweet
    const googleCandidate = [candidates[0]];  // "Deep-dive tutorial"

    const twitterEducate = selectBestCandidate([...twitterCandidate], PILLAR_CONFIGS.educate);
    const twitterProvoke = selectBestCandidate([...twitterCandidate], PILLAR_CONFIGS.provoke);
    const googleEducate = selectBestCandidate([...googleCandidate], PILLAR_CONFIGS.educate);
    const googleProvoke = selectBestCandidate([...googleCandidate], PILLAR_CONFIGS.provoke);

    // Twitter should score higher with PROVOKE (1.5x) than EDUCATE (0.8x)
    assert.ok(
      twitterProvoke.final_score > twitterEducate.final_score,
      `Twitter candidate should score higher with PROVOKE (${twitterProvoke.final_score.toFixed(2)}) than EDUCATE (${twitterEducate.final_score.toFixed(2)})`
    );

    // Google News should score higher with EDUCATE (1.5x) than PROVOKE (0.8x)
    assert.ok(
      googleEducate.final_score > googleProvoke.final_score,
      `Google News candidate should score higher with EDUCATE (${googleEducate.final_score.toFixed(2)}) than PROVOKE (${googleProvoke.final_score.toFixed(2)})`
    );
  });

  it('all five pillars produce valid scores > 0', () => {
    const candidates = makeCandidates();
    const pillarIds = ['educate', 'provoke', 'prove', 'connect', 'convert'] as const;

    for (const pillarId of pillarIds) {
      const winner = selectBestCandidate([...candidates], PILLAR_CONFIGS[pillarId]);
      assert.ok(winner.final_score > 0, `${pillarId} winner should have score > 0`);
      assert.ok(winner.title, `${pillarId} winner should have a title`);
    }
  });

  it('source weight multiplier of 1.5 vs 0.5 produces ~3x score difference for same base', () => {
    // Use a single candidate to isolate the multiplier effect
    const candidate: SmartCandidate = {
      source_type: 'google_news',
      title: 'Test article',
      summary: 'Test summary that is long enough to get richness points for the scoring algorithm to evaluate.',
      url: 'https://example.com/test',
      author: 'Test Author',
      source_score: 500,
      source_comments: 10,
      posted_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      relevance_score: 7,
      query_used: 'test query',
    };

    // CONNECT has google_news: 0.5, EDUCATE has google_news: 1.5
    const connectScore = selectBestCandidate([candidate], PILLAR_CONFIGS.connect);
    const educateScore = selectBestCandidate([candidate], PILLAR_CONFIGS.educate);

    const ratio = educateScore.final_score / connectScore.final_score;
    // 1.5 / 0.5 = 3.0 — the source multiplier ratio should be ~3x
    // (not exact 3x because scoring weights also differ)
    assert.ok(ratio > 1.5, `EDUCATE/CONNECT ratio for google_news should be > 1.5 (got ${ratio.toFixed(2)})`);
  });
});
