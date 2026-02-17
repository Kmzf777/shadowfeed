'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSubscriptionPlans, subscribeToPlan } from '../../../hooks/useCredits';
import { CheckoutModal } from '../../../components/CheckoutModal';
import { Sidebar } from '../../../components/Sidebar';
import { Loader2, ArrowLeft, Crown, Check, Zap, Star, Rocket, AlertTriangle } from 'lucide-react';
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
    const { t, language, currency } = useLanguage();
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
            <div className="min-h-screen bg-[#0a0a0a] text-white pl-[260px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#8a00c4]" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] text-white">
                <Sidebar />
                <div className="pl-[260px] flex flex-col items-center justify-center min-h-screen">
                    <h1 className="text-2xl font-bold font-['Sora'] mb-4">{t('planDashboard.accessRestricted')}</h1>
                    <p className="text-white/60 mb-6">{t('planDashboard.pleaseLogin')}</p>
                </div>
            </div>
        );
    }

    const currencySymbol = currency === 'usd' ? '$' : 'R$';

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <Sidebar />

            {/* Background Logo */}
            <div className="fixed inset-0 flex items-center justify-center z-0 pointer-events-none select-none">
                <div className="relative h-[70vh] w-[70vh] opacity-10">
                    <img
                        src="/logo.png"
                        alt="Shadowfeed Logo"
                        className="object-contain h-full w-full"
                        draggable={false}
                    />
                </div>
            </div>

            <div className="pl-[260px] relative z-10">
                <CheckoutModal
                    isOpen={isCheckoutOpen}
                    onClose={() => setIsCheckoutOpen(false)}
                    clientSecret={clientSecret}
                />
                <div className="max-w-[1100px] mx-auto px-8 py-12">

                    {/* Header */}
                    <div className="flex items-center gap-4 mb-4">
                        <Link href="/my-account" className="text-white/50 hover:text-white transition">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold font-['Sora'] flex items-center gap-3">
                                <Crown className="w-8 h-8 text-[#8a00c4]" />
                                {t('plans.title')}
                            </h1>
                        </div>
                    </div>
                    <p className="text-white/50 font-['DM_Sans'] mb-10 ml-9">
                        {t('plans.subtitle')}
                    </p>

                    {/* Error message */}
                    {error && (
                        <div className="mb-6 ml-9 p-4 rounded-[3px] border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-['DM_Sans'] flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-bold mb-1">Checkout Error</p>
                                <p>{error}</p>
                            </div>
                            <button onClick={() => setError(null)} className="text-red-400/60 hover:text-red-400 transition">✕</button>
                        </div>
                    )}

                    {/* Controls: Billing Cycle + Currency */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
                        {/* Billing Cycle Selector */}
                        <div className="bg-white/5 rounded-[3px] border border-white/10 p-1 flex">
                            {(Object.entries(CYCLE_CONFIG) as [BillingCycle, typeof CYCLE_CONFIG[BillingCycle]][]).map(([id, cfg]) => (
                                <button
                                    key={id}
                                    onClick={() => setCycle(id)}
                                    className={`relative px-5 py-2.5 rounded-[3px] text-sm font-bold font-['DM_Sans'] transition-all ${cycle === id
                                        ? 'bg-[#8a00c4] text-white shadow-[0_0_15px_rgba(138,0,196,0.3)]'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {t(cfg.labelKey)}
                                    {cfg.badge && (
                                        <span className="absolute -top-2 -right-1 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                            {cfg.badge}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Plan Cards */}
                    {plansLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-[#8a00c4]" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {plans.map((plan, i) => {
                                const Icon = PLAN_ICONS[i] || Zap;
                                const isPopular = i === 1;
                                // Dynamic feature list from translations
                                // Plan IDs are like 'starter', 'micro-operation', 'booster-mode'
                                // We fetch from plans.features.[ID]
                                const features = t(`plans.features.${plan.id}`) || [];
                                const pricing = calcCyclePrice(plan.priceUsd, plan.priceBrl, cycle, currency);

                                return (
                                    <div
                                        key={plan.id}
                                        className={`relative rounded-[3px] border flex flex-col transition-all hover:scale-[1.02] ${isPopular
                                            ? 'border-[#8a00c4] bg-[#8a00c4]/10 shadow-[0_0_30px_rgba(138,0,196,0.15)]'
                                            : 'border-white/10 bg-white/5 hover:border-white/20'
                                            }`}
                                    >
                                        {isPopular && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                                <span className="bg-[#8a00c4] text-white text-xs font-bold px-4 py-1 rounded-full shadow-[0_0_15px_rgba(138,0,196,0.4)]">
                                                    {t('plans.mostPopular')}
                                                </span>
                                            </div>
                                        )}

                                        <div className="p-8 flex-1 flex flex-col">
                                            {/* Plan header */}
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={`w-10 h-10 rounded-[3px] flex items-center justify-center ${isPopular ? 'bg-[#8a00c4]/30' : 'bg-white/10'}`}>
                                                    <Icon className={`w-5 h-5 ${isPopular ? 'text-[#8a00c4]' : 'text-white/60'}`} />
                                                </div>
                                                <h3 className="font-['Sora'] font-bold text-xl">{plan.name}</h3>
                                            </div>

                                            {/* Pricing */}
                                            <div className="mb-6">
                                                <div className="flex items-end gap-1">
                                                    <span className="text-4xl font-bold font-['Sora']">
                                                        {currencySymbol}{pricing.perMonth.toFixed(2)}
                                                    </span>
                                                    <span className="text-white/40 text-sm mb-1.5">{t('plans.perMonth')}</span>
                                                </div>

                                                {cycle !== 'monthly' && (
                                                    <div className="mt-2 space-y-1">
                                                        <p className="text-sm text-white/50 font-['DM_Sans']">
                                                            {t('plans.billed')} {currencySymbol}{pricing.total.toFixed(2)}/{cycle === 'quarterly' ? t('plans.quarter') : t('plans.year')}
                                                        </p>
                                                        <p className="text-xs text-green-400 font-bold">
                                                            {t('plans.save')} {currencySymbol}{pricing.savings.toFixed(2)} vs {t('plans.monthly')}
                                                        </p>
                                                    </div>
                                                )}

                                                {cycle === 'monthly' && (
                                                    <p className="text-sm text-white/40 font-['DM_Sans'] mt-1">
                                                        {t('plans.cancelAnytime')}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Features */}
                                            <div className="space-y-3 mb-8 flex-1">
                                                {Array.isArray(features) && features.map((feature: string, j: number) => (
                                                    <div key={j} className="flex items-start gap-2.5">
                                                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${isPopular ? 'text-[#8a00c4]' : 'text-white/40'}`} />
                                                        <span className="text-sm text-white/70 font-['DM_Sans']">{feature}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Subscribe button */}
                                            <button
                                                onClick={() => handleSubscribe(plan.id)}
                                                disabled={subscribeLoading === plan.id}
                                                className={`w-full py-3.5 rounded-[3px] font-['DM_Sans'] font-bold text-sm transition-all ${isPopular
                                                    ? 'bg-[#8a00c4] hover:bg-[#a300e6] text-white shadow-[0_0_15px_rgba(138,0,196,0.3)] hover:shadow-[0_0_25px_rgba(138,0,196,0.5)]'
                                                    : 'bg-white/10 hover:bg-white/15 text-white border border-white/10 hover:border-white/20'
                                                    } disabled:opacity-50`}
                                            >
                                                {subscribeLoading === plan.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                                ) : (
                                                    `${t('plans.subscribeTo')} ${plan.name}`
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Bottom info */}
                    <div className="mt-12 text-center space-y-2">
                        <p className="text-white/30 text-sm font-['DM_Sans']">
                            {t('plans.autoRenew')}
                        </p>
                        <p className="text-white/30 text-sm font-['DM_Sans']">
                            {t('plans.needMoreTokens')} <Link href="/my-account" className="text-[#8a00c4] hover:underline">{t('plans.buyExtra')}</Link> {t('plans.onTop')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
