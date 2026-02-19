'use client';

import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSubscriptionPlans, subscribeToPlan } from '../../../hooks/useCredits';
import { CheckoutModal } from '../../../components/CheckoutModal';
import { Sidebar } from '../../../components/Sidebar';
import { Loader2, ArrowLeft, Crown, Check, Zap, Star, Rocket, AlertTriangle, Terminal } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '../../../contexts/LanguageContext';

type BillingCycle = 'monthly' | 'quarterly' | 'annual';

const CYCLE_CONFIG: Record<BillingCycle, { labelKey: string; discount: number; badge: string | null; months: number }> = {
    monthly: { labelKey: 'plans.monthly', discount: 0, badge: null, months: 1 },
    quarterly: { labelKey: 'plans.quarterly', discount: 0.10, badge: '-10%', months: 3 },
    annual: { labelKey: 'plans.annual', discount: 0.20, badge: '-20%', months: 12 },
};

const PLAN_ICONS = [Zap, Star, Rocket];

function calcCyclePrice(baseUsd: number, baseBrl: number, cycle: BillingCycle, currency: 'usd' | 'brl') {
    const cfg = CYCLE_CONFIG[cycle];
    const base = currency === 'brl' ? baseBrl : baseUsd;
    const discounted = base * (1 - cfg.discount);
    const perMonth = Math.round(discounted * 100) / 100;
    const total = Math.round(perMonth * cfg.months * 100) / 100;
    const savings = Math.round(base * cfg.months * cfg.discount * 100) / 100;
    return { perMonth, total, savings };
}

