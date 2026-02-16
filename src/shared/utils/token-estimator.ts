/** Estimates tokens roughly (~3.5 chars per token in PT-BR) */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}

/** GPT-4.1 Prices: $2.00/1M input, $8.00/1M output */
const GPT41_INPUT_COST_PER_1K = 0.002;
const GPT41_OUTPUT_COST_PER_1K = 0.008;

/** Plan markup: 120% (2.2x multiplier) */
export const PLAN_MARKUP = 2.2;

/** Extra token markup: 150% (2.5x multiplier) */
export const EXTRA_MARKUP = 2.5;

/** Calculates real USD cost for GPT-4.1 */
export function calculateRealCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1000) * GPT41_INPUT_COST_PER_1K + (outputTokens / 1000) * GPT41_OUTPUT_COST_PER_1K;
}

/** Calculates user price (real cost x markup) */
export function calculateUserPrice(inputTokens: number, outputTokens: number, markup = PLAN_MARKUP): number {
  return calculateRealCost(inputTokens, outputTokens) * markup;
}

// ============================================================================
// Token Cost System (replaces old credit-based pricing)
// ============================================================================

/** Token costs per theme */
export const THEME_TOKEN_COSTS: Record<string, number> = {
  minimalist: 40,
  twitter: 40,
  educational: 50,
  magazine: 65,
};

/** Extra tokens for product mode */
export const PRODUCT_MODE_EXTRA_TOKENS = 10;

/** Calculates tokens required for a generation */
export function calculateTokensRequired(themeId: string, productMode: boolean): number {
  const baseCost = THEME_TOKEN_COSTS[themeId] ?? 40;
  return productMode ? baseCost + PRODUCT_MODE_EXTRA_TOKENS : baseCost;
}

// ============================================================================
// Free Tokens System
// ============================================================================

/** Initial free tokens for new users (4 posts at most expensive theme) */
export const FREE_TOKENS_INITIAL = 300;

/** Tokens added per drip */
export const FREE_TOKENS_DRIP_AMOUNT = 50;

/** Days between drips */
export const FREE_TOKENS_DRIP_INTERVAL_DAYS = 4;

/** Max free token balance (cap to prevent hoarding) */
export const FREE_TOKENS_MAX_BALANCE = 300;

/** Price per extra token in USD */
export const EXTRA_TOKEN_PRICE_USD = 0.007;

/** Minimum extra token purchase amount in USD */
export const EXTRA_TOKEN_MIN_USD = 2.0;

/** Minimum extra token purchase amount in BRL */
export const EXTRA_TOKEN_MIN_BRL = 11.9;

// ============================================================================
// Subscription Plans
// ============================================================================

export const SUBSCRIPTION_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    tokensPerMonth: 1800,
    approximatePosts: 35,
    priceUsd: 9.99,
    priceBrl: 57.90,
  },
  {
    id: 'micro-operation',
    name: 'Micro-Operation',
    tokensPerMonth: 3600,
    approximatePosts: 70,
    priceUsd: 19.99,
    priceBrl: 115.90,
  },
  {
    id: 'booster-mode',
    name: 'Booster Mode',
    tokensPerMonth: 7200,
    approximatePosts: 140,
    priceUsd: 39.99,
    priceBrl: 231.90,
  },
] as const;

export type SubscriptionPlanId = typeof SUBSCRIPTION_PLANS[number]['id'];

// ============================================================================
// Billing Cycles
// ============================================================================

export type BillingCycle = 'monthly' | 'quarterly' | 'annual';

export const BILLING_CYCLES = {
  monthly: {
    id: 'monthly' as BillingCycle,
    label: 'Monthly',
    months: 1,
    discount: 0,          // full price
    stripeInterval: 'month' as const,
    stripeIntervalCount: 1,
  },
  quarterly: {
    id: 'quarterly' as BillingCycle,
    label: 'Quarterly',
    months: 3,
    discount: 0.10,       // 10% off
    stripeInterval: 'month' as const,
    stripeIntervalCount: 3,
  },
  annual: {
    id: 'annual' as BillingCycle,
    label: 'Annual',
    months: 12,
    discount: 0.20,       // 20% off
    stripeInterval: 'year' as const,
    stripeIntervalCount: 1,
  },
} as const;

/**
 * Calculate plan price for a given billing cycle.
 * Returns { perMonth, total } in the requested currency.
 */
export function calculateCyclePrice(
  plan: typeof SUBSCRIPTION_PLANS[number],
  cycle: BillingCycle,
  currency: 'usd' | 'brl' = 'usd'
): { perMonth: number; total: number; savings: number } {
  const cycleInfo = BILLING_CYCLES[cycle];
  const baseMonthly = currency === 'brl' ? plan.priceBrl : plan.priceUsd;
  const discountedMonthly = baseMonthly * (1 - cycleInfo.discount);
  const total = discountedMonthly * cycleInfo.months;
  const savings = baseMonthly * cycleInfo.months - total;

  return {
    perMonth: Math.round(discountedMonthly * 100) / 100,
    total: Math.round(total * 100) / 100,
    savings: Math.round(savings * 100) / 100,
  };
}

// ============================================================================
// Backwards compatibility (deprecated)
// ============================================================================

/** @deprecated Use THEME_TOKEN_COSTS instead */
export const THEME_CREDIT_COSTS = THEME_TOKEN_COSTS;

/** @deprecated Use PRODUCT_MODE_EXTRA_TOKENS instead */
export const PRODUCT_MODE_EXTRA_CREDITS = PRODUCT_MODE_EXTRA_TOKENS;

/** @deprecated Use calculateTokensRequired instead */
export function calculateCreditsRequired(themeId: string, productMode: boolean): number {
  return calculateTokensRequired(themeId, productMode);
}

/** @deprecated Use calculateRealCost instead */
export function estimateCost(inputTokens: number, outputTokens: number): number {
  return calculateRealCost(inputTokens, outputTokens);
}
