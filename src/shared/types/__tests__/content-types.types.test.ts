/**
 * Unit tests for content-types.types.ts — Story 2.2 / AC10
 *
 * Run with:
 *   npx tsx --test src/shared/types/__tests__/content-types.types.test.ts
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    CONTENT_TYPES,
    getContentType,
} from '../content-types.types.js';
import type { ContentTypeId } from '../content-types.types.js';

// ── Happy path ────────────────────────────────────────────────────────────────

test('getContentType("educational") returns correct config', () => {
    const type = getContentType('educational');
    assert.equal(type.id, 'educational');
    assert.equal(type.label, 'Educacional');
    assert.equal(type.needsExternalSource, true);
    assert.ok(type.compatibleDepths.includes('shallow'));
    assert.ok(type.compatibleDepths.includes('balanced'));
    assert.ok(type.compatibleDepths.includes('dense'));
});

// ── Error case ───────────────────────────────────────────────────────────────

test('getContentType with unknown id throws expected error message', () => {
    assert.throws(
        () => getContentType('invalid' as ContentTypeId),
        (err: unknown) => {
            assert.ok(err instanceof Error);
            assert.ok(
                err.message.includes('[CONTENT-TYPES] Unknown content type: invalid'),
                `Expected error message to contain "[CONTENT-TYPES] Unknown content type: invalid", got: "${err.message}"`
            );
            return true;
        }
    );
});

// ── All 7 type IDs resolve ────────────────────────────────────────────────────

const ALL_TYPE_IDS: ContentTypeId[] = [
    'educational',
    'tutorial',
    'sales',
    'authority',
    'story',
    'list',
    'controversy',
];

test('CONTENT_TYPES contains exactly 7 types', () => {
    assert.equal(CONTENT_TYPES.length, 7);
});

for (const id of ALL_TYPE_IDS) {
    test(`getContentType("${id}") resolves without error`, () => {
        const type = getContentType(id);
        assert.equal(type.id, id);
    });
}

// ── Each type has at least one narrativeTemplate key ─────────────────────────

test('every content type has at least one narrativeTemplate entry', () => {
    for (const type of CONTENT_TYPES) {
        const entries = Object.entries(type.narrativeTemplate);
        assert.ok(
            entries.length > 0,
            `ContentType "${type.id}" has no narrativeTemplate keys`
        );
        for (const [, slides] of entries) {
            assert.ok(
                Array.isArray(slides) && slides.length > 0,
                `ContentType "${type.id}" has an empty narrativeTemplate array`
            );
        }
    }
});

// ── slideCountRange is defined for all compatibleDepths ──────────────────────

test('each contentType has slideCountRange defined for all its compatibleDepths', () => {
    for (const type of CONTENT_TYPES) {
        for (const depth of type.compatibleDepths) {
            const range = type.slideCountRange[depth];
            assert.ok(
                range !== undefined,
                `ContentType "${type.id}" is missing slideCountRange for depth="${depth}"`
            );
            assert.ok(range!.min <= range!.max, `ContentType "${type.id}" has min > max for depth="${depth}"`);
            assert.ok(range!.min >= 4, `ContentType "${type.id}" depth="${depth}" min (${range!.min}) is below schema minimum of 4`);
            assert.ok(range!.max <= 20, `ContentType "${type.id}" depth="${depth}" max (${range!.max}) exceeds schema maximum of 20`);
        }
    }
});

// ── tutorial does NOT support shallow ────────────────────────────────────────

test('tutorial type does not support shallow depth', () => {
    const type = getContentType('tutorial');
    assert.ok(!type.compatibleDepths.includes('shallow'));
    assert.equal(type.slideCountRange['shallow'], undefined);
});

// ── sales type requires offer ─────────────────────────────────────────────────

test('sales type has requiresOffer=true', () => {
    const type = getContentType('sales');
    assert.equal(type.requiresOffer, true);
});
