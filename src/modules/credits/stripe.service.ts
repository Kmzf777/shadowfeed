import Stripe from 'stripe';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import {
  addExtraTokens,
  upsertSubscription,
  resetMonthlyTokens,
  deactivateSubscription,
  getSubscription,
} from './credits.service.js';
import {
  SUBSCRIPTION_PLANS,
  EXTRA_TOKEN_PRICE_USD,
  BILLING_CYCLES,
  calculateCyclePrice,
  type SubscriptionPlanId,
  type BillingCycle,
} from '../../shared/utils/token-estimator.js';

let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripe = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

/**
 * Get a subscription plan by ID
 */
function getPlan(planId: string) {
  return SUBSCRIPTION_PLANS.find((p) => p.id === planId);
}

// ============================================================================
// Subscription Billing
// ============================================================================

/**
 * Create a Stripe Checkout Session for a recurring subscription
 */
export async function createSubscription(
  userId: string,
  planId: SubscriptionPlanId,
  currency: 'usd' | 'brl' = 'usd',
  cycle: BillingCycle = 'monthly'
): Promise<{ sessionId: string; url: string }> {
  const plan = getPlan(planId);
  if (!plan) {
    throw new Error(`Invalid plan: ${planId}`);
  }

  const stripeClient = getStripe();
  const cycleInfo = BILLING_CYCLES[cycle];
  const pricing = calculateCyclePrice(plan, cycle, currency);

  // For Stripe: charge the total cycle amount per billing period
  const unitAmount = Math.round(pricing.total * 100);

  const cycleLabel = cycle === 'monthly' ? '' : cycle === 'quarterly' ? ' (Quarterly)' : ' (Annual)';
  const intervalLabel = cycle === 'monthly' ? '1 month' : cycle === 'quarterly' ? '3 months' : '1 year';

  const session = await stripeClient.checkout.sessions.create({
    mode: 'subscription',
    ui_mode: 'embedded',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: `ShadowFeed ${plan.name}${cycleLabel}`,
            description: `${plan.tokensPerMonth.toLocaleString()} tokens/month (~${plan.approximatePosts} posts) — billed every ${intervalLabel}`,
          },
          unit_amount: unitAmount,
          recurring: {
            interval: cycleInfo.stripeInterval,
            interval_count: cycleInfo.stripeIntervalCount,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      planId: plan.id,
      tokensPerMonth: String(plan.tokensPerMonth),
      billingCycle: cycle,
      type: 'subscription',
    },
    return_url: `${env.STRIPE_SUCCESS_URL}&session_id={CHECKOUT_SESSION_ID}`,
  });

  logger.info({ userId, planId, cycle, sessionId: session.id }, '[STRIPE] Subscription checkout created');

  return {
    sessionId: session.id,
    clientSecret: session.client_secret!,
    url: '', // Deprecated but kept for type compat if needed temporarily
  };
}

/**
 * Cancel a Stripe subscription at period end
 */
export async function cancelSubscription(userId: string): Promise<void> {
  const sub = await getSubscription(userId);
  if (!sub?.stripeSubscriptionId) {
    logger.warn({ userId }, '[STRIPE] No Stripe subscription to cancel');
    return;
  }

  const stripeClient = getStripe();
  await stripeClient.subscriptions.update(sub.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  logger.info({ userId, stripeSubscriptionId: sub.stripeSubscriptionId }, '[STRIPE] Subscription set to cancel at period end');
}

// ============================================================================
// Extra Token Purchases
// ============================================================================

/**
 * Create a Stripe Checkout Session for one-time extra token purchase
 */
export async function createExtraTokensCheckout(
  userId: string,
  amountUsd: number,
  currency: 'usd' | 'brl' = 'usd'
): Promise<{ sessionId: string; url: string; tokensToReceive: number }> {
  const stripeClient = getStripe();

  const tokensToReceive = Math.floor(amountUsd / EXTRA_TOKEN_PRICE_USD);
  const priceInCents = Math.round(amountUsd * 100);

  // If BRL, convert approximately (user sends USD amount, we convert for display)
  const displayCurrency = currency;
  const displayAmount = currency === 'brl' ? Math.round(amountUsd * 5.80 * 100) : priceInCents;

  const session = await stripeClient.checkout.sessions.create({
    mode: 'payment',
    ui_mode: 'embedded',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: displayCurrency,
          product_data: {
            name: `ShadowFeed Extra Tokens`,
            description: `${tokensToReceive.toLocaleString()} extra tokens for post generation`,
          },
          unit_amount: displayAmount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      tokens: String(tokensToReceive),
      amountUsd: String(amountUsd),
      type: 'extra_tokens',
    },
    return_url: `${env.STRIPE_SUCCESS_URL}&session_id={CHECKOUT_SESSION_ID}`,
  });

  logger.info({ userId, amountUsd, tokensToReceive, sessionId: session.id }, '[STRIPE] Extra tokens checkout created');

  return {
    sessionId: session.id,
    clientSecret: session.client_secret!,
    url: '',
    tokensToReceive,
  };
}

