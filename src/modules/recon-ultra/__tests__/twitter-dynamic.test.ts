/**
 * Tests for twitter-dynamic.source — Story 2.4 (RU-09)
 * Validates dynamic Twitter fetch via TwitterAPI.io with profile queries.
 *
 * Run with: npx tsx --test src/modules/recon-ultra/__tests__/twitter-dynamic.test.ts
 */

import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'node:test';
import { env } from '../../../config/env.js';
import { fetchTwitterDynamic } from '../sources/twitter-dynamic.source.js';

// ── Helpers ─────────────────────────────────────────────────

interface MockTweet {
  id: string;
  text: string;
  author: { userName: string; name: string };
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  createdAt: string;
  conversationId?: string;
}

function makeTweet(overrides: Partial<MockTweet> = {}): MockTweet {
  return {
    id: '100',
    text: 'Great fitness tips for building muscle and staying lean',
    author: { userName: 'fitcoach', name: 'Fit Coach' },
    likeCount: 50,
    retweetCount: 10,
    replyCount: 3,
    createdAt: '2026-03-04T10:00:00Z',
    ...overrides,
  };
}

let originalFetch: typeof globalThis.fetch;
let originalKey: string;

function mockFetch(handler: (url: string, init?: RequestInit) => Promise<Response>) {
  globalThis.fetch = handler as typeof globalThis.fetch;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── Setup / Teardown ────────────────────────────────────────

beforeEach(() => {
  originalFetch = globalThis.fetch;
  originalKey = env.TWITTERAPI_IO_KEY;
  (env as Record<string, unknown>).TWITTERAPI_IO_KEY = 'test-api-key';
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  (env as Record<string, unknown>).TWITTERAPI_IO_KEY = originalKey;
});

// ── Tests ───────────────────────────────────────────────────

describe('twitter-dynamic.source', () => {
  // Test 1: Profile query "fitness tips" returns fitness tweets (not AI tweets)
  it('1. Query "fitness tips" returns fitness tweets with correct fields', async () => {
    mockFetch(async (url) => {
      assert.ok(url.includes('fitness+tips'), `URL should contain query, got: ${url}`);
      assert.ok(url.includes('-is%3Aretweet'), 'Should append -is:retweet filter');
      assert.ok(url.includes('lang%3Aen'), 'Should append lang:en filter');
      return jsonResponse({
        tweets: [
          makeTweet({ text: 'Best fitness tips for building lean muscle in 2026' }),
          makeTweet({ id: '101', text: 'Top 10 protein-rich foods for muscle recovery' }),
        ],
      });
    });

    const results = await fetchTwitterDynamic(['fitness tips']);
    assert.equal(results.length, 2);
    assert.equal(results[0].source_type, 'twitter');
    assert.ok(results[0].title.includes('fitness'), 'Should return fitness-related tweets');
    assert.equal(results[0].query_used, 'fitness tips');
    assert.equal(results[0].author, 'Fit Coach');
    assert.ok(results[0].url?.includes('x.com/fitcoach/status/'));
  });

  // Test 2: Tweets below engagement threshold filtered out
  it('2. Tweets below engagement threshold (20 likes OR 5 retweets) are filtered', async () => {
    mockFetch(async () =>
      jsonResponse({
        tweets: [
          makeTweet({ likeCount: 50, retweetCount: 10 }), // passes
          makeTweet({ id: '101', likeCount: 5, retweetCount: 2 }), // fails both
          makeTweet({ id: '102', likeCount: 20, retweetCount: 0 }), // passes (likes)
          makeTweet({ id: '103', likeCount: 0, retweetCount: 5 }), // passes (retweets)
          makeTweet({ id: '104', likeCount: 19, retweetCount: 4 }), // fails both
        ],
      }),
    );

    const results = await fetchTwitterDynamic(['test']);
    assert.equal(results.length, 3, 'Only 3 tweets should pass engagement threshold');
  });

  // Test 3: Thread enrichment extends summary with thread content
  it('3. Thread enrichment fetches conversation and extends summary', async () => {
    let fetchCount = 0;
    mockFetch(async (url) => {
      fetchCount++;
      if (fetchCount === 1) {
        // Main query
        return jsonResponse({
          tweets: [
            makeTweet({
              id: '100',
              text: 'Short tweet',
              conversationId: '99', // different from id → triggers thread fetch
            }),
          ],
        });
      }
      // Thread fetch
      assert.ok(url.includes('conversation_id%3A99'), 'Should fetch conversation_id:99');
      assert.ok(url.includes('from%3Afitcoach'), 'Should filter by author');
      const longThread = 'A'.repeat(150); // > 100 chars, longer than "Short tweet"
      return jsonResponse({
        tweets: [
          makeTweet({ text: longThread, createdAt: '2026-03-04T09:00:00Z' }),
        ],
      });
    });

    const results = await fetchTwitterDynamic(['test']);
    assert.equal(results.length, 1);
    assert.ok(results[0].summary !== null, 'Summary should be set from thread content');
    assert.ok(results[0].summary!.includes('AAAA'), 'Summary should contain thread content');
  });

  // Test 4: Max 5 tweets per query
  it('4. Max 5 tweets per query even if API returns more', async () => {
    const tweets = Array.from({ length: 10 }, (_, i) =>
      makeTweet({ id: String(i), likeCount: 100 }),
    );
    mockFetch(async () => jsonResponse({ tweets }));

    const results = await fetchTwitterDynamic(['test']);
    assert.ok(results.length <= 5, `Should return max 5 tweets, got ${results.length}`);
  });

  // Test 5: Graceful skip if no API key
  it('5. Returns empty array if TWITTERAPI_IO_KEY is not set', async () => {
    (env as Record<string, unknown>).TWITTERAPI_IO_KEY = '';
    let fetchCalled = false;
    mockFetch(async () => {
      fetchCalled = true;
      return jsonResponse({ tweets: [] });
    });

    const results = await fetchTwitterDynamic(['test query']);
    assert.equal(results.length, 0, 'Should return empty array');
    assert.equal(fetchCalled, false, 'Should NOT call fetch when key is missing');
  });

  // Test 6: Single query failure doesn't block others (error isolation)
  it('6. Single query failure does not block other queries', async () => {
    let callCount = 0;
    mockFetch(async () => {
      callCount++;
      if (callCount === 2) throw new Error('Network timeout');
      return jsonResponse({
        tweets: [makeTweet({ id: String(callCount) })],
      });
    });

    const results = await fetchTwitterDynamic(['query1', 'query2', 'query3']);
    assert.equal(results.length, 2, 'Should return results from 2 successful queries');
  });

  // Additional: engagement_score pre-computed correctly (AC9)
  it('7. source_score computed as likes + (retweets × 2)', async () => {
    mockFetch(async () =>
      jsonResponse({
        tweets: [makeTweet({ likeCount: 30, retweetCount: 15 })],
      }),
    );

    const results = await fetchTwitterDynamic(['test']);
    assert.equal(results[0].source_score, 30 + 15 * 2, 'source_score = likes + retweets*2');
  });
});
