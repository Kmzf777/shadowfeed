/**
 * Unit tests for ShadowFeedScheduler — Story 3.9 / FS-09
 * AC2, AC3, AC8, AC9, AC10
 *
 * Run with:
 *   npx tsx --test src/modules/forge-shadowfeed/__tests__/shadowfeed-scheduler.test.ts
 */

import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { ShadowFeedScheduler } from '../shadowfeed-scheduler.js';
import { supabase } from '../../../config/supabase.js';
import { shadowFeedPublisherService } from '../../shadowfeed-publisher/shadowfeed-publisher.service.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any;

function mockFrom(impl: AnyFn) {
  return mock.method(supabase, 'from', impl as unknown as typeof supabase.from);
}

const MOCK_QUEUE_ROW = {
  id: 'queue-uuid-001',
  pillar_id: 'wake-up-slap',
  scheduled_date: '2026-02-22',
  scheduled_time: '09:00:00',
  status: 'approved',
  post_id: 'post-uuid-001',
  theme_used: 'shadowfeed-brand',
  discovery_source: null,
  template_used: null,
  generation_time_ms: null,
  error_message: null,
};

// ─── getDueItems ─────────────────────────────────────────────────────────────

test('AC2 — getDueItems returns items for today with status approved', async () => {
  const scheduler = new ShadowFeedScheduler();

  const fromMock = mockFrom(() => ({
    select: () => ({
      eq: () => ({
        eq: () => ({
          lte: () => ({
            order: () => ({ data: [MOCK_QUEUE_ROW], error: null }),
          }),
        }),
      }),
    }),
  }));

  const items = await scheduler.getDueItems();

  assert.equal(items.length, 1, 'Should return one due item');
  assert.equal(items[0].id, 'queue-uuid-001');
  assert.equal(items[0].pillarId, 'wake-up-slap');
  assert.equal(items[0].status, 'approved');

  fromMock.mock.restore();
});

test('AC2 — getDueItems returns empty array when no items due', async () => {
  const scheduler = new ShadowFeedScheduler();

  const fromMock = mockFrom(() => ({
    select: () => ({
      eq: () => ({
        eq: () => ({
          lte: () => ({
            order: () => ({ data: [], error: null }),
          }),
        }),
      }),
    }),
  }));

  const items = await scheduler.getDueItems();
  assert.equal(items.length, 0, 'Should return empty array when nothing due');

  fromMock.mock.restore();
});

test('AC2 — getDueItems throws on Supabase error', async () => {
  const scheduler = new ShadowFeedScheduler();

  const fromMock = mockFrom(() => ({
    select: () => ({
      eq: () => ({
        eq: () => ({
          lte: () => ({
            order: () => ({ data: null, error: { message: 'DB connection lost' } }),
          }),
        }),
      }),
    }),
  }));

  await assert.rejects(
    () => scheduler.getDueItems(),
    /Failed to fetch due items/,
    'Should throw when Supabase returns an error'
  );

  fromMock.mock.restore();
});

// ─── claimItem ───────────────────────────────────────────────────────────────

test('AC10 — claimItem returns true when row transitions approved → posting', async () => {
  const scheduler = new ShadowFeedScheduler();

  const fromMock = mockFrom(() => ({
    update: () => ({
      eq: () => ({
        eq: () => ({
          select: () => ({ data: [{ id: 'queue-uuid-001' }], error: null }),
        }),
      }),
    }),
  }));

  const claimed = await scheduler.claimItem('queue-uuid-001');
  assert.equal(claimed, true, 'Should return true when claim succeeds');

  fromMock.mock.restore();
});

test('AC10 — claimItem returns false when item already claimed (no rows updated)', async () => {
  const scheduler = new ShadowFeedScheduler();

  const fromMock = mockFrom(() => ({
    update: () => ({
      eq: () => ({
        eq: () => ({
          select: () => ({ data: [], error: null }),
        }),
      }),
    }),
  }));

  const claimed = await scheduler.claimItem('queue-uuid-001');
  assert.equal(claimed, false, 'Should return false when no rows were updated');

  fromMock.mock.restore();
});

test('AC10 — claimItem returns false on Supabase error', async () => {
  const scheduler = new ShadowFeedScheduler();

  const fromMock = mockFrom(() => ({
    update: () => ({
      eq: () => ({
        eq: () => ({
          select: () => ({ data: null, error: { message: 'update failed' } }),
        }),
      }),
    }),
  }));

  const claimed = await scheduler.claimItem('queue-uuid-001');
  assert.equal(claimed, false, 'Should return false on error');

  fromMock.mock.restore();
});

