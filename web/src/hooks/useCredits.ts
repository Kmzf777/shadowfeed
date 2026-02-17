'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

// ============================================================================
// Interfaces
// ============================================================================

interface SubscriptionInfo {
  planId: string;
  planName: string;
  tokensAllocated: number;
  tokensUsed: number;
  tokensRemaining: number;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  status: string;
}

interface BalanceResponse {
  balance: number;
  totalPurchased: number;
  totalSpent: number;
  extraTokens: number;
  freeTokens: number;
  subscription: SubscriptionInfo | null;
}

interface CreditTransaction {
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

interface SubscriptionPlan {
  id: string;
  name: string;
  tokensPerMonth: number;
  approximatePosts: number;
  priceUsd: number;
  priceBrl: number;
}

interface ModelCostInfo {
  id: string;
  displayName: string;
  estimatedTokensPerPost: number;
}

interface ThemePricing {
  themeCosts: Record<string, number>;
  productModeExtraCost: number;
  extraTokenPriceUsd: number;
  extraTokenMinUsd: number;
  extraTokenMinBrl: number;
  modelCosts: ModelCostInfo[];
}

interface UsageStats {
  daily: Array<{ date: string; tokens: number }>;
  totalUsed: number;
  averageDaily: number;
  projectedMonthly: number;
}

export interface LLMModel {
  id: string;
  displayName: string;
  provider: string;
  modelId: string;
  tierOrder: number;
  description: string | null;
  active: boolean;
  estimatedTokensPerPost: number | null;
}

// ============================================================================
// useCredits — Main balance + subscription hook
// ============================================================================

export function useCredits() {
  const { user } = useAuth();
  const [extraTokens, setExtraTokens] = useState(0);
  const [freeTokens, setFreeTokens] = useState(0);
  const [totalPurchased, setTotalPurchased] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/credits/balance?userId=${user.id}`);
      if (res.ok) {
        const data: BalanceResponse = await res.json();
        setExtraTokens(data.extraTokens);
        setFreeTokens(data.freeTokens ?? 0);
        setTotalPurchased(data.totalPurchased);
        setTotalSpent(data.totalSpent);
        setSubscription(data.subscription);
      }
    } catch (err) {
      console.error('[useCredits] Failed to fetch balance:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Computed values
  const planRemaining = subscription ? subscription.tokensRemaining : 0;
  const totalAvailable = planRemaining + freeTokens + extraTokens;

  return {
    // Plan tokens
    subscription,
    planRemaining,
    // Free tokens
    freeTokens,
    // Extra tokens
    extraTokens,
    // Combined
    totalAvailable,
    // Legacy compat
    balance: totalAvailable,
    totalPurchased,
    totalSpent,
    loading,
    refetch: fetchBalance,
  };
}

// ============================================================================
// useSubscription — Detailed subscription info
// ============================================================================

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    async function fetch_() {
      try {
        const res = await fetch(`${API_URL}/api/credits/subscription?userId=${user!.id}`);
        if (res.ok) {
          const data = await res.json();
          setSubscription(data);
        }
      } catch (err) {
        console.error('[useSubscription] Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    }

    fetch_();
  }, [user?.id]);

  return { subscription, loading };
}

// ============================================================================
// useSubscriptionPlans — Available plans
// ============================================================================

export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch(`${API_URL}/api/credits/plans`);
        if (res.ok) {
          const data = await res.json();
          setPlans(data);
        }
      } catch (err) {
        console.error('[useSubscriptionPlans] Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    }

    fetch_();
  }, []);

  return { plans, loading };
}

// ============================================================================
// useUsageStats — Usage chart data
// ============================================================================

export function useUsageStats(range: '24h' | '7d' | '30d' | 'all' = '30d') {
  const { user } = useAuth();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    async function fetch_() {
      try {
        const res = await fetch(`${API_URL}/api/credits/usage-stats?userId=${user!.id}&range=${range}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('[useUsageStats] Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    }

    fetch_();
  }, [user?.id, range]);

  return { stats, loading };
}

// ============================================================================
// useCreditTransactions — Transaction history
// ============================================================================

