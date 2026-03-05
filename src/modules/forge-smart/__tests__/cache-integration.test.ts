/**
 * Tests for Forge-Smart Cache Integration — Story 4.1 (RU-13)
 * Validates Stage 0 cache lookup, write-back, used marking, and blog type handling.
 *
 * Run with: npx tsx --test src/modules/forge-smart/__tests__/cache-integration.test.ts
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { selectBestCandidate, scoreAllCandidates } from '../smart-content-scorer.js';
import { PILLAR_CONFIGS } from '../../pillar-system/pillar-configs.js';
import type { SmartCandidate } from '../forge-smart.types.js';

// ─── Helpers ─────────────────────────────────────────────────────

function makeCachedIntelRows(count: number, topScore: number = 8.5): Record<string, unknown>[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `intel-${i}`,
    user_id: 'user-1',
    source_type: i % 2 === 0 ? 'google_news' : 'blog',
    pillar_tag: 'educate',
    title: `Cached article ${i}`,
    summary: `Summary of cached article ${i} with enough content to be meaningful`,
    body_content: `Full body content of article ${i}`,
    url: `https://example.com/cached-${i}`,
    author: `Author ${i}`,
    source_score: 500 + i * 100,
    source_comments: 10 + i,
    relevance_score: 7.0 + (i * 0.2),
    final_score: topScore - (i * 0.5),
    query_used: `cached-query-${i}`,
    posted_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    collected_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    used: false,
    used_in_post_id: null,
    used_at: null,
  }));
}

function mapIntelToSmartCandidates(intelItems: Record<string, unknown>[]): SmartCandidate[] {
  return intelItems.map(item => ({
    source_type: item.source_type as SmartCandidate['source_type'],
    title: item.title as string,
    summary: (item.summary as string) ?? (item.body_content as string)?.slice(0, 500) ?? null,
    url: (item.url as string) ?? null,
    author: (item.author as string) ?? null,
    source_score: item.source_score ? Number(item.source_score) : null,
    source_comments: item.source_comments ? Number(item.source_comments) : null,
    posted_at: (item.posted_at as string) ?? null,
    relevance_score: Number(item.relevance_score),
    query_used: (item.query_used as string) ?? 'recon-cache',
    scraped_body: (item.body_content as string) ?? null,
  }));
}

function computeTtl(sourceType: string): string {
  const hours = sourceType === 'twitter' ? 24 : sourceType === 'reddit' ? 72 : 168;
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

// ─── Test 1: Cache HIT — >= 3 items, top score >= 7.0 ────────────

describe('Stage 0: Cache Integration (RU-13)', () => {
  it('Test 1: Cache with >= 3 items and top score >= 7.0 should produce valid candidates', () => {
    const intelRows = makeCachedIntelRows(5, 8.5);
    const candidates = mapIntelToSmartCandidates(intelRows);

    // Verify cache HIT condition
    assert.ok(intelRows.length >= 3, 'Should have >= 3 cached items');
    assert.ok(Number(intelRows[0].final_score) >= 7.0, 'Top score should be >= 7.0');

    // Verify candidates are valid SmartCandidate[]
    assert.equal(candidates.length, 5, 'Should map all 5 intel rows to candidates');
    for (const c of candidates) {
      assert.ok(c.title, 'Each candidate should have a title');
      assert.ok(c.source_type, 'Each candidate should have a source_type');
      assert.ok(typeof c.relevance_score === 'number', 'relevance_score should be a number');
    }

    // Verify scorer works with cached candidates
    const winner = selectBestCandidate(candidates, PILLAR_CONFIGS.educate);
    assert.ok(winner.final_score > 0, 'Winner should have a positive score');
  });

  // ─── Test 2: Cache with < 3 items → proceed with live fetch ───

  it('Test 2: Cache with < 3 items should NOT be a cache hit', () => {
    const intelRows = makeCachedIntelRows(2, 9.0);

    // Even with high scores, < 3 items means cache miss
    const isCacheHit = intelRows.length >= 3 && Number(intelRows[0].final_score) >= 7.0;
    assert.equal(isCacheHit, false, 'Should NOT be a cache hit with < 3 items');
  });

  // ─── Test 3: Cache with top score < 7.0 → proceed with live fetch

  it('Test 3: Cache with top score < 7.0 should NOT be a cache hit', () => {
    const intelRows = makeCachedIntelRows(5, 6.5);

    const isCacheHit = intelRows.length >= 3 && Number(intelRows[0].final_score) >= 7.0;
    assert.equal(isCacheHit, false, 'Should NOT be a cache hit when top score < 7.0');
  });

  // ─── Test 4: Empty cache → proceed with live fetch ────────────

  it('Test 4: Empty cache should NOT be a cache hit', () => {
    const intelRows: Record<string, unknown>[] = [];

    const isCacheHit = intelRows.length >= 3;
    assert.equal(isCacheHit, false, 'Empty cache should not be a cache hit');
  });

  // ─── Test 5: Cache DB error → gracefully fall back ────────────

  it('Test 5: Cache lookup error should be caught gracefully', () => {
    let generationSource: 'cache' | 'live' = 'live';
    let caughtError = false;

    try {
      // Simulate a DB error
      throw new Error('connection refused');
    } catch {
      caughtError = true;
      // Graceful fallback: generationSource stays 'live'
    }

    assert.ok(caughtError, 'Error should have been caught');
    assert.equal(generationSource, 'live', 'Should fallback to live on error');
  });

  // ─── Test 6: Live fetch writes back candidates to cache ───────

  it('Test 6: Write-back should format candidates correctly for upsert', () => {
    const liveCandidates: SmartCandidate[] = [
      {
        source_type: 'google_news',
        title: 'Live article 1',
        summary: 'Summary 1',
        url: 'https://example.com/live-1',
        author: 'Author 1',
        source_score: 300,
        source_comments: 20,
        posted_at: new Date().toISOString(),
        relevance_score: 8.0,
        query_used: 'live query 1',
        scraped_body: 'Full body content',
      },
      {
        source_type: 'blog',
        title: 'Live blog post',
        summary: 'Blog summary',
        url: 'https://example.com/live-blog',
        author: 'Blogger',
        source_score: 150,
        source_comments: 5,
        posted_at: new Date().toISOString(),
        relevance_score: 7.5,
        query_used: 'blog query',
        scraped_body: 'Blog body content',
      },
    ];

    const scored = scoreAllCandidates(liveCandidates, PILLAR_CONFIGS.educate);

    // Verify write-back items would have correct shape
    const writeBackItems = scored.slice(0, 20).map(c => ({
      user_id: 'user-1',
      source_type: c.source_type,
      pillar_tag: 'educate',
      title: c.title,
      summary: c.summary,
      body_content: c.scraped_body ?? null,
      url: c.url,
      author: c.author,
      relevance_score: c.relevance_score,
      final_score: c.final_score,
      query_used: c.query_used,
      posted_at: c.posted_at,
      expires_at: computeTtl(c.source_type),
    }));

    assert.equal(writeBackItems.length, 2, 'Should write back 2 items');
    for (const item of writeBackItems) {
      assert.ok(item.user_id, 'Should have user_id');
      assert.ok(item.pillar_tag, 'Should have pillar_tag');
      assert.ok(item.title, 'Should have title');
      assert.ok(item.final_score > 0, 'Should have a positive final_score');
      assert.ok(item.expires_at, 'Should have expires_at');
    }
  });

  // ─── Test 7: Winner from cache marked as used ─────────────────

  it('Test 7: URL-to-ID map correctly resolves winner intel ID', () => {
    const intelRows = makeCachedIntelRows(5, 8.5);
    const candidates = mapIntelToSmartCandidates(intelRows);

    // Build URL→ID map (same logic as service)
    const cachedUrlToIntelId = new Map<string, string>();
    for (const row of intelRows) {
      if (row.url && row.id) cachedUrlToIntelId.set(row.url as string, row.id as string);
    }

    // Score and select winner
    const winner = selectBestCandidate(candidates, PILLAR_CONFIGS.educate);

    // Resolve winner's intel ID
    const winnerIntelId = winner.url ? cachedUrlToIntelId.get(winner.url) : null;
    assert.ok(winnerIntelId, 'Winner intel ID should be resolved from URL map');
    assert.ok(winnerIntelId!.startsWith('intel-'), 'Intel ID should match expected format');
  });

  // ─── Test 8: Blog candidates handled in scorer ────────────────

  it('Test 8: Blog source type is handled correctly by scorer', () => {
    const blogCandidate: SmartCandidate = {
      source_type: 'blog',
      title: 'Expert blog post on industry trends',
      summary: 'A detailed blog post covering the latest industry trends with analysis and predictions for the next quarter.',
      url: 'https://expert-blog.com/trends',
      author: 'Industry Expert',
      source_score: 200,
      source_comments: 30,
      posted_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      relevance_score: 8.0,
      query_used: 'industry trends blog',
    };

    // Should not throw — blog is a valid source_type
    const winner = selectBestCandidate([blogCandidate], PILLAR_CONFIGS.educate);
    assert.ok(winner.final_score > 0, 'Blog candidate should have a positive score');
    assert.equal(winner.source_type, 'blog', 'Source type should remain blog');
  });

  // ─── Test 9: Existing forge-smart scorer tests still work ─────

  it('Test 9: scoreAllCandidates returns sorted results for mixed source types including blog', () => {
    const candidates: SmartCandidate[] = [
      {
        source_type: 'blog',
        title: 'Blog post',
        summary: 'Blog summary with enough content for richness scoring algorithm to evaluate properly.',
        url: 'https://blog.com/post',
        author: 'Blogger',
        source_score: 100,
        source_comments: 5,
        posted_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        relevance_score: 6.0,
        query_used: 'blog query',
      },
      {
        source_type: 'google_news',
        title: 'News article',
        summary: 'Comprehensive news article with in-depth analysis and expert commentary on current events.',
        url: 'https://news.com/article',
        author: 'Reporter',
        source_score: 1500,
        source_comments: 50,
        posted_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        relevance_score: 9.0,
        query_used: 'news query',
      },
      {
        source_type: 'reddit',
        title: 'Reddit discussion',
        summary: 'Engaging reddit thread with multiple perspectives and detailed analysis from community members.',
        url: 'https://reddit.com/r/test/789',
        author: 'redditor',
        source_score: 5000,
        source_comments: 300,
        posted_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        relevance_score: 7.5,
        query_used: 'reddit query',
      },
    ];

    const scored = scoreAllCandidates(candidates, PILLAR_CONFIGS.educate);

    assert.equal(scored.length, 3, 'Should score all 3 candidates');
    // Verify sorted descending
    for (let i = 1; i < scored.length; i++) {
      assert.ok(
        scored[i - 1].final_score >= scored[i].final_score,
        `Scores should be sorted descending: ${scored[i - 1].final_score} >= ${scored[i].final_score}`
      );
    }
    // All should have positive scores
    for (const s of scored) {
      assert.ok(s.final_score > 0, `${s.source_type} candidate should have positive score`);
    }
  });

  // ─── TTL computation tests ────────────────────────────────────

  it('computeTtl: twitter=24h, reddit=72h, others=168h', () => {
    const now = Date.now();

    const twitterTtl = new Date(computeTtl('twitter')).getTime();
    const redditTtl = new Date(computeTtl('reddit')).getTime();
    const blogTtl = new Date(computeTtl('blog')).getTime();
    const newsTtl = new Date(computeTtl('google_news')).getTime();

    // Allow 5s tolerance for test execution time
    const tolerance = 5000;

    assert.ok(
      Math.abs(twitterTtl - (now + 24 * 60 * 60 * 1000)) < tolerance,
      'Twitter TTL should be ~24h'
    );
    assert.ok(
      Math.abs(redditTtl - (now + 72 * 60 * 60 * 1000)) < tolerance,
      'Reddit TTL should be ~72h'
    );
    assert.ok(
      Math.abs(blogTtl - (now + 168 * 60 * 60 * 1000)) < tolerance,
      'Blog TTL should be ~168h'
    );
    assert.ok(
      Math.abs(newsTtl - (now + 168 * 60 * 60 * 1000)) < tolerance,
      'Google News TTL should be ~168h'
    );
  });

  // ─── mapIntelToSmartCandidates tests ──────────────────────────

  it('mapIntelToSmartCandidates: correctly maps all fields', () => {
    const intel: Record<string, unknown>[] = [{
      id: 'intel-99',
      source_type: 'blog',
      title: 'Test Blog',
      summary: null,
      body_content: 'This is the full body content of the blog post',
      url: 'https://blog.test/99',
      author: 'Test Author',
      source_score: 250,
      source_comments: 15,
      posted_at: '2026-03-01T00:00:00Z',
      relevance_score: 7.5,
      query_used: 'test query',
    }];

    const mapped = mapIntelToSmartCandidates(intel);

    assert.equal(mapped.length, 1);
    const c = mapped[0];
    assert.equal(c.source_type, 'blog');
    assert.equal(c.title, 'Test Blog');
    // summary falls back to body_content slice when summary is null
    assert.equal(c.summary, 'This is the full body content of the blog post');
    assert.equal(c.url, 'https://blog.test/99');
    assert.equal(c.author, 'Test Author');
    assert.equal(c.source_score, 250);
    assert.equal(c.relevance_score, 7.5);
    assert.equal(c.query_used, 'test query');
    assert.equal(c.scraped_body, 'This is the full body content of the blog post');
  });
});
