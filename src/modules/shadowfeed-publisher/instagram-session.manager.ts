import { promises as fs } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import type { BrowserContext, Browser } from 'playwright';

type StorageState = NonNullable<Parameters<Browser['newContext']>[0]>['storageState'];
import { env } from '../../config/env.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SessionStatus {
  connected: boolean;
  lastChecked: Date;
  expiresAt?: Date;
}

// Minimal shape we need from the stored cookies for validity checks
interface StoredCookie {
  name: string;
  expires: number; // Unix timestamp seconds, or -1 for session cookie
}

// ─── InstagramSessionManager ─────────────────────────────────────────────────

export class InstagramSessionManager {
  private readonly sessionPath: string;

  constructor() {
    this.sessionPath = path.join(env.SHADOWFEED_SESSION_DIR, 'session.json');
  }

  /**
   * Loads persisted session from SHADOWFEED_SESSION_DIR and returns a
   * Playwright BrowserContext with it applied. Caller is responsible for
   * closing context.browser() when done.
   */
  async loadSession(): Promise<BrowserContext> {
    const raw = await fs.readFile(this.sessionPath, 'utf-8');
    const storageState = JSON.parse(raw) as StorageState;

    const browser = await chromium.launch({ headless: true });
    return browser.newContext({
      storageState,
      viewport: { width: 1920, height: 1080 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
  }

  /**
   * Checks whether the stored session cookies are still valid (not expired).
   * Returns false if session file is missing or cookies are expired.
   */
  async isSessionValid(): Promise<boolean> {
    try {
      const raw = await fs.readFile(this.sessionPath, 'utf-8');
      const storageState = JSON.parse(raw) as { cookies: StoredCookie[] };

      const sessionCookie = storageState.cookies.find(
        (c) => c.name === 'sessionid' || c.name === 'ds_user_id'
      );

      if (!sessionCookie) return false;

      // Session cookies (expires === -1) don't expire
      if (sessionCookie.expires === -1) return true;

      return sessionCookie.expires * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  /**
   * Returns status data for the session/status endpoint.
   */
  async getStatus(): Promise<SessionStatus> {
    const lastChecked = new Date();

    try {
      const raw = await fs.readFile(this.sessionPath, 'utf-8');
      const storageState = JSON.parse(raw) as { cookies: StoredCookie[] };

      const sessionCookie = storageState.cookies.find((c) => c.name === 'sessionid');

      if (!sessionCookie) {
        return { connected: false, lastChecked };
      }

      const expiresAt =
        sessionCookie.expires !== -1 ? new Date(sessionCookie.expires * 1000) : undefined;

      const connected = expiresAt ? expiresAt > lastChecked : true;

      return { connected, lastChecked, expiresAt };
    } catch {
      return { connected: false, lastChecked };
    }
  }

  /**
   * Persists a new Playwright storageState to disk (used after manual login).
   */
  async saveSession(storageState: object): Promise<void> {
    await fs.mkdir(env.SHADOWFEED_SESSION_DIR, { recursive: true });
    await fs.writeFile(this.sessionPath, JSON.stringify(storageState, null, 2), 'utf-8');
  }
}

export const instagramSessionManager = new InstagramSessionManager();
