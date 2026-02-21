/**
 * Integration tests for ContentCarouselSchema — Story 2.8 / AC3
 *
 * Run with: npx tsx --test src/shared/schemas/__tests__/content-schema.test.ts
 * (No external test runner required — uses Node.js built-in test runner via tsx)
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ContentCarouselSchema } from '../content-schema.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeSlide(i: number) {
    return {
        slide: i + 1,
        role: i === 0 ? 'hook' : i === 16 ? 'cta' : 'content',
        headline: `Slide ${i + 1} headline — integration test content for depth validation`,
        image: i === 0, // hook always has image
    };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test('AC3 — 17-slide dense educational payload passes schema max(20)', () => {
    const payload = {
        theme: 'Test theme for dense post — Story 2.8 AC3 integration test',
        total_slides: 17,
        content_type: 'educational',
        depth_level: 'dense',
        slides: Array.from({ length: 17 }, (_, i) => makeSlide(i)),
        caption:
            'Test caption for a dense educational post about learning. This text is here to meet the minimum length requirement for the caption field in the schema. More content here.',
        hashtags: ['#test', '#educational', '#shadowfeed'],
        cta_text: 'Save this post!',
        best_posting_time: 'Morning — 08:00 BRT',
    };

    const result = ContentCarouselSchema.safeParse(payload);

    if (!result.success) {
        console.error('Zod validation errors:', result.error.issues);
    }

    assert.equal(result.success, true, '17-slide payload must pass ContentCarouselSchema.safeParse()');
});

test('AC3 — 20-slide payload passes schema max(20)', () => {
    const payload = {
        theme: 'Maximum density test — Story 2.8 AC3 edge case at max slides',
        total_slides: 20,
        slides: Array.from({ length: 20 }, (_, i) => ({
            ...makeSlide(i),
            role: i === 0 ? 'hook' : i === 19 ? 'cta' : 'content',
        })),
        caption:
            'Test caption for 20-slide maximum density carousel. Must be at least 50 characters long for schema validation to pass correctly in this test.',
        hashtags: ['#max', '#density', '#test'],
        cta_text: 'Follow for more',
        best_posting_time: '18:00 BRT',
    };

    const result = ContentCarouselSchema.safeParse(payload);

    if (!result.success) {
        console.error('Zod validation errors:', result.error.issues);
    }

    assert.equal(result.success, true, '20-slide payload must pass ContentCarouselSchema.safeParse()');
});

test('AC3 — 21-slide payload is REJECTED by schema (above max)', () => {
    const payload = {
        theme: 'Overflow test — must be rejected by schema',
        total_slides: 21,
        slides: Array.from({ length: 21 }, (_, i) => ({
            ...makeSlide(i),
            role: i === 0 ? 'hook' : i === 20 ? 'cta' : 'content',
        })),
        caption: 'Test caption that is long enough to pass the minimum length requirement of fifty characters.',
        hashtags: ['#overflow', '#rejected', '#test'],
        cta_text: 'This should fail',
        best_posting_time: '12:00 BRT',
    };

    const result = ContentCarouselSchema.safeParse(payload);
    assert.equal(result.success, false, '21-slide payload must be REJECTED by ContentCarouselSchema');
});

test('AC3 — minimum 5-slide payload passes (boundary check)', () => {
    const payload = {
        theme: 'Minimum slides test — five slides boundary case for schema validation',
        total_slides: 5,
        slides: [
            { slide: 1, role: 'hook', headline: 'Hook slide with enough text', image: true },
            { slide: 2, role: 'content', headline: 'Content slide two longer text here', image: false },
            { slide: 3, role: 'content', headline: 'Content slide three more words', image: false },
            { slide: 4, role: 'content', headline: 'Content slide four even more words', image: false },
            { slide: 5, role: 'cta', headline: 'Final CTA slide save this post', image: false },
        ],
        caption: 'Minimum caption length must be at least fifty characters for this to pass Zod schema.',
        hashtags: ['#min', '#test', '#schema'],
        cta_text: 'Save post',
        best_posting_time: '10:00 BRT',
    };

    const result = ContentCarouselSchema.safeParse(payload);

    if (!result.success) {
        console.error('Zod validation errors:', result.error.issues);
    }

    assert.equal(result.success, true, '5-slide payload (minimum) must pass ContentCarouselSchema.safeParse()');
});
