/**
 * Unit tests for InstagramSessionManager — Story 3.8 / AC2, AC3, AC4
 *
 * Run with: npx tsx --test src/modules/shadowfeed-publisher/__tests__/instagram-session.manager.test.ts
 */

import assert from 'node:assert/strict';
import { test, mock, beforeEach, afterEach } from 'node:test';
import { promises as fs } from 'node:fs';
import { InstagramSessionManager } from '../instagram-session.manager.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FUTURE_EXPIRES = Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days from now
const PAST_EXPIRES = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

function makeStorageState(cookies: Array<{ name: string; expires: number }>): string {
  return JSON.stringify({ cookies, origins: [] });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test('AC3 — isSessionValid returns false when session file is missing', async () => {
  const manager = new InstagramSessionManager();

  // Mock fs.readFile to throw ENOENT
  const readFileMock = mock.method(fs, 'readFile', async () => {
    const err = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    throw err;
  });

  const result = await manager.isSessionValid();
  assert.equal(result, false, 'Should return false when session file is missing');

  readFileMock.mock.restore();
});

test('AC3 — isSessionValid returns false when cookies are expired', async () => {
  const manager = new InstagramSessionManager();

  const readFileMock = mock.method(fs, 'readFile', async () =>
    makeStorageState([{ name: 'sessionid', expires: PAST_EXPIRES }])
  );

  const result = await manager.isSessionValid();
  assert.equal(result, false, 'Should return false when sessionid cookie is expired');

  readFileMock.mock.restore();
});

test('AC3 — isSessionValid returns true when sessionid cookie has future expiry', async () => {
  const manager = new InstagramSessionManager();

  const readFileMock = mock.method(fs, 'readFile', async () =>
    makeStorageState([{ name: 'sessionid', expires: FUTURE_EXPIRES }])
  );

  const result = await manager.isSessionValid();
  assert.equal(result, true, 'Should return true when sessionid cookie expires in the future');

  readFileMock.mock.restore();
});

test('AC3 — isSessionValid returns true when ds_user_id is present as session cookie (expires=-1)', async () => {
  const manager = new InstagramSessionManager();

  const readFileMock = mock.method(fs, 'readFile', async () =>
    makeStorageState([{ name: 'ds_user_id', expires: -1 }])
  );

  const result = await manager.isSessionValid();
  assert.equal(result, true, 'Should return true for session cookie with expires=-1');

  readFileMock.mock.restore();
});

test('AC3 — isSessionValid returns false when no recognized cookie is present', async () => {
  const manager = new InstagramSessionManager();

  const readFileMock = mock.method(fs, 'readFile', async () =>
    makeStorageState([{ name: 'some_other_cookie', expires: FUTURE_EXPIRES }])
  );

  const result = await manager.isSessionValid();
  assert.equal(result, false, 'Should return false when no sessionid/ds_user_id cookie found');

  readFileMock.mock.restore();
});

test('AC4 — getStatus returns connected:false when file is missing', async () => {
  const manager = new InstagramSessionManager();

  const readFileMock = mock.method(fs, 'readFile', async () => {
    throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
  });

  const status = await manager.getStatus();

  assert.equal(status.connected, false);
  assert.ok(status.lastChecked instanceof Date);
  assert.equal(status.expiresAt, undefined);

  readFileMock.mock.restore();
});

test('AC4 — getStatus returns connected:true and expiresAt when session is valid', async () => {
  const manager = new InstagramSessionManager();

  const readFileMock = mock.method(fs, 'readFile', async () =>
    makeStorageState([{ name: 'sessionid', expires: FUTURE_EXPIRES }])
  );

  const status = await manager.getStatus();

  assert.equal(status.connected, true);
  assert.ok(status.expiresAt instanceof Date);
  assert.ok((status.expiresAt as Date).getTime() > Date.now());

  readFileMock.mock.restore();
});

test('AC4 — getStatus returns connected:false when session cookie is expired', async () => {
  const manager = new InstagramSessionManager();

  const readFileMock = mock.method(fs, 'readFile', async () =>
    makeStorageState([{ name: 'sessionid', expires: PAST_EXPIRES }])
  );

  const status = await manager.getStatus();

  assert.equal(status.connected, false);
  assert.ok(status.expiresAt instanceof Date);

  readFileMock.mock.restore();
});
