/**
 * Unit tests for validateDepthRange — Story 2.2 / AC10
 *
 * Run with:
 *   npx tsx --test src/shared/schemas/__tests__/content-validator.test.ts
 *
 * NOTE: This test patches the logger to suppress pino output during tests
 * and captures warn calls to verify warning behaviour without throwing.
 */

import assert from 'node:assert/strict';
import { test, mock } from 'node:test';

// ── Mock the logger BEFORE importing the module under test ────────────────────
// We intercept the logger module so pino doesn't error in test (no .env needed)
// and so we can capture warn/error calls.

const warnCalls: unknown[][] = [];
const loggerMock = {
    info: () => undefined,
    warn: (...args: unknown[]) => { warnCalls.push(args); },
    error: () => undefined,
    debug: () => undefined,
};

// Patch the config/logger module
mock.module('../../config/logger.js', {
    namedExports: { logger: loggerMock },
});

// Now import the module under test (after mock is registered)
const { validateDepthRange } = await import('../content-validator.js');

// ── Tests ─────────────────────────────────────────────────────────────────────

test('validateDepthRange — below min warns (does not throw)', () => {
    warnCalls.length = 0; // reset

    // educational shallow range: { min: 4, max: 8 }
    // 3 slides is below min=4 → should warn only
    assert.doesNotThrow(() => {
        validateDepthRange(3, 'shallow', 'educational');
    });

    assert.ok(
        warnCalls.length > 0,
        'Expected logger.warn to be called when slide count is below minimum'
    );
});

test('validateDepthRange — above max throws error', () => {
    // educational dense range: { min: 15, max: 20 }
    // 21 slides exceeds max=20 → should throw
    assert.throws(
        () => validateDepthRange(21, 'dense', 'educational'),
        (err: unknown) => {
            assert.ok(err instanceof Error);
            assert.ok(
                err.message.includes('[CONTENT-VALIDATOR]'),
                `Expected error message prefix "[CONTENT-VALIDATOR]", got: "${err.message}"`
            );
            assert.ok(
                err.message.includes('21'),
                `Expected slide count "21" in error message, got: "${err.message}"`
            );
            return true;
        }
    );
});

test('validateDepthRange — valid slide count passes silently', () => {
    warnCalls.length = 0;

    // educational balanced range: { min: 8, max: 15 }
    // 10 slides is in range → should not warn or throw
    assert.doesNotThrow(() => {
        validateDepthRange(10, 'balanced', 'educational');
    });

    assert.equal(
        warnCalls.length,
        0,
        'Expected no logger.warn calls for a valid slide count'
    );
});

test('validateDepthRange — unsupported depth returns silently (no range → skip)', () => {
    // tutorial has no "shallow" depth (compatibleDepths: ['balanced', 'dense'])
    // so slideCountRange.shallow is undefined → should return without warn or throw
    warnCalls.length = 0;

    assert.doesNotThrow(() => {
        validateDepthRange(5, 'shallow', 'tutorial');
    });

    assert.equal(warnCalls.length, 0, 'Expected no warnings for unsupported depth');
});

test('validateDepthRange — boundary: exactly at min passes silently', () => {
    warnCalls.length = 0;

    // educational shallow min=4
    assert.doesNotThrow(() => {
        validateDepthRange(4, 'shallow', 'educational');
    });

    assert.equal(warnCalls.length, 0, 'min boundary should pass silently');
});

test('validateDepthRange — boundary: exactly at max passes silently', () => {
    warnCalls.length = 0;

    // educational shallow max=8
    assert.doesNotThrow(() => {
        validateDepthRange(8, 'shallow', 'educational');
    });

    assert.equal(warnCalls.length, 0, 'max boundary should pass silently');
});
