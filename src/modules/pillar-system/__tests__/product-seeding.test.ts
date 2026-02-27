import { describe, it, expect } from 'vitest';
import { generateProductSeed, buildProductSeedPrompt } from '../product-seeding.js';
import type { PillarConfig } from '../../../shared/types/pillar.types.js';
import type { UserOffer } from '../../../shared/types/post-themes.types.js';

const makePillar = (intensity: PillarConfig['productSeedIntensity']): PillarConfig =>
  ({
    id: 'educate',
    productSeedIntensity: intensity,
  }) as PillarConfig;

const PRIMARY_OFFER: UserOffer = {
  name: 'AI Mastery Course',
  type: 'course',
  main_benefit: 'Master AI in 30 days',
  price_range: '$197-$497',
  purchase_method: 'direct_message',
  cta_keyword: 'AIMASTER',
  is_primary: true,
};

const SECONDARY_OFFER: UserOffer = {
  name: 'Starter Kit',
  type: 'ebook',
  main_benefit: 'Quick start guide',
  price_range: '$27',
  purchase_method: 'link_bio',
  cta_keyword: 'START',
  is_primary: false,
};

describe('generateProductSeed', () => {
  it('returns null when productMode is false', () => {
    expect(generateProductSeed(makePillar('full'), [PRIMARY_OFFER], false)).toBeNull();
  });

  it('returns null when offers is null', () => {
    expect(generateProductSeed(makePillar('full'), null, true)).toBeNull();
  });

  it('returns null when offers is empty', () => {
    expect(generateProductSeed(makePillar('full'), [], true)).toBeNull();
  });

  it('returns null for "none" intensity (PROVOKE/CONNECT pillars)', () => {
    expect(generateProductSeed(makePillar('none'), [PRIMARY_OFFER], true)).toBeNull();
  });

  it('returns whisper seed with caption placement (EDUCATE pillar)', () => {
    const seed = generateProductSeed(makePillar('whisper'), [PRIMARY_OFFER], true);
    expect(seed).not.toBeNull();
    expect(seed!.intensity).toBe('whisper');
    expect(seed!.placement).toBe('caption');
    expect(seed!.offerName).toBe('AI Mastery Course');
  });

  it('returns mention seed with slides placement (PROVE pillar)', () => {
    const seed = generateProductSeed(makePillar('mention'), [PRIMARY_OFFER], true);
    expect(seed).not.toBeNull();
    expect(seed!.intensity).toBe('mention');
    expect(seed!.placement).toBe('slides');
  });

  it('returns full seed with slides placement (CONVERT pillar)', () => {
    const seed = generateProductSeed(makePillar('full'), [PRIMARY_OFFER], true);
    expect(seed).not.toBeNull();
    expect(seed!.intensity).toBe('full');
    expect(seed!.placement).toBe('slides');
    expect(seed!.ctaKeyword).toBe('AIMASTER');
    expect(seed!.purchaseMethod).toBe('direct_message');
  });

  it('uses primary offer when multiple offers exist', () => {
    const seed = generateProductSeed(makePillar('full'), [SECONDARY_OFFER, PRIMARY_OFFER], true);
    expect(seed!.offerName).toBe('AI Mastery Course');
  });

  it('falls back to first offer when no primary is flagged', () => {
    const noPrimary = { ...SECONDARY_OFFER, is_primary: false };
    const seed = generateProductSeed(makePillar('full'), [noPrimary], true);
    expect(seed!.offerName).toBe('Starter Kit');
  });
});

describe('buildProductSeedPrompt', () => {
  it('generates whisper prompt with caption-only instruction', () => {
    const prompt = buildProductSeedPrompt({
      intensity: 'whisper',
      offerName: 'AI Course',
      mainBenefit: 'Learn AI fast',
      ctaKeyword: 'AI',
      purchaseMethod: 'link_bio',
      placement: 'caption',
    });
    expect(prompt).toContain('WHISPER');
    expect(prompt).toContain('caption ONLY');
    expect(prompt).toContain('AI Course');
    expect(prompt).not.toContain('CTA structure');
  });

  it('generates mention prompt with narrative weaving instruction', () => {
    const prompt = buildProductSeedPrompt({
      intensity: 'mention',
      offerName: 'Growth Kit',
      mainBenefit: 'Scale your business',
      ctaKeyword: 'GROW',
      purchaseMethod: 'whatsapp',
      placement: 'slides',
    });
    expect(prompt).toContain('MENTION');
    expect(prompt).toContain('1-2 content slides');
    expect(prompt).toContain('Growth Kit');
  });

  it('generates full prompt with problem-solution arc and DM CTA', () => {
    const prompt = buildProductSeedPrompt({
      intensity: 'full',
      offerName: 'AI Mastery',
      mainBenefit: 'Master AI in 30 days',
      ctaKeyword: 'AIMASTER',
      purchaseMethod: 'direct_message',
      placement: 'slides',
    });
    expect(prompt).toContain('FULL');
    expect(prompt).toContain('problem→solution');
    expect(prompt).toContain('AIMASTER');
    expect(prompt).toContain("I'll DM you");
  });

  it('generates full prompt with WhatsApp CTA', () => {
    const prompt = buildProductSeedPrompt({
      intensity: 'full',
      offerName: 'Kit',
      mainBenefit: 'Grow fast',
      ctaKeyword: 'KIT',
      purchaseMethod: 'whatsapp',
      placement: 'slides',
    });
    expect(prompt).toContain('WhatsApp');
  });

  it('generates full prompt with link_bio CTA', () => {
    const prompt = buildProductSeedPrompt({
      intensity: 'full',
      offerName: 'Kit',
      mainBenefit: 'Grow fast',
      ctaKeyword: 'KIT',
      purchaseMethod: 'link_bio',
      placement: 'slides',
    });
    expect(prompt).toContain('Link in bio');
  });

  it('returns empty string for none intensity', () => {
    const prompt = buildProductSeedPrompt({
      intensity: 'none' as any,
      offerName: 'X',
      mainBenefit: 'Y',
      ctaKeyword: 'Z',
      purchaseMethod: 'link_bio',
      placement: 'caption',
    });
    expect(prompt).toBe('');
  });
});
