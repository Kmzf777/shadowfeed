import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { supabase } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import { EXTRA_TOKEN_PRICE_USD } from '../../shared/utils/token-estimator.js';

const JWT_EXPIRY = '24h';

export function validateAdminCredentials(username: string, password: string): string | null {
  if (username === env.ADMIN_USERNAME && password === env.ADMIN_PASSWORD) {
    return jwt.sign({ role: 'admin' }, env.ADMIN_JWT_SECRET, { expiresIn: JWT_EXPIRY });
  }
  return null;
}

export function verifyAdminToken(token: string): boolean {
  try {
    jwt.verify(token, env.ADMIN_JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export interface DashboardStats {
  totalOpenAiCost: number;
  subscriptionsByPlan: Array<{ planId: string; planName: string; count: number; priceUsd: number }>;
  subscriptionRevenue: number;
  extraTokenRevenue: number;
  freeTokenCost: number;
  totalUsers: number;
  activeSubscriptions: number;
  netProfit: number;
  recentGenerations: Array<{
    id: string;
    theme: string;
    inputTokens: number | null;
    outputTokens: number | null;
    costUsd: number | null;
    creditsUsed: number | null;
    createdAt: string;
  }>;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  // 1. Total OpenAI cost from sf_posts
  const { data: costData } = await supabase
    .from('sf_posts')
    .select('generation_cost_usd');

  const totalOpenAiCost = (costData || []).reduce(
    (sum: number, p: any) => sum + (p.generation_cost_usd || 0),
    0
  );

  // 2. Active subscriptions by plan
  const { data: subsData } = await supabase
    .from('sf_user_subscriptions')
    .select('plan_id, sf_subscription_plans(name, price_usd)')
    .in('status', ['active', 'past_due']);

  const planMap = new Map<string, { planName: string; count: number; priceUsd: number }>();
  for (const sub of subsData || []) {
    const planInfo = (sub as any).sf_subscription_plans;
    const key = sub.plan_id;
    const existing = planMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      planMap.set(key, {
        planName: planInfo?.name ?? sub.plan_id,
        count: 1,
        priceUsd: planInfo?.price_usd ?? 0,
      });
    }
  }

  const subscriptionsByPlan = Array.from(planMap.entries()).map(([planId, data]) => ({
    planId,
    ...data,
  }));

  const activeSubscriptions = (subsData || []).length;
  const subscriptionRevenue = subscriptionsByPlan.reduce(
    (sum, p) => sum + p.count * p.priceUsd,
    0
  );

  // 3. Extra token revenue from transactions
  const { data: extraTxData } = await supabase
    .from('sf_credit_transactions')
    .select('amount')
    .eq('type', 'purchase')
    .eq('token_source', 'extra');

  const totalExtraTokensPurchased = (extraTxData || []).reduce(
    (sum: number, tx: any) => sum + (tx.amount || 0),
    0
  );
  const extraTokenRevenue = totalExtraTokensPurchased * EXTRA_TOKEN_PRICE_USD;

  // 4. Free token cost — sum generation_cost_usd from posts that used free tokens
  const { data: freeTxData } = await supabase
    .from('sf_credit_transactions')
    .select('post_id')
    .eq('token_source', 'free')
    .eq('type', 'spend');

  let freeTokenCost = 0;
  if (freeTxData && freeTxData.length > 0) {
    const postIds = [...new Set(freeTxData.map((tx: any) => tx.post_id).filter(Boolean))];
    if (postIds.length > 0) {
      const { data: freePosts } = await supabase
        .from('sf_posts')
        .select('generation_cost_usd')
        .in('id', postIds);
      freeTokenCost = (freePosts || []).reduce(
        (sum: number, p: any) => sum + (p.generation_cost_usd || 0),
        0
      );
    }
  }

  // 5. Total users
  const { count: totalUsers } = await supabase
    .from('sf_user_credits')
    .select('*', { count: 'exact', head: true });

  // 6. Recent generations
  const { data: recentPosts } = await supabase
    .from('sf_posts')
    .select('id, theme, input_tokens, output_tokens, generation_cost_usd, credits_used, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  const recentGenerations = (recentPosts || []).map((p: any) => ({
    id: p.id,
    theme: p.theme,
    inputTokens: p.input_tokens,
    outputTokens: p.output_tokens,
    costUsd: p.generation_cost_usd,
    creditsUsed: p.credits_used,
    createdAt: p.created_at,
  }));

  const totalRevenue = subscriptionRevenue + extraTokenRevenue;
  const netProfit = totalRevenue - totalOpenAiCost;

  logger.info({ totalOpenAiCost, subscriptionRevenue, extraTokenRevenue, freeTokenCost, netProfit }, '[ADMIN] Dashboard stats computed');

  return {
    totalOpenAiCost,
    subscriptionsByPlan,
    subscriptionRevenue,
    extraTokenRevenue,
    freeTokenCost,
    totalUsers: totalUsers ?? 0,
    activeSubscriptions,
    netProfit,
    recentGenerations,
  };
}
