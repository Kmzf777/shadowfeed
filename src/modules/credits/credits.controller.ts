import { Router, raw } from 'express';
import {
  getBalance,
  getSubscription,
  getTransactionHistory,
  getUsageStats,
  cancelSubscriptionDb,
} from './credits.service.js';
import {
  createSubscription,
  cancelSubscription as stripeCancelSubscription,
  createExtraTokensCheckout,
  handleWebhookEvent,
  verifyAndActivateSession,
} from './stripe.service.js';
import {
  THEME_TOKEN_COSTS,
  PRODUCT_MODE_EXTRA_TOKENS,
  SUBSCRIPTION_PLANS,
  EXTRA_TOKEN_PRICE_USD,
  EXTRA_TOKEN_MIN_USD,
  EXTRA_TOKEN_MIN_BRL,
} from '../../shared/utils/token-estimator.js';
import type { SubscriptionPlanId, BillingCycle } from '../../shared/utils/token-estimator.js';
import { BILLING_CYCLES } from '../../shared/utils/token-estimator.js';

const creditsController = Router();

// ============================================================================
// Balance & Pricing
// ============================================================================

/**
 * GET /credits/balance — Get user's token balance (plan + extra)
 */
creditsController.get('/balance', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const balance = await getBalance(userId);
    const subscription = await getSubscription(userId);

    return res.json({
      ...balance,
      subscription: subscription ? {
        planId: subscription.planId,
        planName: subscription.planName,
        tokensAllocated: subscription.tokensAllocated,
        tokensUsed: subscription.tokensUsed,
        tokensRemaining: subscription.tokensAllocated - subscription.tokensUsed,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        status: subscription.status,
      } : null,
    });
  } catch (error: any) {
    console.error('[CREDITS] Error fetching balance:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch balance' });
  }
});

/**
 * GET /credits/pricing — Get theme token costs
 */
creditsController.get('/pricing', (_req, res) => {
  return res.json({
    themeCosts: THEME_TOKEN_COSTS,
    productModeExtraCost: PRODUCT_MODE_EXTRA_TOKENS,
    extraTokenPriceUsd: EXTRA_TOKEN_PRICE_USD,
    extraTokenMinUsd: EXTRA_TOKEN_MIN_USD,
    extraTokenMinBrl: EXTRA_TOKEN_MIN_BRL,
  });
});

/**
 * GET /credits/plans — Get available subscription plans
 */
creditsController.get('/plans', (_req, res) => {
  return res.json(SUBSCRIPTION_PLANS);
});

// ============================================================================
// Subscription Management
// ============================================================================

/**
 * GET /credits/subscription — Get user's active subscription
 */
creditsController.get('/subscription', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const subscription = await getSubscription(userId);
    return res.json(subscription);
  } catch (error: any) {
    console.error('[CREDITS] Error fetching subscription:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch subscription' });
  }
});

/**
 * POST /credits/subscribe — Create Stripe subscription
 */
creditsController.post('/subscribe', async (req, res) => {
  try {
    const { userId, planId, currency, cycle } = req.body as {
      userId: string;
      planId: SubscriptionPlanId;
      currency?: 'usd' | 'brl';
      cycle?: BillingCycle;
    };

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    if (!planId) {
      return res.status(400).json({ error: 'planId is required' });
    }

    const validIds = SUBSCRIPTION_PLANS.map((p) => p.id);
    if (!validIds.includes(planId)) {
      return res.status(400).json({ error: `Invalid planId. Valid: ${validIds.join(', ')}` });
    }

    const validCycles = Object.keys(BILLING_CYCLES);
    const billingCycle = cycle && validCycles.includes(cycle) ? cycle : 'monthly';

    const session = await createSubscription(userId, planId, currency || 'usd', billingCycle);
    return res.json(session);
  } catch (error: any) {
    console.error('[CREDITS] Error creating subscription:', error);
    return res.status(500).json({ error: error.message || 'Failed to create subscription' });
  }
});

/**
 * POST /credits/cancel-subscription — Cancel subscription at period end
 */
