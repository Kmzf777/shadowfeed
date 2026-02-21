import { PillarId, PillarTemplate } from './forge-shadowfeed.types.js';
import {
  BRAND_THEMES,
  BrandTheme,
  SHOWCASE_THEMES,
  ShowcaseTheme,
  ThemeRotationSource,
} from './shadowfeed-constants.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface TemplateUsageRecord {
  templateId: string;
  usedAt: number; // Unix timestamp ms
}

export interface PillarRotationState {
  pillarId: PillarId;
  history: TemplateUsageRecord[]; // recent uses (trimmed to 7-day window)
}

/**
 * Selects a template for a given pillar, avoiding templates used in the last 7 days.
 * Falls back to least-recently-used template if all have been used within the window.
 */
export function selectTemplate(
  templates: PillarTemplate[],
  state: PillarRotationState,
  nowMs: number = Date.now(),
): PillarTemplate {
  const cutoff = nowMs - SEVEN_DAYS_MS;
  const recentIds = new Set(
    state.history.filter((r) => r.usedAt > cutoff).map((r) => r.templateId),
  );

  const eligible = templates.filter((t) => !recentIds.has(t.id));

  if (eligible.length > 0) {
    return eligible[Math.floor(Math.random() * eligible.length)];
  }

  // Fallback: pick the least recently used template
  const sortedByAge = [...templates].sort((a, b) => {
    const aRecord = state.history.find((r) => r.templateId === a.id);
    const bRecord = state.history.find((r) => r.templateId === b.id);
    const aTime = aRecord ? aRecord.usedAt : 0;
    const bTime = bRecord ? bRecord.usedAt : 0;
    return aTime - bTime; // oldest first
  });

  return sortedByAge[0];
}

/**
 * Records a template use and trims history to the 7-day window.
 */
export function recordTemplateUse(
  state: PillarRotationState,
  templateId: string,
  nowMs: number = Date.now(),
): PillarRotationState {
  const cutoff = nowMs - SEVEN_DAYS_MS;
  const updatedHistory = [
    ...state.history.filter((r) => r.usedAt > cutoff),
    { templateId, usedAt: nowMs },
  ];
  return { ...state, history: updatedHistory };
}

// ─────────────────────────────────────────────────────────────
// § 13 — Theme rotation: 70% brand / 30% showcase
// If last 3 consecutively were brand → force showcase
// ─────────────────────────────────────────────────────────────

export interface ThemeRotationState {
  recentSources: ThemeRotationSource[]; // last N theme source selections (max 3)
}

/**
 * Selects a theme source (brand or showcase) following the 70/30 ratio.
 * Forces showcase if last 3 selections were all brand.
 */
export function selectThemeSource(state: ThemeRotationState): ThemeRotationSource {
  const last3 = state.recentSources.slice(-3);
  const forcedShowcase = last3.length === 3 && last3.every((s) => s === 'brand');

  if (forcedShowcase) {
    return 'showcase';
  }

  return Math.random() < 0.7 ? 'brand' : 'showcase';
}

/**
 * Records a theme source selection and trims to last 10 entries.
 */
export function recordThemeSource(
  state: ThemeRotationState,
  source: ThemeRotationSource,
): ThemeRotationState {
  const updated = [...state.recentSources, source].slice(-10);
  return { recentSources: updated };
}

/**
 * Picks a random theme name from the chosen source pool.
 */
export function selectThemeName(source: ThemeRotationSource): BrandTheme | ShowcaseTheme {
  if (source === 'brand') {
    return BRAND_THEMES[Math.floor(Math.random() * BRAND_THEMES.length)];
  }
  return SHOWCASE_THEMES[Math.floor(Math.random() * SHOWCASE_THEMES.length)];
}

/**
 * Full theme selection: determines source, picks theme, records state.
 * Returns the selected theme name and the updated state.
 */
export function rotateTheme(state: ThemeRotationState): {
  theme: BrandTheme | ShowcaseTheme;
  source: ThemeRotationSource;
  updatedState: ThemeRotationState;
} {
  const source = selectThemeSource(state);
  const theme = selectThemeName(source);
  const updatedState = recordThemeSource(state, source);
  return { theme, source, updatedState };
}
