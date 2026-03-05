/**
 * Tests for blog-url-validator — Story 3.1 (RU-10)
 * Validates URL format, HTTPS, social media blocking, SSRF prevention.
 *
 * Run with: npx tsx --test src/modules/recon-ultra/__tests__/blog-url-validator.test.ts
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isPrivateIp, isBlockedDomain, BLOCKED_DOMAINS } from '../blog-url-validator.js';

// ── isBlockedDomain ──────────────────────────────────────────

describe('isBlockedDomain', () => {
  it('blocks exact social media domains', () => {
    for (const domain of BLOCKED_DOMAINS) {
      assert.ok(isBlockedDomain(domain), `Should block ${domain}`);
    }
  });

  it('blocks subdomains of social media', () => {
    assert.ok(isBlockedDomain('www.twitter.com'));
    assert.ok(isBlockedDomain('mobile.x.com'));
    assert.ok(isBlockedDomain('api.reddit.com'));
  });

  it('allows normal blog domains', () => {
    assert.ok(!isBlockedDomain('techcrunch.com'));
    assert.ok(!isBlockedDomain('blog.example.com'));
    assert.ok(!isBlockedDomain('my-personal-blog.dev'));
  });
});

// ── isPrivateIp ──────────────────────────────────────────────

describe('isPrivateIp', () => {
  it('blocks localhost', () => {
    assert.ok(isPrivateIp('localhost'));
    assert.ok(isPrivateIp('127.0.0.1'));
    assert.ok(isPrivateIp('127.0.1.1'));
  });

  it('blocks 0.0.0.0', () => {
    assert.ok(isPrivateIp('0.0.0.0'));
  });

  it('blocks private IP ranges', () => {
    assert.ok(isPrivateIp('10.0.0.1'));
    assert.ok(isPrivateIp('172.16.0.1'));
    assert.ok(isPrivateIp('172.31.255.255'));
    assert.ok(isPrivateIp('192.168.1.1'));
  });

  it('allows public IPs', () => {
    assert.ok(!isPrivateIp('8.8.8.8'));
    assert.ok(!isPrivateIp('1.1.1.1'));
    assert.ok(!isPrivateIp('203.0.113.1'));
  });

  it('blocks IPv6 loopback and private', () => {
    assert.ok(isPrivateIp('::1'));
    assert.ok(isPrivateIp('fc00:1234::1'));
    assert.ok(isPrivateIp('fe80::1'));
  });

  it('blocks link-local 169.254.x.x', () => {
    assert.ok(isPrivateIp('169.254.1.1'));
  });
});
