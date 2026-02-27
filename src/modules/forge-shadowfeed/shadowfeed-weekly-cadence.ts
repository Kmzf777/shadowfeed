import type { PillarId, FunnelTier, HookArchetype } from './forge-shadowfeed.types.js';

// ── Weekly Cadence Entry ────────────────────────────────────────────────────

export interface CadenceEntry {
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  dayName: string;
  pillarId: PillarId;
  funnelTier: FunnelTier;
  preferredHookArchetypes: HookArchetype[];
  isLightContent: boolean; // Sunday = true
}

// ── Day-of-Week → Pillar Mapping (PRD §5 FR-CAD-02 through FR-CAD-05) ──────

const WEEKLY_CADENCE: CadenceEntry[] = [
  {
    dayOfWeek: 0,
    dayName: 'Sunday',
    pillarId: 'educational-value',
    funnelTier: 'top',
    preferredHookArchetypes: ['curiosity-mystery', 'specific-number'],
    isLightContent: true, // 4-6 slides
  },
  {
    dayOfWeek: 1,
    dayName: 'Monday',
    pillarId: 'educational-value',
    funnelTier: 'top',
    preferredHookArchetypes: ['specific-number', 'direct-controversy'],
    isLightContent: false,
  },
  {
    dayOfWeek: 2,
    dayName: 'Tuesday',
    pillarId: 'educational-value',
    funnelTier: 'top',
    preferredHookArchetypes: ['specific-number', 'transformative-promise'],
    isLightContent: false,
  },
  {
    dayOfWeek: 3,
    dayName: 'Wednesday',
    pillarId: 'wake-up-slap',
    funnelTier: 'top',
    preferredHookArchetypes: ['polarization', 'direct-controversy'],
    isLightContent: false,
  },
  {
    dayOfWeek: 4,
    dayName: 'Thursday',
    pillarId: 'brand-breakdown',
    funnelTier: 'top',
    preferredHookArchetypes: ['brand-comparison', 'curiosity-mystery'],
    isLightContent: false,
  },
  {
    dayOfWeek: 5,
    dayName: 'Friday',
    pillarId: 'proof-social',
    funnelTier: 'middle',
    preferredHookArchetypes: ['transformative-promise', 'specific-number'],
    isLightContent: false,
  },
  {
    dayOfWeek: 6,
    dayName: 'Saturday',
    pillarId: 'the-offer',
    funnelTier: 'bottom',
    preferredHookArchetypes: ['direct-controversy', 'transformative-promise'],
    isLightContent: false,
  },
];

// ── Public API ──────────────────────────────────────────────────────────────

export function getTodayCadence(): CadenceEntry {
  const dayOfWeek = new Date().getDay(); // 0=Sunday
  return WEEKLY_CADENCE[dayOfWeek];
}

export function getWeeklyCadence(): CadenceEntry[] {
  return [...WEEKLY_CADENCE];
}

export function getCadenceForDate(date: Date): CadenceEntry {
  const dayOfWeek = date.getDay();
  return WEEKLY_CADENCE[dayOfWeek];
}

// ── Light content slide range override ──────────────────────────────────────

export const LIGHT_CONTENT_SLIDES = { min: 4, max: 6 };

// ── Week start helper (Monday of current week) ─────────────────────────────

export function getWeekStart(date?: Date): string {
  const d = new Date(date ?? new Date());
  const day = d.getDay();
  // Shift to Monday-based week: Sunday(0) → -6, Monday(1) → 0, etc.
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}