export function useCreditTransactions(limit = 50) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    async function fetch_() {
      try {
        const res = await fetch(`${API_URL}/api/credits/transactions?userId=${user!.id}&limit=${limit}`);
        if (res.ok) {
          const data = await res.json();
          setTransactions(data);
        }
      } catch (err) {
        console.error('[useCreditTransactions] Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    }

    fetch_();
  }, [user?.id, limit]);

  return { transactions, loading };
}

// ============================================================================
// useThemePricing — Theme costs (includes model costs)
// ============================================================================

export function useThemePricing() {
  const [pricing, setPricing] = useState<ThemePricing | null>(null);

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch(`${API_URL}/api/credits/pricing`);
        if (res.ok) {
          const data = await res.json();
          setPricing(data);
        }
      } catch (err) {
        console.error('[useThemePricing] Failed to fetch:', err);
      }
    }

    fetch_();
  }, []);

  return pricing;
}

// ============================================================================
// useModelPricing — Fetch available LLM models with estimated token costs
// ============================================================================

export function useModelPricing() {
  const [models, setModels] = useState<LLMModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch(`${API_URL}/api/llm/models`);
        if (res.ok) {
          const data: LLMModel[] = await res.json();
          setModels(data);
        }
      } catch (err) {
        console.error('[useModelPricing] Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    }

    fetch_();
  }, []);

  return { models, loading };
}

// ============================================================================
// Action Functions
// ============================================================================

/**
 * Subscribe to a plan — returns Stripe checkout URL
 */
// Update return type to include clientSecret
export async function subscribeToPlan(
  userId: string,
  planId: string,
  currency: 'usd' | 'brl' = 'usd',
  cycle: 'monthly' | 'quarterly' | 'annual' = 'monthly'
): Promise<{ url: string; clientSecret: string }> {
  const res = await fetch(`${API_URL}/api/credits/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, planId, currency, cycle }),
  }).catch((err) => {
    console.error('[subscribeToPlan] Network error:', err);
    throw new Error('Could not reach the server. Please check your connection and try again.');
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body.error || `Server error (${res.status})`;
    console.error('[subscribeToPlan] API error:', message);
    throw new Error(message);
  }

  const data = await res.json();
  if (!data.clientSecret) {
    throw new Error('Invalid server response: missing clientSecret');
  }
  return { url: data.url, clientSecret: data.clientSecret };
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(userId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/credits/cancel-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    return res.ok;
  } catch (err) {
    console.error('[cancelSubscription] Error:', err);
    return false;
  }
}

/**
 * Buy extra tokens — returns Stripe checkout URL
 */
export async function purchaseExtraTokens(
  userId: string,
  amountUsd: number,
  currency: 'usd' | 'brl' = 'usd'
): Promise<{ url: string; clientSecret: string; tokensToReceive: number }> {
  const res = await fetch(`${API_URL}/api/credits/buy-extra`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, amountUsd, currency }),
  }).catch((err) => {
    console.error('[purchaseExtraTokens] Network error:', err);
    throw new Error('Could not reach the server. Please check your connection and try again.');
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body.error || `Server error (${res.status})`;
    console.error('[purchaseExtraTokens] API error:', message);
    throw new Error(message);
  }

  const data = await res.json();
  return { url: data.url, clientSecret: data.clientSecret, tokensToReceive: data.tokensToReceive };
}

// ============================================================================
// Legacy compatibility
// ============================================================================

/** @deprecated Use useSubscriptionPlans instead */
export function useCreditPackages() {
  const { plans, loading } = useSubscriptionPlans();
  return {
    packages: plans.map(p => ({
      id: p.id,
      name: p.name,
      credits: p.tokensPerMonth,
      priceUsd: p.priceUsd,
      pricePerCredit: p.priceUsd / p.tokensPerMonth,
    })),
    loading,
  };
}

/** @deprecated Use purchaseExtraTokens instead */
export async function purchaseCredits(userId: string, packageId: string): Promise<string | null> {
  const result = await subscribeToPlan(userId, packageId);
  return result?.url || null;
}