export default function PlansPage() {
    const { user, loading: authLoading } = useAuth();
    const { plans, loading: plansLoading } = useSubscriptionPlans();
    const { t, currency } = useLanguage();
    const [cycle, setCycle] = useState<BillingCycle>('monthly');
    const [subscribeLoading, setSubscribeLoading] = useState<string | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubscribe = async (planId: string) => {
        if (!user?.id) return;
        setSubscribeLoading(planId);
        setError(null);
        try {
            const result = await subscribeToPlan(user.id, planId, currency, cycle);
            setClientSecret(result.clientSecret);
            setIsCheckoutOpen(true);
        } catch (err: any) {
            console.error('[PlansPage] Subscribe error:', err);
            setError(err.message || 'Failed to start checkout. Please try again.');
            setTimeout(() => setError(null), 8000);
        } finally {
            setSubscribeLoading(null);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#050505] text-white pl-[260px] flex items-center justify-center font-mono">
                <span className="animate-pulse mr-2">&gt;</span> AUTHENTICATING...
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#050505] text-white">
                <Sidebar />
                <div className="pl-[260px] flex flex-col items-center justify-center min-h-screen">
                    <h1 className="text-2xl font-bold font-['Sora'] mb-4 tracking-tight">ACCESS DENIED</h1>
                    <p className="text-[#808080] font-mono text-sm uppercase tracking-wider mb-6">/var/auth/login_required</p>
                </div>
            </div>
        );
    }

    const currencySymbol = currency === 'usd' ? '$' : 'R$';

    return (
        <div className="min-h-screen text-[#d4d4d4] relative z-[1]">
            <Sidebar />


            <div className="pl-[260px]">
                <CheckoutModal
                    isOpen={isCheckoutOpen}
                    onClose={() => setIsCheckoutOpen(false)}
                    clientSecret={clientSecret}
                />
                <div className="max-w-[1200px] mx-auto px-12 py-12">

                    {/* Header */}
                    <header className="mb-12 flex items-end gap-4 border-b border-[#1e1e1e] pb-6">
                        <Link href="/account" className="mb-1 text-[#808080] hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-bold font-['Sora'] tracking-tight text-white mb-2">{t('plans.title')}</h1>
                            <p className="text-[#808080] font-mono text-xs">/account/upgrade • system_upgrade</p>
                        </div>
                    </header>

                    {/* Error message */}
                    {error && (
                        <div className="mb-8 p-4 bg-[#1a0707] border border-[#4a1a1a] rounded-none flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-[#f87171] flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-[#f87171] mb-1 font-mono text-sm uppercase">Transaction Error</h3>
                                <p className="text-sm text-[#f87171]/70 font-mono">{error}</p>
                            </div>
                            <button onClick={() => setError(null)} className="text-[#f87171] hover:text-[#f87171]/80 font-mono text-xs uppercase">[DISMISS]</button>
                        </div>
                    )}

                    {/* Controls: Billing Cycle Selector */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
                        <div className="flex items-center gap-2 text-xs font-mono text-[#808080] uppercase">
                            <Terminal className="w-4 h-4" />
                            <span>Select Billing Cycle:</span>
                        </div>

                        <div className="bg-[#0a0a0a] border border-[#1e1e1e] p-1 flex">
                            {(Object.entries(CYCLE_CONFIG) as [BillingCycle, typeof CYCLE_CONFIG[BillingCycle]][]).map(([id, cfg]) => (
                                <button
                                    key={id}
                                    onClick={() => setCycle(id)}
                                    className={`relative px-6 py-2 text-xs font-mono uppercase tracking-wider transition-all border ${cycle === id
                                        ? 'bg-[#161616] text-white border-[#8a00c4] z-10'
                                        : 'bg-transparent text-[#808080] border-transparent hover:text-[#d4d4d4] hover:bg-[#111]'
                                        }`}
                                >
                                    {t(cfg.labelKey)}
                                    {cfg.badge && (
                                        <span className="absolute -top-3 -right-2 bg-[#8a00c4] text-white text-[9px] font-bold px-1.5 py-0.5 border border-[#000]">
                                            {cfg.badge}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Plan Cards */}
                    {plansLoading ? (
                        <div className="flex justify-center py-24">
                            <span className="font-mono text-[#8a00c4] animate-pulse">&gt; FETCHING_PLANS...</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {plans.map((plan, i) => {
                                const Icon = PLAN_ICONS[i] || Zap;
                                const isPopular = i === 1;
                                const features = t(`plans.features.${plan.id}`) || [];
                                const pricing = calcCyclePrice(plan.priceUsd, plan.priceBrl, cycle, currency);

                                return (
                                    <div
                                        key={plan.id}
                                        className={`relative border flex flex-col transition-all group ${isPopular
                                            ? 'bg-[#0a0a0a] border-[#8a00c4] z-10 scale-[1.02] shadow-[0_0_30px_rgba(138,0,196,0.1)]'
                                            : 'bg-[#0a0a0a] border-[#1e1e1e] hover:border-[#4a4a4a]'
                                            }`}
                                    >
                                        {isPopular && (
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                                <span className="bg-[#8a00c4] text-white text-[10px] font-mono font-bold px-3 py-1 uppercase tracking-widest border border-[#000]">
                                                    RECOMMENDED
                                                </span>
                                            </div>
                                        )}

                                        <div className="p-8 flex-1 flex flex-col items-center text-center">
                                            {/* Icon */}
                                            <div className={`w-12 h-12 flex items-center justify-center mb-6 border ${isPopular ? 'bg-[#8a00c4]/10 border-[#8a00c4] text-[#8a00c4]' : 'bg-[#161616] border-[#2a2a2a] text-[#808080]'}`}>
                                                <Icon className="w-6 h-6" />
                                            </div>

                                            {/* Name */}
                                            <h3 className="font-['Sora'] font-bold text-xl text-white mb-2">{plan.name}</h3>

                                            {/* Pricing */}
                                            <div className="mb-8">
                                                <div className="flex items-baseline justify-center gap-1">
                                                    <span className="text-3xl font-bold font-['Sora'] text-white">
                                                        {currencySymbol}{pricing.perMonth.toFixed(2)}
                                                    </span>
                                                    <span className="text-[#808080] text-xs font-mono uppercase">/mo</span>
                                                </div>

                                                {cycle !== 'monthly' && (
                                                    <div className="mt-2 text-xs font-mono">
                                                        <p className="text-[#4a4a4a] mb-1">
                                                            billed {currencySymbol}{pricing.total.toFixed(2)}/{cycle === 'quarterly' ? 'qtr' : 'yr'}
                                                        </p>
                                                        <p className="text-green-500">
                                                            SAVE {currencySymbol}{pricing.savings.toFixed(2)}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Features separator */}
                                            <div className="w-full h-px bg-[#1e1e1e] mb-8 relative">
                                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0a0a0a] px-2 text-[10px] text-[#4a4a4a] font-mono uppercase">
                                                    Capabilities
                                                </div>
                                            </div>

                                            {/* Features */}
                                            <div className="space-y-3 mb-8 flex-1 w-full text-left">
                                                {Array.isArray(features) && features.map((feature: string, j: number) => (
                                                    <div key={j} className="flex items-start gap-3 text-xs font-mono text-[#d4d4d4]">
                                                        <Check className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isPopular ? 'text-[#8a00c4]' : 'text-[#4a4a4a]'}`} />
                                                        <span>{feature}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Subscribe button */}
                                            <button
                                                onClick={() => handleSubscribe(plan.id)}
                                                disabled={subscribeLoading === plan.id}
                                                className={`w-full py-4 text-xs font-mono uppercase tracking-widest font-bold transition-all border ${isPopular
                                                    ? 'bg-[#8a00c4] hover:bg-[#9d00de] text-white border-[#8a00c4]'
                                                    : 'bg-transparent hover:bg-[#161616] text-[#d4d4d4] border-[#2a2a2a] hover:border-[#d4d4d4]'
                                                    } disabled:opacity-50 disabled:cursor-wait`}
                                            >
                                                {subscribeLoading === plan.id ? 'PROCESSING...' : `SELECT ${plan.name.toUpperCase()}`}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Footer Info */}
                    <div className="mt-16 text-center border-t border-[#1e1e1e] pt-8">
                        <p className="text-[#4a4a4a] text-xs font-mono">
                            Secure payment processing via Stripe. All plans auto-renew unless cancelled.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
