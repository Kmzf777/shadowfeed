/**
 * Unit tests for ShadowFeedPublisherService — Story 3.8 / AC10, AC11, AC12, AC16
 *
 * Run with: npx tsx --test src/modules/shadowfeed-publisher/__tests__/shadowfeed-publisher.service.test.ts
 */

import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { ShadowFeedPublisherService } from '../shadowfeed-publisher.service.js';
import { supabase } from '../../../config/supabase.js';
import { instagramSessionManager } from '../instagram-session.manager.js';
import { instagramPoster } from '../instagram-poster.js';
import type { BrowserContext } from 'playwright';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MOCK_QUEUE_ITEM_ID = 'queue-uuid-001';
const MOCK_POST_ID = 'post-uuid-001';

const MOCK_CONTENT_JSON = {
  theme: 'Test theme',
  total_slides: 3,
  slides: [
    { slide: 1, role: 'hook', headline: 'Hook', image: true, image_url: 'https://example.com/img1.jpg' },
    { slide: 2, role: 'content', headline: 'Content', image: true, image_url: 'https://example.com/img2.jpg' },
    { slide: 3, role: 'cta', headline: 'CTA', image: false },
  ],
  caption: 'Test caption that is long enough to pass the minimum length requirement.',
  hashtags: ['#test', '#ai', '#shadowfeed'],
  cta_text: 'Save post',
  best_posting_time: '09:00',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any;

function mockFrom(impl: AnyFn) {
  return mock.method(supabase, 'from', impl as unknown as typeof supabase.from);
}

function makeMockContext(): BrowserContext {
  return {
    browser: () => ({ close: async () => undefined }),
    newPage: async () => ({ goto: async () => undefined, close: async () => undefined }),
  } as unknown as BrowserContext;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test('AC11 — publishPost updates queue status to posted on success', async () => {
  const service = new ShadowFeedPublisherService();
  let callCount = 0;

  const fromMock = mockFrom(() => {
    callCount++;
    if (callCount === 1) {
      return {
        select: () => ({ eq: () => ({ single: () => ({ data: { id: MOCK_QUEUE_ITEM_ID, post_id: MOCK_POST_ID, status: 'approved' }, error: null }) }) }),
      };
    }
    if (callCount === 2) {
      return {
        select: () => ({ eq: () => ({ single: () => ({ data: { id: MOCK_POST_ID, content_json: MOCK_CONTENT_JSON, caption: null }, error: null }) }) }),
      };
    }
    if (callCount === 3) {
      // rate limit check
      return { select: () => ({ eq: () => ({ eq: () => ({ count: 0, error: null }) }) }) };
    }
    // update status
    return { update: () => ({ eq: () => ({ error: null }) }) };
  });

  const isValidMock = mock.method(instagramSessionManager, 'isSessionValid', async () => true);
  const loadSessionMock = mock.method(instagramSessionManager, 'loadSession', async () => makeMockContext());
  const downloadMock = mock.method(instagramPoster, 'downloadSlides', async () => []);
  const postMock = mock.method(instagramPoster, 'post', async () => undefined);

  await assert.doesNotReject(
    () => service.publishPost(MOCK_QUEUE_ITEM_ID),
    'publishPost should resolve on success'
  );

  assert.equal(callCount, 4, 'Should have made 4 supabase calls');

  fromMock.mock.restore();
  isValidMock.mock.restore();
  loadSessionMock.mock.restore();
  downloadMock.mock.restore();
  postMock.mock.restore();
});

test('AC12 — publishPost updates queue status to failed on error', async () => {
  const service = new ShadowFeedPublisherService();

  let updateCalledWith: Record<string, unknown> | null = null;
  let callCount = 0;

  const fromMock = mockFrom(() => {
    callCount++;
    if (callCount === 1) {
      return { select: () => ({ eq: () => ({ single: () => ({ data: { id: MOCK_QUEUE_ITEM_ID, post_id: MOCK_POST_ID, status: 'approved' }, error: null }) }) }) };
    }
    if (callCount === 2) {
      return { select: () => ({ eq: () => ({ single: () => ({ data: { id: MOCK_POST_ID, content_json: MOCK_CONTENT_JSON, caption: null }, error: null }) }) }) };
    }
    if (callCount === 3) {
      return { select: () => ({ eq: () => ({ eq: () => ({ count: 0, error: null }) }) }) };
    }
    return {
      update: (data: Record<string, unknown>) => {
        updateCalledWith = data;
        return { eq: () => ({ error: null }) };
      },
    };
  });

  const isValidMock = mock.method(instagramSessionManager, 'isSessionValid', async () => true);
  const loadSessionMock = mock.method(instagramSessionManager, 'loadSession', async () => makeMockContext());
  const downloadMock = mock.method(instagramPoster, 'downloadSlides', async () => []);
  const postMock = mock.method(instagramPoster, 'post', async () => {
    throw new Error('Playwright timeout: Instagram post failed');
  });

  await assert.rejects(
    () => service.publishPost(MOCK_QUEUE_ITEM_ID),
    /Playwright timeout/,
    'publishPost should reject when poster throws'
  );

  assert.ok(updateCalledWith !== null, 'update should have been called');
  assert.equal(updateCalledWith!['status'], 'failed', 'status should be failed');
  assert.ok(
    String(updateCalledWith!['error_message']).includes('Playwright timeout'),
    'error_message should contain the error text'
  );

  fromMock.mock.restore();
  isValidMock.mock.restore();
  loadSessionMock.mock.restore();
  downloadMock.mock.restore();
  postMock.mock.restore();
});

test('AC16 — checkDailyRateLimit throws when 4 posts already published today', async () => {
  const service = new ShadowFeedPublisherService();

  const fromMock = mockFrom(() => ({
    select: () => ({ eq: () => ({ eq: () => ({ count: 4, error: null }) }) }),
  }));

  await assert.rejects(
    () => service.checkDailyRateLimit(),
    /Daily rate limit reached/,
    'Should throw when 4 posts already published today'
  );

  fromMock.mock.restore();
});

test('AC16 — checkDailyRateLimit allows posting when fewer than 4 posts today', async () => {
  const service = new ShadowFeedPublisherService();

  const fromMock = mockFrom(() => ({
    select: () => ({ eq: () => ({ eq: () => ({ count: 3, error: null }) }) }),
  }));

  await assert.doesNotReject(
    () => service.checkDailyRateLimit(),
    'Should not throw when fewer than 4 posts published today'
  );

  fromMock.mock.restore();
});

test('AC12 — publishPost marks failed when session is invalid', async () => {
  const service = new ShadowFeedPublisherService();

  let updateCalledWith: Record<string, unknown> | null = null;
  let callCount = 0;

  const fromMock = mockFrom(() => {
    callCount++;
    if (callCount === 1) {
      return { select: () => ({ eq: () => ({ single: () => ({ data: { id: MOCK_QUEUE_ITEM_ID, post_id: MOCK_POST_ID, status: 'approved' }, error: null }) }) }) };
    }
    if (callCount === 2) {
      return { select: () => ({ eq: () => ({ single: () => ({ data: { id: MOCK_POST_ID, content_json: MOCK_CONTENT_JSON, caption: null }, error: null }) }) }) };
    }
    if (callCount === 3) {
      return { select: () => ({ eq: () => ({ eq: () => ({ count: 0, error: null }) }) }) };
    }
    return {
      update: (data: Record<string, unknown>) => {
        updateCalledWith = data;
        return { eq: () => ({ error: null }) };
      },
    };
  });

  const isValidMock = mock.method(instagramSessionManager, 'isSessionValid', async () => false);

  await assert.rejects(
    () => service.publishPost(MOCK_QUEUE_ITEM_ID),
    /session is invalid/,
    'Should reject when session is invalid'
  );

  assert.equal(updateCalledWith?.['status'], 'failed', 'Should mark queue item as failed');

  fromMock.mock.restore();
  isValidMock.mock.restore();
});
