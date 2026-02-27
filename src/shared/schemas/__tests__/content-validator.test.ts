/**
 * Tests for content-validator — Story 6.2 (PDCE-02)
 * Validates universal SlideRole enum and legacy role mapping.
 *
 * Run with: npx tsx --test src/shared/schemas/__tests__/content-validator.test.ts
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mapLegacyRole, parseAndValidateContent } from '../content-validator.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeCarouselJson(overrides: Record<string, unknown> = {}) {
  const base = {
    theme: 'Test theme for universal slide roles validation — PDCE-02',
    total_slides: 6,
    slides: [
      { slide: 1, role: 'hook', headline: 'Hook headline text here', image: true },
      { slide: 2, role: 'context', headline: 'Context slide text here', image: false },
      { slide: 3, role: 'content', headline: 'Content slide text here', image: false },
      { slide: 4, role: 'tension', headline: 'Tension slide text here', image: false },
      { slide: 5, role: 'soft-cta', headline: 'Soft CTA slide text here', image: false },
      { slide: 6, role: 'cta', headline: 'CTA slide text here', image: false },
    ],
    caption:
      'Test caption that is long enough to pass the minimum length requirement of fifty characters for schema.',
    hashtags: ['#test', '#pdce', '#roles'],
    cta_text: 'Save this post',
    best_posting_time: '10:00 BRT',
    ...overrides,
  };
  return JSON.stringify(base);
}

// ─── mapLegacyRole unit tests ───────────────────────────────────────────────

test('mapLegacyRole — universal roles pass through unchanged', () => {
  const universalRoles = ['hook', 'context', 'content', 'tension', 'soft-cta', 'cta'] as const;
  for (const role of universalRoles) {
    assert.equal(mapLegacyRole(role), role, `${role} should pass through`);
  }
});

test('mapLegacyRole — legacy editorial roles map correctly', () => {
  assert.equal(mapLegacyRole('pattern-interrupt'), 'tension');
  assert.equal(mapLegacyRole('conflict'), 'tension');
  assert.equal(mapLegacyRole('conclusion'), 'soft-cta');
});

test('mapLegacyRole — legacy authority role maps correctly', () => {
  assert.equal(mapLegacyRole('engagement'), 'content');
});

test('mapLegacyRole — unknown roles fall back to content', () => {
  assert.equal(mapLegacyRole('random-unknown'), 'content');
  assert.equal(mapLegacyRole(''), 'content');
});

// ─── parseAndValidateContent — universal roles ─────────────────────────────

test('parseAndValidateContent — all 6 universal roles pass validation', () => {
  const result = parseAndValidateContent(makeCarouselJson());
  assert.equal(result.slides.length, 6);
  assert.equal(result.slides[0].role, 'hook');
  assert.equal(result.slides[1].role, 'context');
  assert.equal(result.slides[2].role, 'content');
  assert.equal(result.slides[3].role, 'tension');
  assert.equal(result.slides[4].role, 'soft-cta');
  assert.equal(result.slides[5].role, 'cta');
});

// ─── parseAndValidateContent — backward compatibility ──────────────────────

test('parseAndValidateContent — legacy roles are mapped before validation', () => {
  const json = JSON.stringify({
    theme: 'Legacy role mapping backward compat test for universal roles migration',
    total_slides: 5,
    slides: [
      { slide: 1, role: 'hook', headline: 'Hook slide here text', image: true },
      { slide: 2, role: 'pattern-interrupt', headline: 'Legacy pattern-interrupt role', image: false },
      { slide: 3, role: 'conflict', headline: 'Legacy conflict role maps to tension', image: false },
      { slide: 4, role: 'conclusion', headline: 'Legacy conclusion maps to soft-cta', image: false },
      { slide: 5, role: 'cta', headline: 'CTA slide here text', image: false },
    ],
    caption:
      'This tests backward compatibility with legacy role names from editorial and authority pipelines.',
    hashtags: ['#legacy', '#compat', '#test'],
    cta_text: 'Follow now',
    best_posting_time: '09:00 BRT',
  });

  const result = parseAndValidateContent(json);
  assert.equal(result.slides[1].role, 'tension', 'pattern-interrupt → tension');
  assert.equal(result.slides[2].role, 'tension', 'conflict → tension');
  assert.equal(result.slides[3].role, 'soft-cta', 'conclusion → soft-cta');
});

// ─── parseAndValidateContent — invalid roles rejected ──────────────────────

test('parseAndValidateContent — invalid role is mapped to content (not rejected)', () => {
  const json = JSON.stringify({
    theme: 'Invalid role fallback test — unknown roles default to content role mapping',
    total_slides: 5,
    slides: [
      { slide: 1, role: 'hook', headline: 'Hook slide for test', image: true },
      { slide: 2, role: 'totally-invalid-role', headline: 'This should become content', image: false },
      { slide: 3, role: 'content', headline: 'Normal content slide text', image: false },
      { slide: 4, role: 'content', headline: 'More content here text', image: false },
      { slide: 5, role: 'cta', headline: 'Final CTA slide text', image: false },
    ],
    caption:
      'Test that unknown roles gracefully map to content via the legacy fallback mechanism in validator.',
    hashtags: ['#fallback', '#test', '#roles'],
    cta_text: 'Save post',
    best_posting_time: '12:00 BRT',
  });

  const result = parseAndValidateContent(json);
  assert.equal(result.slides[1].role, 'content', 'unknown role should fallback to content');
});

// ─── parseAndValidateContent — structural checks still work ────────────────

test('parseAndValidateContent — first slide must be hook', () => {
  const json = JSON.stringify({
    theme: 'First slide role check — must be hook role for content validation test',
    total_slides: 5,
    slides: [
      { slide: 1, role: 'content', headline: 'Not a hook slide text', image: false },
      { slide: 2, role: 'content', headline: 'Content slide text here', image: false },
      { slide: 3, role: 'content', headline: 'More content text here', image: false },
      { slide: 4, role: 'content', headline: 'Even more content text', image: false },
      { slide: 5, role: 'cta', headline: 'CTA slide text end here', image: false },
    ],
    caption: 'Caption for test requiring first slide to be hook role. Must be fifty chars at least.',
    hashtags: ['#hook', '#test', '#roles'],
    cta_text: 'Follow me',
    best_posting_time: '10:00 BRT',
  });

  assert.throws(() => parseAndValidateContent(json), /First slide must have role "hook"/);
});

test('parseAndValidateContent — last slide must be cta', () => {
  const json = JSON.stringify({
    theme: 'Last slide role check — must be cta role for content validation checking',
    total_slides: 5,
    slides: [
      { slide: 1, role: 'hook', headline: 'Hook slide text here', image: true },
      { slide: 2, role: 'content', headline: 'Content slide text here', image: false },
      { slide: 3, role: 'content', headline: 'More content text here', image: false },
      { slide: 4, role: 'content', headline: 'Even more content text', image: false },
      { slide: 5, role: 'content', headline: 'Not a CTA last slide', image: false },
    ],
    caption: 'Caption for test requiring last slide to be cta role. Must be fifty characters long.',
    hashtags: ['#cta', '#test', '#roles'],
    cta_text: 'Follow me now',
    best_posting_time: '10:00 BRT',
  });

  assert.throws(() => parseAndValidateContent(json), /Last slide must have role "cta"/);
});

test('parseAndValidateContent — invalid JSON throws', () => {
  assert.throws(() => parseAndValidateContent('not valid json {{{'), /Invalid JSON/);
});
