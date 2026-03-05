/**
 * Tests for news-dynamic.source — Story 2.1 (RU-06)
 * Validates dynamic Google News RSS fetch with profile queries.
 *
 * Run with: npx tsx --test src/modules/recon-ultra/__tests__/news-dynamic.test.ts
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fetchNewsDynamic } from '../sources/news-dynamic.source.js';
import type { RSSParserLike } from '../sources/news-dynamic.source.js';

// ── Helpers ─────────────────────────────────────────────────

function makeFeedItem(overrides: Record<string, unknown> = {}) {
  return {
    title: 'How to meal prep for fitness goals',
    contentSnippet: 'A guide to preparing healthy meals for the week.',
    link: 'https://example.com/meal-prep',
    creator: 'Jane Doe',
    isoDate: '2026-03-04T10:00:00Z',
    ...overrides,
  };
}

function createMockParser(
  handler: (url: string) => Promise<{ items: Record<string, unknown>[] }>
): RSSParserLike {
  return { parseURL: handler };
}

const PROFILE_KEYWORDS = ['fitness', 'meal', 'prep', 'health', 'nutrition'];

// ── Tests ───────────────────────────────────────────────────

describe('news-dynamic.source', () => {
  // Test 1: Query returns relevant articles (not AI articles)
  it('1. Query "fitness meal prep" returns food/fitness articles', async () => {
    const parser = createMockParser(async (url) => {
      assert.ok(url.includes('fitness%20meal%20prep'), `URL should contain encoded query, got: ${url}`);
      return {
        items: [
          makeFeedItem({ title: 'Best fitness meal prep strategies for 2026' }),
          makeFeedItem({ title: '5 healthy meal ideas for busy athletes' }),
        ],
      };
    });

    const results = await fetchNewsDynamic(['fitness meal prep'], PROFILE_KEYWORDS, parser);
    assert.equal(results.length, 2);
    assert.equal(results[0].source_type, 'google_news');
    assert.ok(results[0].title.includes('fitness'), 'Should return fitness-related articles');
    assert.equal(results[0].query_used, 'fitness meal prep');
    assert.equal(results[0].posted_at, '2026-03-04T10:00:00Z');
  });

  // Test 2: Multiple queries run in parallel
  it('2. Multiple queries run in parallel via Promise.allSettled', async () => {
    const callOrder: string[] = [];
    const parser = createMockParser(async (url) => {
      const query = decodeURIComponent(url.split('q=')[1].split('&')[0]);
      callOrder.push(query);
      return { items: [makeFeedItem({ title: `Result for ${query}` })] };
    });

    const results = await fetchNewsDynamic(
      ['fitness tips', 'healthy recipes', 'workout routines'],
      PROFILE_KEYWORDS,
      parser,
    );

    assert.equal(results.length, 3);
    assert.equal(callOrder.length, 3, 'All 3 queries should have been fetched');
    assert.ok(results.some((r) => r.query_used === 'fitness tips'));
    assert.ok(results.some((r) => r.query_used === 'healthy recipes'));
    assert.ok(results.some((r) => r.query_used === 'workout routines'));
  });

  // Test 3: Single query failure doesn't block others (AC9)
  it('3. Single query failure does not block other queries', async () => {
    let callCount = 0;
    const parser = createMockParser(async () => {
      callCount++;
      if (callCount === 2) throw new Error('Network timeout');
      return { items: [makeFeedItem()] };
    });

    const results = await fetchNewsDynamic(['query1', 'query2', 'query3'], PROFILE_KEYWORDS, parser);
    assert.equal(results.length, 2, 'Should return results from 2 successful queries');
  });

  // Test 4: Items with short titles filtered out (AC7)
  it('4. Items with title < 5 chars are filtered out', async () => {
    const parser = createMockParser(async () => ({
      items: [
        makeFeedItem({ title: 'Good article about fitness and health' }),
        makeFeedItem({ title: 'Hi' }),
        makeFeedItem({ title: '' }),
        makeFeedItem({ title: 'ABCD' }),
        makeFeedItem({ title: 'ABCDE' }),
      ],
    }));

    const results = await fetchNewsDynamic(['test'], PROFILE_KEYWORDS, parser);
    assert.equal(results.length, 2, 'Only titles >= 5 chars should pass');
    assert.equal(results[0].title, 'Good article about fitness and health');
    assert.equal(results[1].title, 'ABCDE');
  });

  // Test 5: posted_at correctly extracted from isoDate (AC6)
  it('5. posted_at correctly extracted from RSS isoDate field', async () => {
    const testDate = '2026-03-01T15:30:00Z';
    const parser = createMockParser(async () => ({
      items: [
        makeFeedItem({ isoDate: testDate }),
        makeFeedItem({ isoDate: undefined }),
      ],
    }));

    const results = await fetchNewsDynamic(['test'], PROFILE_KEYWORDS, parser);
    assert.equal(results[0].posted_at, testDate, 'Should extract isoDate as posted_at');
    assert.equal(results[1].posted_at, null, 'Missing isoDate should result in null');
  });

  // Test 6: Max 8 items per query (AC3)
  it('6. Max 8 items per query extracted from RSS feed', async () => {
    const items = Array.from({ length: 15 }, (_, i) =>
      makeFeedItem({ title: `Article number ${i + 1} with enough chars` }),
    );
    const parser = createMockParser(async () => ({ items }));

    const results = await fetchNewsDynamic(['test'], PROFILE_KEYWORDS, parser);
    assert.ok(results.length <= 8, `Should return max 8 items, got ${results.length}`);
  });

  // Test 7: Scoring fields zeroed (per Dev Notes)
  it('7. Scoring fields are zeroed — left for profile-scorer', async () => {
    const parser = createMockParser(async () => ({
      items: [makeFeedItem()],
    }));

    const results = await fetchNewsDynamic(['test'], PROFILE_KEYWORDS, parser);
    const r = results[0];
    assert.equal(r.relevance_score, 0);
    assert.equal(r.recency_score, 0);
    assert.equal(r.engagement_score, 0);
    assert.equal(r.richness_score, 0);
    assert.equal(r.pillar_alignment_score, 0);
    assert.equal(r.final_score, 0);
  });

  // Test 8: Correct RSS URL format (AC2)
  it('8. Constructs correct Google News RSS URL', async () => {
    let capturedUrl = '';
    const parser = createMockParser(async (url) => {
      capturedUrl = url;
      return { items: [] };
    });

    await fetchNewsDynamic(['test query'], PROFILE_KEYWORDS, parser);
    assert.ok(
      capturedUrl.startsWith('https://news.google.com/rss/search?q='),
      'URL should start with Google News RSS search',
    );
    assert.ok(capturedUrl.includes('hl=en-US'), 'URL should include hl=en-US');
    assert.ok(capturedUrl.includes('gl=US'), 'URL should include gl=US');
    assert.ok(capturedUrl.includes('ceid=US:en'), 'URL should include ceid=US:en');
    assert.ok(capturedUrl.includes('test%20query'), 'URL should encode query');
  });
});
