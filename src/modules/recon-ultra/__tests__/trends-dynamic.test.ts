/**
 * Tests for trends-dynamic.source — Story 2.2 (RU-07)
 * Validates dynamic Google Trends fetch with profile keywords.
 *
 * Run with: npx tsx --test src/modules/recon-ultra/__tests__/trends-dynamic.test.ts
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fetchTrendsDynamic } from '../sources/trends-dynamic.source.js';
import type { GoogleTrendsClient } from '../sources/trends-dynamic.source.js';

// ── Helpers ─────────────────────────────────────────────────

function makeRankedKeyword(query: string, value = 100, formattedValue = '100') {
  return {
    query,
    value,
    formattedValue,
    link: `/trends/explore?q=${encodeURIComponent(query)}`,
  };
}

function makeTrendsResponse(rankedKeywords: ReturnType<typeof makeRankedKeyword>[]) {
  return JSON.stringify({
    default: {
      rankedList: [
        { rankedKeyword: rankedKeywords },
      ],
    },
  });
}

function createMockClient(
  handler: (params: { keyword: string; geo: string; hl: string }) => Promise<string>
): GoogleTrendsClient {
  return { relatedQueries: handler };
}

// ── Tests ───────────────────────────────────────────────────

describe('trends-dynamic.source', () => {
  // Test 1: Profile keyword "fitness" returns fitness-related trends
  it('1. Profile keyword "fitness" returns fitness-related trends', async () => {
    const client = createMockClient(async (params) => {
      assert.equal(params.keyword, 'fitness');
      assert.equal(params.geo, 'US');
      assert.equal(params.hl, 'en');
      return makeTrendsResponse([
        makeRankedKeyword('fitness meal prep'),
        makeRankedKeyword('fitness tracker'),
      ]);
    });

    const results = await fetchTrendsDynamic(['fitness'], client);
    assert.equal(results.length, 2);
    assert.equal(results[0].source_type, 'google_trends');
    assert.ok(results[0].title.includes('fitness meal prep'));
    assert.ok(results[1].title.includes('fitness tracker'));
    assert.equal(results[0].query_used, 'fitness');
  });

  // Test 2: Multiple keywords run in parallel via Promise.allSettled
  it('2. Multiple keywords run in parallel', async () => {
    const calledKeywords: string[] = [];
    const client = createMockClient(async (params) => {
      calledKeywords.push(params.keyword);
      return makeTrendsResponse([
        makeRankedKeyword(`${params.keyword} trend`),
      ]);
    });

    const results = await fetchTrendsDynamic(
      ['fitness', 'nutrition', 'workout'],
      client
    );

    assert.equal(calledKeywords.length, 3, 'All 3 keywords should be fetched');
    assert.equal(results.length, 3, 'Should return 1 result per keyword');
    assert.ok(results.some((r) => r.query_used === 'fitness'));
    assert.ok(results.some((r) => r.query_used === 'nutrition'));
    assert.ok(results.some((r) => r.query_used === 'workout'));
  });

  // Test 3: Single keyword failure doesn't block others (AC9)
  it('3. Single keyword failure does not block others', async () => {
    let callCount = 0;
    const client = createMockClient(async (params) => {
      callCount++;
      if (callCount === 2) throw new Error('API rate limited');
      return makeTrendsResponse([
        makeRankedKeyword(`${params.keyword} trend`),
      ]);
    });

    const results = await fetchTrendsDynamic(
      ['keyword1', 'keyword2', 'keyword3'],
      client
    );
    assert.equal(results.length, 2, 'Should return results from 2 successful keywords');
  });

  // Test 4: No reference to env.GOOGLE_TRENDS_KEYWORDS (AC7)
  it('4. No reference to env.GOOGLE_TRENDS_KEYWORDS in source', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = resolve(fileURLToPath(import.meta.url), '..');
    const sourcePath = resolve(__dirname, '..', 'sources', 'trends-dynamic.source.ts');
    const sourceCode = readFileSync(sourcePath, 'utf-8');

    assert.ok(
      !sourceCode.includes('GOOGLE_TRENDS_KEYWORDS'),
      'Source file must NOT reference GOOGLE_TRENDS_KEYWORDS'
    );
    assert.ok(
      !sourceCode.includes("env.GOOGLE_TRENDS"),
      'Source file must NOT reference env.GOOGLE_TRENDS'
    );
  });

  // Test 5: Max 5 keywords from profile (AC2)
  it('5. Only first 5 keywords from profile are used', async () => {
    const calledKeywords: string[] = [];
    const client = createMockClient(async (params) => {
      calledKeywords.push(params.keyword);
      return makeTrendsResponse([makeRankedKeyword('trend')]);
    });

    await fetchTrendsDynamic(
      ['kw1', 'kw2', 'kw3', 'kw4', 'kw5', 'kw6', 'kw7'],
      client
    );

    assert.equal(calledKeywords.length, 5, 'Should only process first 5 keywords');
    assert.ok(!calledKeywords.includes('kw6'));
    assert.ok(!calledKeywords.includes('kw7'));
  });

  // Test 6: Geo defaults to US, hl to en (AC4)
  it('6. Geo defaults to US, hl defaults to en', async () => {
    let capturedParams: { geo: string; hl: string } | null = null;
    const client = createMockClient(async (params) => {
      capturedParams = { geo: params.geo, hl: params.hl };
      return makeTrendsResponse([]);
    });

    await fetchTrendsDynamic(['test'], client);
    assert.equal(capturedParams!.geo, 'US');
    assert.equal(capturedParams!.hl, 'en');
  });

  // Test 7: Scoring fields zeroed — left for profile-scorer
  it('7. Scoring fields are zeroed — left for profile-scorer', async () => {
    const client = createMockClient(async () =>
      makeTrendsResponse([makeRankedKeyword('test query')])
    );

    const results = await fetchTrendsDynamic(['test'], client);
    const r = results[0];
    assert.equal(r.recency_score, 0);
    assert.equal(r.engagement_score, 0);
    assert.equal(r.relevance_score, 0);
    assert.equal(r.richness_score, 0);
    assert.equal(r.pillar_alignment_score, 0);
    assert.equal(r.final_score, 0);
  });

  // Test 8: Category is null — dynamic, not hardcoded (AC8)
  it('8. Category is null — not hardcoded', async () => {
    const client = createMockClient(async () =>
      makeTrendsResponse([makeRankedKeyword('any query')])
    );

    const results = await fetchTrendsDynamic(['test'], client);
    assert.equal(results[0].category, null, 'Category should be null, not hardcoded');
  });

  // Test 9: Short query texts (< 3 chars) are filtered out
  it('9. Queries with text < 3 chars are filtered out', async () => {
    const response = JSON.stringify({
      default: {
        rankedList: [
          {
            rankedKeyword: [
              makeRankedKeyword('ab'),
              makeRankedKeyword(''),
              makeRankedKeyword('valid query text'),
            ],
          },
        ],
      },
    });

    const client = createMockClient(async () => response);
    const results = await fetchTrendsDynamic(['test'], client);
    assert.equal(results.length, 1, 'Only queries >= 3 chars should pass');
    assert.ok(results[0].title.includes('valid query text'));
  });

  // Test 10: Empty keywords array returns empty results
  it('10. Empty keywords array returns empty results', async () => {
    const client = createMockClient(async () => {
      throw new Error('Should not be called');
    });

    const results = await fetchTrendsDynamic([], client);
    assert.equal(results.length, 0);
  });

  // Test 11: URL includes trends.google.com link
  it('11. URL correctly prefixed with trends.google.com', async () => {
    const client = createMockClient(async () =>
      makeTrendsResponse([makeRankedKeyword('fitness trends')])
    );

    const results = await fetchTrendsDynamic(['fitness'], client);
    assert.ok(
      results[0].url?.startsWith('https://trends.google.com'),
      `URL should start with https://trends.google.com, got: ${results[0].url}`
    );
  });

  // Test 12: Top 5 from each ranked list only
  it('12. Takes max 5 results from each ranked list', async () => {
    const keywords = Array.from({ length: 10 }, (_, i) =>
      makeRankedKeyword(`query number ${i + 1}`)
    );
    const client = createMockClient(async () =>
      JSON.stringify({ default: { rankedList: [{ rankedKeyword: keywords }] } })
    );

    const results = await fetchTrendsDynamic(['test'], client);
    assert.equal(results.length, 5, 'Should take only top 5 from ranked list');
  });
});
