import type { PillarConfig } from '../../shared/types/pillar.types.js';
import type { UserOffer } from '../../shared/types/post-themes.types.js';

export interface ProductSeed {
  intensity: 'none' | 'whisper' | 'mention' | 'full';
  offerName: string;
  mainBenefit: string;
  ctaKeyword: string;
  purchaseMethod: string;
  placement: 'caption' | 'slides';
}

/**
 * Generate a ProductSeed based on pillar intensity and user offers.
 * Returns null when seeding should be skipped entirely.
 */
export function generateProductSeed(
  pillar: PillarConfig,
  offers: UserOffer[] | null,
  productMode: boolean,
): ProductSeed | null {
  if (!productMode || !offers || offers.length === 0) {
    return null;
  }

  const intensity = pillar.productSeedIntensity;
  if (intensity === 'none') {
    return null;
  }

  const primaryOffer = offers.find((o) => o.is_primary) ?? offers[0];

  return {
    intensity,
    offerName: primaryOffer.name,
    mainBenefit: primaryOffer.main_benefit,
    ctaKeyword: primaryOffer.cta_keyword,
    purchaseMethod: primaryOffer.purchase_method,
    placement: intensity === 'whisper' ? 'caption' : 'slides',
  };
}

/**
 * Build the prompt text block for a given ProductSeed.
 * Returns null for 'none' intensity (should never be called with none, but safe).
 */
export function buildProductSeedPrompt(seed: ProductSeed): string {
  switch (seed.intensity) {
    case 'whisper':
      return (
        `Product seeding: WHISPER (caption only)\n` +
        `In the caption ONLY, include one subtle reference to "${seed.offerName}": ${seed.mainBenefit}.\n` +
        `Do NOT mention the product in any slide. Keep it natural — a passing nod, not a pitch.\n`
      );

    case 'mention':
      return (
        `Product seeding: MENTION (woven into narrative)\n` +
        `In 1-2 content slides, naturally weave in how "${seed.offerName}" addresses this problem.\n` +
        `Main benefit to reference: ${seed.mainBenefit}\n` +
        `Keep the mention organic — it should feel like part of the story, not an ad.\n` +
        `The product should NOT dominate any slide.\n`
      );

    case 'full':
      return (
        `Product seeding: FULL (problem→solution arc)\n` +
        `Structure the entire post as a problem→solution narrative leading to "${seed.offerName}".\n` +
        `Main benefit: ${seed.mainBenefit}\n` +
        `CTA keyword: "${seed.ctaKeyword}" (MUST be in **bold**)\n` +
        buildPurchaseMethodInstruction(seed.purchaseMethod, seed.mainBenefit, seed.ctaKeyword) +
        `The product is the hero — every slide should build toward it.\n`
      );

    default:
      return '';
  }
}

function buildPurchaseMethodInstruction(method: string, benefit: string, keyword: string): string {
  switch (method) {
    case 'direct_message':
      return `CTA structure: "Want ${benefit}? Comment **${keyword.toUpperCase()}** and I'll DM you!"\n`;
    case 'whatsapp':
      return `CTA structure: "Want ${benefit}? Click the link in bio and message on WhatsApp!"\n`;
    case 'link_bio':
      return `CTA structure: "Want ${benefit}? Link in bio 🔗"\n`;
    default:
      return `CTA structure: "Want ${benefit}? Comment **${keyword.toUpperCase()}** below!"\n`;
  }
}