// ============================================================================
// Webhook Handler
// ============================================================================

/**
 * Handle Stripe webhook events
 */
export async function handleWebhookEvent(
  rawBody: Buffer,
  signature: string
): Promise<void> {
  const stripeClient = getStripe();

  let event: Stripe.Event;
  try {
    event = stripeClient.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error({ error: err }, '[STRIPE] Webhook signature verification failed');
    throw new Error('Invalid webhook signature');
  }

  switch (event.type) {
    // ── Checkout completed (subscription or one-time) ──
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status !== 'paid') {
        logger.warn({ sessionId: session.id }, '[STRIPE] Session completed but not paid');
        return;
      }

      const userId = session.metadata?.userId;
      const eventType = session.metadata?.type;

      if (!userId) {
        logger.error({ metadata: session.metadata }, '[STRIPE] Missing userId in session metadata');
        return;
      }

      if (eventType === 'subscription') {
        // Subscription created
        const planId = session.metadata?.planId;
        const tokensPerMonth = parseInt(session.metadata?.tokensPerMonth || '0', 10);
        const stripeSubscriptionId = session.subscription as string;

        if (!planId || !tokensPerMonth) {
          logger.error({ metadata: session.metadata }, '[STRIPE] Missing plan data in subscription session');
          return;
        }

        // Get subscription details from Stripe for period info
        const stripeSub = await stripeClient.subscriptions.retrieve(stripeSubscriptionId) as any;
        const periodStart = new Date(stripeSub.current_period_start * 1000).toISOString();
        const periodEnd = new Date(stripeSub.current_period_end * 1000).toISOString();

        await upsertSubscription(
          userId,
          planId,
          tokensPerMonth,
          periodStart,
          periodEnd,
          stripeSubscriptionId,
          stripeSub.customer as string
        );

        logger.info({ userId, planId, stripeSubscriptionId }, '[STRIPE] Subscription activated');
      } else if (eventType === 'extra_tokens') {
        // Extra token purchase
        const tokens = parseInt(session.metadata?.tokens || '0', 10);

        if (!tokens) {
          logger.error({ metadata: session.metadata }, '[STRIPE] Missing tokens in extra purchase session');
          return;
        }

        await addExtraTokens(userId, tokens, {
          stripeSessionId: session.id,
          description: `Extra tokens purchase: +${tokens} tokens`,
        });

        logger.info({ userId, tokens, sessionId: session.id }, '[STRIPE] Extra tokens added');
      } else {
        // Legacy: old credit package purchase (backwards compat)
        const credits = parseInt(session.metadata?.credits || '0', 10);
        if (credits > 0) {
          await addExtraTokens(userId, credits, {
            stripeSessionId: session.id,
            description: `Legacy credit purchase: +${credits}`,
          });
        }
      }
      break;
    }

    // ── Invoice paid (subscription renewal) ──
    case 'invoice.paid': {
      const invoice = event.data.object as any;
      const subscriptionId = invoice.subscription as string;

      if (!subscriptionId) return;

      // Get the subscription to find period dates
      const stripeSub = await stripeClient.subscriptions.retrieve(subscriptionId) as any;
      const periodStart = new Date(stripeSub.current_period_start * 1000).toISOString();
      const periodEnd = new Date(stripeSub.current_period_end * 1000).toISOString();

      await resetMonthlyTokens(subscriptionId, periodStart, periodEnd);

      logger.info({ subscriptionId }, '[STRIPE] Monthly tokens reset on invoice.paid');
      break;
    }

    // ── Subscription deleted/canceled ──
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await deactivateSubscription(subscription.id);
      logger.info({ subscriptionId: subscription.id }, '[STRIPE] Subscription deactivated');
      break;
    }

    default:
      logger.debug({ eventType: event.type }, '[STRIPE] Unhandled event type');
  }
}