creditsController.post('/cancel-subscription', async (req, res) => {
  try {
    const { userId } = req.body as { userId: string };
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Cancel in Stripe
    await stripeCancelSubscription(userId);
    // Mark in database
    await cancelSubscriptionDb(userId);

    return res.json({ success: true, message: 'Subscription will be canceled at end of billing period' });
  } catch (error: any) {
    console.error('[CREDITS] Error canceling subscription:', error);
    return res.status(500).json({ error: error.message || 'Failed to cancel subscription' });
  }
});

// ============================================================================
// Extra Token Purchases
// ============================================================================

/**
 * POST /credits/buy-extra — Buy extra tokens (custom amount)
 */
creditsController.post('/buy-extra', async (req, res) => {
  try {
    const { userId, amountUsd, currency } = req.body as {
      userId: string;
      amountUsd: number;
      currency?: 'usd' | 'brl';
    };

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    if (!amountUsd || amountUsd < EXTRA_TOKEN_MIN_USD) {
      return res.status(400).json({ error: `Minimum purchase is $${EXTRA_TOKEN_MIN_USD.toFixed(2)} USD` });
    }

    const session = await createExtraTokensCheckout(userId, amountUsd, currency || 'usd');
    return res.json(session);
  } catch (error: any) {
    console.error('[CREDITS] Error creating extra token checkout:', error);
    return res.status(500).json({ error: error.message || 'Failed to create checkout' });
  }
});

// ============================================================================
// Usage Stats
// ============================================================================

/**
 * GET /credits/usage-stats — Get usage statistics for charts
 */
creditsController.get('/usage-stats', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const range = (req.query.range as string) || '30d';

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const validRanges = ['24h', '7d', '30d', 'all'];
    if (!validRanges.includes(range)) {
      return res.status(400).json({ error: `Invalid range. Valid: ${validRanges.join(', ')}` });
    }

    const stats = await getUsageStats(userId, range as '24h' | '7d' | '30d' | 'all');
    return res.json(stats);
  } catch (error: any) {
    console.error('[CREDITS] Error fetching usage stats:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch usage stats' });
  }
});

// ============================================================================
// Transaction History
// ============================================================================

/**
 * GET /credits/transactions — Get transaction history
 */
creditsController.get('/transactions', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const transactions = await getTransactionHistory(userId, limit, offset);
    return res.json(transactions);
  } catch (error: any) {
    console.error('[CREDITS] Error fetching transactions:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch transactions' });
  }
});

// ============================================================================
// Session Verification
// ============================================================================

/**
 * GET /credits/verify-session — Verify Stripe session and activate plan
 * Called by frontend after redirect to ?purchase=success&session_id=xxx
 */
creditsController.get('/verify-session', async (req, res) => {
  try {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    console.log('[VERIFY-SESSION] Verifying session:', sessionId);
    const result = await verifyAndActivateSession(sessionId);
    console.log('[VERIFY-SESSION] Result:', result);

    return res.json(result);
  } catch (error: any) {
    console.error('[VERIFY-SESSION] Error:', error.message || error);
    return res.status(500).json({ error: error.message || 'Failed to verify session' });
  }
});

// ============================================================================
// Stripe Webhook
// ============================================================================

/**
 * POST /credits/webhook — Stripe Webhook handler
 * Must receive raw body (not JSON-parsed)
 */
creditsController.post('/webhook', raw({ type: 'application/json' }), async (req, res) => {
  try {
    console.log('[WEBHOOK] Incoming webhook request');
    console.log('[WEBHOOK] Body type:', typeof req.body, Buffer.isBuffer(req.body) ? '(Buffer)' : '(NOT Buffer)');
    console.log('[WEBHOOK] Body length:', req.body?.length ?? 'N/A');

    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      console.error('[WEBHOOK] Missing stripe-signature header');
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }
    console.log('[WEBHOOK] Signature present, verifying...');

    await handleWebhookEvent(req.body, signature);
    console.log('[WEBHOOK] Event processed successfully');
    return res.json({ received: true });
  } catch (error: any) {
    console.error('[WEBHOOK] Webhook error:', error.message || error);
    return res.status(400).json({ error: error.message || 'Webhook processing failed' });
  }
});

export default creditsController;
