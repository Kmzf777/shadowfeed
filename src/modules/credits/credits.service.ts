import { supabase } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import { calculateTokensRequired, FREE_TOKENS_INITIAL, FREE_TOKENS_DRIP_AMOUNT, FREE_TOKENS_DRIP_INTERVAL_DAYS, FREE_TOKENS_MAX_BALANCE } from '../../shared/utils/token-estimator.js';

// ============================================================================
// Interfaces
// ============================================================================

export interface CreditBalance {
  balance: number;
  totalPurchased: number;
  totalSpent: number;
  extraTokens: number;
  freeTokens: number;
}

export interface CreditTransaction {
  id: string;
  type: 'purchase' | 'spend' | 'refund' | 'bonus';
  amount: number;
  balanceAfter: number;
  postId: string | null;
  packageId: string | null;
  description: string | null;
  tokenSource: string | null;
  createdAt: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  tokensAllocated: number;
  tokensUsed: number;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsageStats {
  daily: Array<{ date: string; tokens: number }>;
  totalUsed: number;
  averageDaily: number;
  projectedMonthly: number;
}

// ============================================================================
// Balance & Credits (Extra Tokens)
// ============================================================================

/**
 * Get or create credit balance for a user (extra tokens)
 */
export async function getBalance(userId: string): Promise<CreditBalance> {
  const { data, error } = await supabase
    .from('sf_user_credits')
    .select('balance, total_purchased, total_spent, extra_tokens, free_tokens')
    .eq('user_id', userId)
    .single();

  if (error?.code === 'PGRST116') {
    const { data: newRow, error: insertError } = await supabase
      .from('sf_user_credits')
      .insert({ user_id: userId, balance: 0, total_purchased: 0, total_spent: 0, extra_tokens: 0, free_tokens: FREE_TOKENS_INITIAL })
      .select('balance, total_purchased, total_spent, extra_tokens, free_tokens')
      .single();

    if (insertError) {
      logger.error({ error: insertError, userId }, '[CREDITS] Failed to create credit row');
      throw new Error('Failed to initialize credits');
    }

    return {
      balance: newRow.balance,
      totalPurchased: newRow.total_purchased,
      totalSpent: newRow.total_spent,
      extraTokens: newRow.extra_tokens ?? 0,
      freeTokens: newRow.free_tokens ?? FREE_TOKENS_INITIAL,
    };
  }

  if (error) {
    logger.error({ error, userId }, '[CREDITS] Failed to fetch balance');
    throw new Error('Failed to fetch credit balance');
  }

  return {
    balance: data.balance,
    totalPurchased: data.total_purchased,
    totalSpent: data.total_spent,
    extraTokens: data.extra_tokens ?? 0,
    freeTokens: data.free_tokens ?? 0,
  };
}

// ============================================================================
// Subscription Management
// ============================================================================

/**
 * Get user's active subscription
 */
export async function getSubscription(userId: string): Promise<UserSubscription | null> {
  const { data, error } = await supabase
    .from('sf_user_subscriptions')
    .select(`
      id, user_id, plan_id, stripe_subscription_id, stripe_customer_id,
      status, current_period_start, current_period_end,
      tokens_allocated, tokens_used, cancel_at_period_end,
      created_at, updated_at,
      sf_subscription_plans(name)
    `)
    .eq('user_id', userId)
    .in('status', ['active', 'past_due'])
    .single();

  if (error?.code === 'PGRST116' || !data) {
    return null;
  }

  if (error) {
    logger.error({ error, userId }, '[CREDITS] Failed to fetch subscription');
    throw new Error('Failed to fetch subscription');
  }

  const planName = (data as any).sf_subscription_plans?.name ?? data.plan_id;

  return {
    id: data.id,
    userId: data.user_id,
    planId: data.plan_id,
    planName,
    stripeSubscriptionId: data.stripe_subscription_id,
    stripeCustomerId: data.stripe_customer_id,
    status: data.status,
    currentPeriodStart: data.current_period_start,
    currentPeriodEnd: data.current_period_end,
    tokensAllocated: data.tokens_allocated,
    tokensUsed: data.tokens_used,
    cancelAtPeriodEnd: data.cancel_at_period_end,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Create or update a user subscription (called after Stripe subscription created)
 */
export async function upsertSubscription(
  userId: string,
  planId: string,
  tokensAllocated: number,
  periodStart: string,
  periodEnd: string,
  stripeSubscriptionId?: string,
  stripeCustomerId?: string
): Promise<void> {
  const { error } = await supabase
    .from('sf_user_subscriptions')
    .upsert({
      user_id: userId,
      plan_id: planId,
      tokens_allocated: tokensAllocated,
      tokens_used: 0,
      status: 'active',
      current_period_start: periodStart,
      current_period_end: periodEnd,
      stripe_subscription_id: stripeSubscriptionId || null,
      stripe_customer_id: stripeCustomerId || null,
      cancel_at_period_end: false,
    }, { onConflict: 'user_id' });

  if (error) {
    logger.error({ error, userId, planId }, '[CREDITS] Failed to upsert subscription');
    throw new Error('Failed to create/update subscription');
  }

  logger.info({ userId, planId, tokensAllocated }, '[CREDITS] Subscription upserted');
}

/**
 * Reset monthly tokens on subscription renewal
 */
export async function resetMonthlyTokens(
  stripeSubscriptionId: string,
  periodStart: string,
  periodEnd: string
): Promise<void> {
  // Find subscription by Stripe ID
  const { data: sub, error: fetchError } = await supabase
    .from('sf_user_subscriptions')
    .select('id, user_id, plan_id, tokens_allocated')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .single();

  if (fetchError || !sub) {
    logger.error({ stripeSubscriptionId }, '[CREDITS] Subscription not found for renewal');
    return;
  }

  // Get plan info for fresh token allocation
  const { data: plan } = await supabase
    .from('sf_subscription_plans')
    .select('tokens_per_month')
    .eq('id', sub.plan_id)
    .single();

  const tokensAllocated = plan?.tokens_per_month ?? sub.tokens_allocated;

  const { error } = await supabase
    .from('sf_user_subscriptions')
    .update({
      tokens_used: 0,
      tokens_allocated: tokensAllocated,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      status: 'active',
    })
    .eq('id', sub.id);

  if (error) {
    logger.error({ error, subscriptionId: sub.id }, '[CREDITS] Failed to reset monthly tokens');
    throw new Error('Failed to reset monthly tokens');
  }

  logger.info({ userId: sub.user_id, tokensAllocated }, '[CREDITS] Monthly tokens reset');
}

/**
 * Cancel subscription (marks cancel_at_period_end)
 */
export async function cancelSubscriptionDb(userId: string): Promise<void> {
  const { error } = await supabase
    .from('sf_user_subscriptions')
    .update({ cancel_at_period_end: true })
    .eq('user_id', userId)
    .eq('status', 'active');

  if (error) {
    logger.error({ error, userId }, '[CREDITS] Failed to mark subscription for cancellation');
    throw new Error('Failed to cancel subscription');
  }

  logger.info({ userId }, '[CREDITS] Subscription marked for cancellation');
}

/**
 * Deactivate subscription (called by webhook when subscription actually ends)
 */
export async function deactivateSubscription(stripeSubscriptionId: string): Promise<void> {
  const { error } = await supabase
    .from('sf_user_subscriptions')
    .update({ status: 'canceled' })
    .eq('stripe_subscription_id', stripeSubscriptionId);

  if (error) {
    logger.error({ error, stripeSubscriptionId }, '[CREDITS] Failed to deactivate subscription');
  }

  logger.info({ stripeSubscriptionId }, '[CREDITS] Subscription deactivated');
}

// ============================================================================
// Token Consumption
// ============================================================================

/**
 * Check if user has enough tokens (plan + extra) for a generation
 */
export async function hasEnoughTokens(
  userId: string,
  themeId: string,
  productMode: boolean
): Promise<{ enough: boolean; required: number; planRemaining: number; freeTokens: number; extraTokens: number }> {
  const required = calculateTokensRequired(themeId, productMode);

  const sub = await getSubscription(userId);
  const planRemaining = sub ? Math.max(0, sub.tokensAllocated - sub.tokensUsed) : 0;

  const { extraTokens, freeTokens } = await getBalance(userId);
  const totalAvailable = planRemaining + freeTokens + extraTokens;

  return {
    enough: totalAvailable >= required,
    required,
    planRemaining,
    freeTokens,
    extraTokens,
  };
}

/**
 * Deduct tokens after successful generation.
 * Consumes from plan first, then extras.
 */
export async function deductTokens(
  userId: string,
  tokens: number,
  postId: string,
  description: string
): Promise<void> {
  let remaining = tokens;

  // 1. Deduct from plan tokens first
  const sub = await getSubscription(userId);
  let fromPlan = 0;
  let fromFree = 0;
  let fromExtra = 0;

  if (sub) {
    const planAvailable = Math.max(0, sub.tokensAllocated - sub.tokensUsed);
    fromPlan = Math.min(remaining, planAvailable);

    if (fromPlan > 0) {
      const { error } = await supabase
        .from('sf_user_subscriptions')
        .update({ tokens_used: sub.tokensUsed + fromPlan })
        .eq('id', sub.id);

      if (error) {
        logger.error({ error, userId }, '[CREDITS] Failed to deduct plan tokens');
        throw new Error('Failed to deduct plan tokens');
      }

      remaining -= fromPlan;
    }
  }

  // 2. Deduct from free tokens
  if (remaining > 0) {
    const { data: creditRow, error: fetchFreeError } = await supabase
      .from('sf_user_credits')
      .select('free_tokens')
      .eq('user_id', userId)
      .single();

    if (!fetchFreeError && creditRow) {
      const freeAvailable = creditRow.free_tokens ?? 0;
      fromFree = Math.min(remaining, freeAvailable);

      if (fromFree > 0) {
        const newFree = freeAvailable - fromFree;
        const { error: updateFreeError } = await supabase
          .from('sf_user_credits')
          .update({ free_tokens: newFree })
          .eq('user_id', userId);

        if (updateFreeError) {
          logger.error({ error: updateFreeError, userId }, '[CREDITS] Failed to deduct free tokens');
        } else {
          remaining -= fromFree;
        }
      }
    }
  }

  // 3. Deduct overflow from extra tokens
  if (remaining > 0) {
    fromExtra = remaining;

    const { data: current, error: fetchError } = await supabase
      .from('sf_user_credits')
      .select('extra_tokens, total_spent')
      .eq('user_id', userId)
      .single();

    if (fetchError || !current) {
      throw new Error('Failed to fetch extra tokens for deduction');
    }

    if ((current.extra_tokens ?? 0) < remaining) {
      throw new Error(`Insufficient tokens: needs ${remaining} extra tokens, has ${current.extra_tokens ?? 0}`);
    }

    const newExtra = (current.extra_tokens ?? 0) - remaining;
    const newTotalSpent = current.total_spent + remaining;

    const { error: updateError } = await supabase
      .from('sf_user_credits')
      .update({ extra_tokens: newExtra, total_spent: newTotalSpent })
      .eq('user_id', userId);

    if (updateError) {
      logger.error({ error: updateError, userId }, '[CREDITS] Failed to deduct extra tokens');
      throw new Error('Failed to deduct extra tokens');
    }
  }

  // 4. Log transaction(s)
  const transactions = [];
  if (fromPlan > 0) {
    transactions.push({
      user_id: userId,
      type: 'spend',
      amount: -fromPlan,
      balance_after: sub ? sub.tokensAllocated - sub.tokensUsed - fromPlan : 0,
      post_id: postId,
      description: `${description} (plan)`,
      token_source: 'plan',
    });
  }
  if (fromFree > 0) {
    transactions.push({
      user_id: userId,
      type: 'spend',
      amount: -fromFree,
      balance_after: 0,
      post_id: postId,
      description: `${description} (free)`,
      token_source: 'free',
    });
  }
  if (fromExtra > 0) {
    transactions.push({
      user_id: userId,
      type: 'spend',
      amount: -fromExtra,
      balance_after: 0,
      post_id: postId,
      description: `${description} (extra)`,
      token_source: 'extra',
    });
  }

  if (transactions.length > 0) {
    const { error: txError } = await supabase
      .from('sf_credit_transactions')
      .insert(transactions);

    if (txError) {
      logger.error({ error: txError, userId }, '[CREDITS] Failed to log spend transactions');
    }
  }

  logger.info({ userId, tokens, fromPlan, fromFree, fromExtra, postId }, '[CREDITS] Tokens deducted');
}

/**
 * Add extra tokens to a user (purchase)
 */
export async function addExtraTokens(
  userId: string,
  tokens: number,
  options: {
    stripeSessionId?: string;
    description?: string;
  } = {}
): Promise<number> {
  // Ensure credit row exists
  await getBalance(userId);

  const { data: current, error: fetchError } = await supabase
    .from('sf_user_credits')
    .select('extra_tokens, total_purchased')
    .eq('user_id', userId)
    .single();

  if (fetchError || !current) {
    throw new Error('Failed to fetch current balance for addition');
  }

  const newExtra = (current.extra_tokens ?? 0) + tokens;
  const newTotalPurchased = current.total_purchased + tokens;

  const { error: updateError } = await supabase
    .from('sf_user_credits')
    .update({ extra_tokens: newExtra, total_purchased: newTotalPurchased })
    .eq('user_id', userId);

  if (updateError) {
    logger.error({ error: updateError, userId }, '[CREDITS] Failed to add extra tokens');
    throw new Error('Failed to add extra tokens');
  }

  // Log transaction
  const { error: txError } = await supabase
    .from('sf_credit_transactions')
    .insert({
      user_id: userId,
      type: 'purchase',
      amount: tokens,
      balance_after: newExtra,
      stripe_session_id: options.stripeSessionId || null,
      description: options.description || `Extra tokens: +${tokens}`,
      token_source: 'extra',
    });

  if (txError) {
    logger.error({ error: txError, userId }, '[CREDITS] Failed to log extra token transaction');
  }

  logger.info({ userId, tokens, newExtra }, '[CREDITS] Extra tokens added');
  return newExtra;
}

// ============================================================================
// Usage Stats
// ============================================================================

/**
 * Get usage statistics for charts
 */
export async function getUsageStats(
  userId: string,
  range: '24h' | '7d' | '30d' | 'all'
): Promise<UsageStats> {
  let since: Date;
  const now = new Date();

  switch (range) {
    case '24h':
      since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
      since = new Date(0);
      break;
  }

  const { data, error } = await supabase
    .from('sf_credit_transactions')
    .select('amount, created_at')
    .eq('user_id', userId)
    .eq('type', 'spend')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    logger.error({ error, userId }, '[CREDITS] Failed to fetch usage stats');
    throw new Error('Failed to fetch usage stats');
  }

  // Aggregate by day
  const dailyMap = new Map<string, number>();
  let totalUsed = 0;

  for (const tx of data || []) {
    const day = tx.created_at.substring(0, 10); // YYYY-MM-DD
    const tokens = Math.abs(tx.amount);
    dailyMap.set(day, (dailyMap.get(day) || 0) + tokens);
    totalUsed += tokens;
  }

  const daily = Array.from(dailyMap.entries())
    .map(([date, tokens]) => ({ date, tokens }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const daysInRange = range === '24h' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : Math.max(daily.length, 1);
  const averageDaily = totalUsed / daysInRange;
  const projectedMonthly = averageDaily * 30;

  return { daily, totalUsed, averageDaily, projectedMonthly };
}

// ============================================================================
// Transaction History
// ============================================================================

/**
 * Get transaction history for a user
 */
export async function getTransactionHistory(
  userId: string,
  limit = 50,
  offset = 0
): Promise<CreditTransaction[]> {
  const { data, error } = await supabase
    .from('sf_credit_transactions')
    .select('id, type, amount, balance_after, post_id, package_id, description, token_source, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error({ error, userId }, '[CREDITS] Failed to fetch transactions');
    throw new Error('Failed to fetch transaction history');
  }

  return (data || []).map((tx: any) => ({
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    balanceAfter: tx.balance_after,
    postId: tx.post_id,
    packageId: tx.package_id,
    description: tx.description,
    tokenSource: tx.token_source,
    createdAt: tx.created_at,
  }));
}

// ============================================================================
// Free Token Drip
// ============================================================================

/**
 * Drip free tokens to eligible users.
 * Runs daily via cron. Adds FREE_TOKENS_DRIP_AMOUNT to users whose
 * last_free_drip is older than FREE_TOKENS_DRIP_INTERVAL_DAYS and
 * whose free_tokens are below FREE_TOKENS_MAX_BALANCE.
 */
export async function dripFreeTokens(): Promise<number> {
  const cutoff = new Date(Date.now() - FREE_TOKENS_DRIP_INTERVAL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: eligible, error: fetchError } = await supabase
    .from('sf_user_credits')
    .select('user_id, free_tokens, last_free_drip')
    .lt('last_free_drip', cutoff)
    .lt('free_tokens', FREE_TOKENS_MAX_BALANCE);

  if (fetchError || !eligible) {
    logger.error({ error: fetchError }, '[CREDITS] Failed to fetch eligible users for free token drip');
    return 0;
  }

  let dripped = 0;

  for (const row of eligible) {
    const currentFree = row.free_tokens ?? 0;
    const newFree = Math.min(currentFree + FREE_TOKENS_DRIP_AMOUNT, FREE_TOKENS_MAX_BALANCE);
    const actualDrip = newFree - currentFree;

    if (actualDrip <= 0) continue;

    const { error: updateError } = await supabase
      .from('sf_user_credits')
      .update({ free_tokens: newFree, last_free_drip: new Date().toISOString() })
      .eq('user_id', row.user_id);

    if (updateError) {
      logger.error({ error: updateError, userId: row.user_id }, '[CREDITS] Failed to drip free tokens');
      continue;
    }

    // Log the drip as a transaction
    await supabase.from('sf_credit_transactions').insert({
      user_id: row.user_id,
      type: 'bonus',
      amount: actualDrip,
      balance_after: newFree,
      description: `Free token drip: +${actualDrip}`,
      token_source: 'free',
    });

    dripped++;
  }

  logger.info({ eligible: eligible.length, dripped }, '[CREDITS] Free token drip completed');
  return dripped;
}

// ============================================================================
// Legacy compatibility
// ============================================================================

/** @deprecated Use hasEnoughTokens */
export async function hasEnoughCredits(
  userId: string,
  themeId: string,
  productMode: boolean
): Promise<{ enough: boolean; required: number; balance: number }> {
  const result = await hasEnoughTokens(userId, themeId, productMode);
  return {
    enough: result.enough,
    required: result.required,
    balance: result.planRemaining + result.extraTokens,
  };
}

/** @deprecated Use deductTokens */
export async function deductCredits(
  userId: string,
  credits: number,
  postId: string,
  description: string
): Promise<void> {
  return deductTokens(userId, credits, postId, description);
}

/** @deprecated Use addExtraTokens */
export async function addCredits(
  userId: string,
  credits: number,
  type: 'purchase' | 'refund' | 'bonus',
  options: {
    stripeSessionId?: string;
    packageId?: string;
    description?: string;
  } = {}
): Promise<number> {
  return addExtraTokens(userId, credits, {
    stripeSessionId: options.stripeSessionId,
    description: options.description,
  });
}
