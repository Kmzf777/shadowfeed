'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCredits, purchaseExtraTokens } from '../../hooks/useCredits';
import { Sidebar } from '../../components/Sidebar';
import { Loader2, User, Settings, Edit2, Zap, Plus, ArrowRight, Crown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '../../contexts/LanguageContext';

const EXTRA_TOKEN_PRICE_USD = 0.012;

export default function MyAccountPage() {
    const { t, currency } = useLanguage();
    const { user, userProfile, loading } = useAuth();
    const { subscription, extraTokens, freeTokens, planRemaining, totalAvailable, loading: creditsLoading, refetch: refetchCredits } = useCredits();
    const [purchaseLoading, setPurchaseLoading] = useState(false);

    // Extra tokens purchase state
    const [extraAmount, setExtraAmount] = useState('');

    const extraAmountNum = parseFloat(extraAmount) || 0;
    const tokensPreview = currency === 'usd'
        ? Math.floor(extraAmountNum / EXTRA_TOKEN_PRICE_USD)
        : Math.floor((extraAmountNum / 5.80) / EXTRA_TOKEN_PRICE_USD);
    const minAmount = currency === 'usd' ? 2.0 : 11.90;

    const handleBuyExtra = async () => {
        if (!user?.id || extraAmountNum < minAmount) return;
        setPurchaseLoading(true);
        try {
            const amountUsd = currency === 'usd' ? extraAmountNum : extraAmountNum / 5.80;
            const result = await purchaseExtraTokens(user.id, amountUsd, currency);
            if (result?.url) {
                window.location.href = result.url;
            }
        } finally {
            setPurchaseLoading(false);
        }
    };

    if (loading) {
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
                    <h1 className="text-2xl font-bold font-['Sora'] mb-4">Access Restricted</h1>
                    <p className="text-white/60 mb-6">Please log in to view your account.</p>
                </div>
            </div>
        );
    }

    const usagePercent = subscription
        ? Math.min(100, Math.round((subscription.tokensUsed / subscription.tokensAllocated) * 100))
        : 0;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <Sidebar />

            {/* Background Logo */}
            <div className="fixed inset-0 flex items-center justify-center z-0 pointer-events-none select-none">
                <div className="relative h-[70vh] w-[70vh] opacity-20">
                    <img
                        src="/logo.png"
                        alt="Shadowfeed Logo"
                        className="object-contain h-full w-full"
                        draggable={false}
                    />
                </div>
            </div>

            <div className="pl-[260px] relative z-10">
                <div className="max-w-[1000px] mx-auto px-8 py-12">

                    <header className="mb-10">
                        <h1 className="text-3xl font-bold font-['Sora'] mb-2">{t('account.title')}</h1>
                        <p className="text-white/60 font-['DM_Sans']">{t('account.subtitle')}</p>
                    </header>

                    <div className="grid grid-cols-1 gap-8">

                        {/* Section 1: Profile & Personalization */}
                        <section className="bg-white/5 backdrop-blur-[10px] rounded-[3px] p-8 border border-white/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                <Settings className="w-32 h-32" />
                            </div>

                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <h2 className="text-xl font-bold font-['Sora'] flex items-center gap-2">
                                    <User className="w-5 h-5 text-[#8a00c4]" />
                                    {t('account.profile.title')}
                                </h2>
                                <Link href="/setup" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-[3px] transition-colors text-sm font-medium border border-white/5 hover:border-white/10">
                                    <Edit2 className="w-4 h-4" />
                                    {t('account.profile.edit')}
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 items-start relative z-10">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-32 h-32 rounded-full border-2 border-[#8a00c4] p-1 shadow-[0_0_20px_rgba(138,0,196,0.2)]">
                                        <div className="w-full h-full rounded-full bg-[#1a1a1a] overflow-hidden relative">
                                            {userProfile?.avatar_url || user.user_metadata?.avatar_url ? (
                                                <Image
                                                    src={userProfile?.avatar_url || user.user_metadata?.avatar_url}
                                                    alt="Profile"
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white/20">
                                                    <User className="w-12 h-12" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-xs text-white/40 uppercase tracking-wider font-bold">{t('account.profile.currentAvatar')}</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                    <div className="space-y-1">
                                        <label className="text-sm text-white/40 font-['DM_Sans']">{t('account.profile.displayName')}</label>
                                        <div className="text-lg font-medium">{userProfile?.full_name || t('account.profile.notSet')}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm text-white/40 font-['DM_Sans']">{t('account.profile.handle')}</label>
                                        <div className="text-lg font-medium text-[#8a00c4]">
                                            {userProfile?.handle ? `@${userProfile.handle}` : t('account.profile.notSet')}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm text-white/40 font-['DM_Sans']">{t('account.profile.email')}</label>
                                        <div className="text-lg font-medium opacity-80">{user.email}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm text-white/40 font-['DM_Sans']">{t('account.profile.highlightColor')}</label>
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-6 h-6 rounded-full border border-white/20 shadow-sm"
                                                style={{ backgroundColor: userProfile?.highlight_color || '#8a00c4' }}
                                            />
                                            <span className="text-white/80 font-mono text-sm uppercase">
                                                {userProfile?.highlight_color || '#8a00c4'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Plan */}
                        <section className="bg-white/5 backdrop-blur-[10px] rounded-[3px] p-8 border border-white/10">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold font-['Sora'] flex items-center gap-2">
                                    <Crown className="w-5 h-5 text-[#8a00c4]" />
                                    {t('account.plan.title')}
                                </h2>
                                {subscription && (
                                    <Link
                                        href="/my-account/plan"
                                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-[3px] transition-colors text-sm font-medium border border-white/5 hover:border-white/10"
                                    >
                                        {t('account.plan.viewDetails')}
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                )}
                            </div>

                            {creditsLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-[#8a00c4]" />
                                </div>
                            ) : subscription ? (
                                <div className="space-y-6">
                                    {/* Plan name + badge */}
                                    <div className="flex items-center gap-3">
                                        <span className="bg-[#8a00c4] text-white text-sm font-bold px-3 py-1 rounded-full">
                                            {subscription.planName}
                                        </span>
                                        {subscription.cancelAtPeriodEnd && (
                                            <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded-full">
                                                {t('account.plan.cancelsAtPeriodEnd')}
                                            </span>
                                        )}
                                    </div>

                                    {/* Usage bar */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-white/60 font-['DM_Sans']">{t('account.plan.tokenUsage')}</span>
                                            <span className="text-sm text-white/80 font-['DM_Sans'] font-medium">
                                                {subscription.tokensUsed.toLocaleString()} / {subscription.tokensAllocated.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${usagePercent}%`,
                                                    background: usagePercent > 90
                                                        ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                                                        : usagePercent > 70
                                                            ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                                                            : 'linear-gradient(90deg, #8a00c4, #a855f7)',
                                                }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-sm text-white/60">
                                                <strong className="text-white">{subscription.tokensRemaining.toLocaleString()}</strong> {t('account.plan.remaining')}
                                            </span>
                                            <span className="text-xs text-white/40">
                                                {t('account.plan.renews')} {new Date(subscription.currentPeriodEnd).toLocaleDateString(currency === 'brl' ? 'pt-BR' : 'en-US', {
                                                    month: 'short', day: 'numeric', year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* No active plan — CTA to plans page */
                                <div className="text-center py-4">
                                    <p className="text-white/60 font-['DM_Sans'] mb-6">
                                        {t('account.plan.noPlan')}
                                    </p>
                                    <Link
                                        href="/my-account/plans"
                                        className="inline-flex items-center gap-2 px-8 py-3 bg-[#8a00c4] hover:bg-[#a300e6] text-white font-bold font-['DM_Sans'] rounded-[3px] transition-all shadow-[0_0_20px_rgba(138,0,196,0.3)] hover:shadow-[0_0_30px_rgba(138,0,196,0.5)]"
                                    >
                                        <Crown className="w-5 h-5" />
                                        {t('account.plan.hirePlan')}
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            )}
                        </section>

                        {/* Section 2.5: Token Balance Overview */}
                        <section className="bg-white/5 backdrop-blur-[10px] rounded-[3px] p-8 border border-white/10">
                            <h2 className="text-xl font-bold font-['Sora'] flex items-center gap-2 mb-6">
                                <Zap className="w-5 h-5 text-[#8a00c4]" />
                                {t('account.tokens.title')}
                            </h2>

                            {creditsLoading ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="w-6 h-6 animate-spin text-[#8a00c4]" />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* Total */}
                                    <div className="flex items-center justify-between p-4 bg-[#8a00c4]/10 rounded-[3px] border border-[#8a00c4]/20">
                                        <span className="text-sm font-bold text-white font-['DM_Sans']">{t('account.tokens.totalAvailable')}</span>
                                        <span className="text-2xl font-bold font-['Sora'] text-white">{totalAvailable.toLocaleString()}</span>
                                    </div>

                                    {/* Breakdown */}
                                    <div className="grid grid-cols-3 gap-3">
                                        {/* Plan tokens */}
                                        <div className="p-3 bg-white/5 rounded-[3px] border border-white/10">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <div className="w-2 h-2 rounded-full bg-[#a855f7]" />
                                                <span className="text-xs text-white/50 font-['DM_Sans']">{t('account.tokens.plan')}</span>
                                            </div>
                                            <div className="text-lg font-bold font-['Sora'] text-[#a855f7]">
                                                {planRemaining.toLocaleString()}
                                            </div>
                                            <span className="text-[10px] text-white/30">{t('account.tokens.resetsMonthly')}</span>
                                        </div>

                                        {/* Free tokens */}
                                        <div className="p-3 bg-white/5 rounded-[3px] border border-white/10">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <div className="w-2 h-2 rounded-full bg-green-400" />
                                                <span className="text-xs text-white/50 font-['DM_Sans']">{t('account.tokens.free')}</span>
                                            </div>
                                            <div className="text-lg font-bold font-['Sora'] text-green-400">
                                                {freeTokens.toLocaleString()}
                                            </div>
                                            <span className="text-[10px] text-white/30">{t('account.tokens.bonusTokens')}</span>
                                        </div>

                                        {/* Extra tokens */}
                                        <div className="p-3 bg-white/5 rounded-[3px] border border-white/10">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                                                <span className="text-xs text-white/50 font-['DM_Sans']">{t('account.tokens.extra')}</span>
                                            </div>
                                            <div className="text-lg font-bold font-['Sora'] text-yellow-400">
                                                {extraTokens.toLocaleString()}
                                            </div>
                                            <span className="text-[10px] text-white/30">{t('account.tokens.neverExpire')}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Section 3: Buy Extra Tokens */}
                        <section className="bg-white/5 backdrop-blur-[10px] rounded-[3px] p-8 border border-white/10">
                            <h2 className="text-xl font-bold font-['Sora'] flex items-center gap-2 mb-6">
                                <Plus className="w-5 h-5 text-[#8a00c4]" />
                                {t('account.tokens.buyExtra')}
                            </h2>

                            {/* Extra token balance */}
                            <div className="flex items-center gap-3 mb-6 p-4 bg-white/5 rounded-[3px] border border-white/10">
                                <Zap className="w-5 h-5 text-yellow-400" />
                                <div>
                                    <span className="text-sm text-white/60 font-['DM_Sans']">{t('account.tokens.extraBalance')}</span>
                                    <div className="text-2xl font-bold font-['Sora']">{creditsLoading ? '...' : extraTokens.toLocaleString()}</div>
                                </div>
                                <span className="text-xs text-white/30 ml-auto">{t('account.tokens.neverExpire')}</span>
                            </div>

                            {/* Amount input */}
                            <div className="space-y-3">
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">
                                        {currency === 'usd' ? '$' : 'R$'}
                                    </span>
                                    <input
                                        type="number"
                                        value={extraAmount}
                                        onChange={(e) => setExtraAmount(e.target.value)}
                                        placeholder={minAmount.toFixed(2)}
                                        min={minAmount}
                                        step="0.01"
                                        className="w-full pl-12 pr-4 py-4 rounded-[3px] bg-[#0a0a0a] text-white border border-white/[0.12] focus:border-[#8a00c4] outline-none transition font-['DM_Sans'] text-lg"
                                    />
                                </div>

                                {/* Token preview */}
                                {extraAmountNum > 0 && (
                                    <div className="p-3 bg-white/5 rounded-[3px] border border-white/10 flex items-center justify-between">
                                        <span className="text-sm text-white/60">{t('account.tokens.youReceive')}</span>
                                        <span className="font-bold text-white font-['Sora']">
                                            ~{tokensPreview.toLocaleString()} tokens
                                        </span>
                                    </div>
                                )}

                                <p className="text-xs text-white/30">
                                    {t('account.tokens.minimum')}: {currency === 'usd' ? '$2.00' : 'R$11.90'} | {t('account.tokens.rate')}: $0.012/token | {t('account.tokens.neverExpire')}
                                </p>

                                <button
                                    onClick={handleBuyExtra}
                                    disabled={purchaseLoading || extraAmountNum < minAmount}
                                    className="w-full py-3 rounded-[3px] font-['DM_Sans'] font-bold text-sm transition-all bg-white/10 hover:bg-white/15 text-white border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {purchaseLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                    ) : (
                                        t('account.tokens.addExtra')
                                    )}
                                </button>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
}