// ─── checkAndPublish ─────────────────────────────────────────────────────────

test('AC3/AC9 — checkAndPublish publishes due items and returns counts', async () => {
  const scheduler = new ShadowFeedScheduler();

  // getDueItems returns one item
  const fromMock = mockFrom(() => ({
    select: () => ({
      eq: () => ({
        eq: () => ({
          lte: () => ({
            order: () => ({ data: [MOCK_QUEUE_ROW], error: null }),
          }),
        }),
      }),
    }),
    update: () => ({
      eq: () => ({
        eq: () => ({
          select: () => ({ data: [{ id: MOCK_QUEUE_ROW.id }], error: null }),
        }),
      }),
    }),
  }));

  const publishMock = mock.method(
    shadowFeedPublisherService,
    'publishPost',
    async () => undefined
  );

  const result = await scheduler.checkAndPublish();

  assert.equal(result.published, 1, 'Should count 1 published');
  assert.equal(result.failed, 0, 'Should count 0 failed');
  assert.equal(publishMock.mock.callCount(), 1, 'publishPost called once');
  assert.equal(
    publishMock.mock.calls[0].arguments[0],
    MOCK_QUEUE_ROW.id,
    'publishPost called with correct item id'
  );

  fromMock.mock.restore();
  publishMock.mock.restore();
});

test('AC10 — checkAndPublish skips items that could not be claimed', async () => {
  const scheduler = new ShadowFeedScheduler();
  let fromCallCount = 0;

  const fromMock = mockFrom(() => {
    fromCallCount++;
    if (fromCallCount === 1) {
      // getDueItems call
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              lte: () => ({
                order: () => ({ data: [MOCK_QUEUE_ROW], error: null }),
              }),
            }),
          }),
        }),
      };
    }
    // claimItem call — returns empty (already claimed)
    return {
      update: () => ({
        eq: () => ({
          eq: () => ({
            select: () => ({ data: [], error: null }),
          }),
        }),
      }),
    };
  });

  const publishMock = mock.method(
    shadowFeedPublisherService,
    'publishPost',
    async () => undefined
  );

  const result = await scheduler.checkAndPublish();

  assert.equal(result.published, 0, 'Should not count unclaimed item as published');
  assert.equal(result.failed, 0, 'Should not count unclaimed item as failed');
  assert.equal(publishMock.mock.callCount(), 0, 'publishPost should not be called');

  fromMock.mock.restore();
  publishMock.mock.restore();
});

test('AC9 — checkAndPublish counts failed items when publisher throws', async () => {
  const scheduler = new ShadowFeedScheduler();
  let fromCallCount = 0;

  const fromMock = mockFrom(() => {
    fromCallCount++;
    if (fromCallCount === 1) {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              lte: () => ({
                order: () => ({ data: [MOCK_QUEUE_ROW], error: null }),
              }),
            }),
          }),
        }),
      };
    }
    return {
      update: () => ({
        eq: () => ({
          eq: () => ({
            select: () => ({ data: [{ id: MOCK_QUEUE_ROW.id }], error: null }),
          }),
        }),
      }),
    };
  });

  const publishMock = mock.method(shadowFeedPublisherService, 'publishPost', async () => {
    throw new Error('Instagram session expired');
  });

  const result = await scheduler.checkAndPublish();

  assert.equal(result.published, 0, 'Should count 0 published');
  assert.equal(result.failed, 1, 'Should count 1 failed');

  fromMock.mock.restore();
  publishMock.mock.restore();
});

test('AC3 — checkAndPublish returns immediately with zero counts when queue is empty', async () => {
  const scheduler = new ShadowFeedScheduler();

  const fromMock = mockFrom(() => ({
    select: () => ({
      eq: () => ({
        eq: () => ({
          lte: () => ({
            order: () => ({ data: [], error: null }),
          }),
        }),
      }),
    }),
  }));

  const publishMock = mock.method(
    shadowFeedPublisherService,
    'publishPost',
    async () => undefined
  );

  const result = await scheduler.checkAndPublish();

  assert.equal(result.published, 0);
  assert.equal(result.failed, 0);
  assert.equal(publishMock.mock.callCount(), 0, 'publishPost should not be called when queue empty');

  fromMock.mock.restore();
  publishMock.mock.restore();
});
