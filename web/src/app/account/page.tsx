'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useCredits, purchaseExtraTokens } from '../../hooks/useCredits';
import { Sidebar } from '../../components/Sidebar';
import { Loader2, User, Settings, Edit2, Zap, Plus, ArrowRight, Crown, Terminal, CreditCard } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '../../contexts/LanguageContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

const EXTRA_TOKEN_PRICE_USD = 0.012;

export default function MyAccountPage() {
    const { t, currency } = useLanguage();
    const { user, userProfile, loading } = useAuth();
    const { subscription, extraTokens, freeTokens, planRemaining, totalAvailable, loading: creditsLoading, refetch: refetchCredits } = useCredits();
    const [purchaseLoading, setPurchaseLoading] = useState(false);
    const [verifyingSession, setVerifyingSession] = useState(false);
    const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);
    const searchParams = useSearchParams();

    // Verify Stripe session on redirect from checkout
    useEffect(() => {
        const purchase = searchParams.get('purchase');
        const sessionId = searchParams.get('session_id');

        if (purchase === 'success' && sessionId && !verifyingSession) {
            setVerifyingSession(true);
            setPurchaseMessage('Activating your plan...');

            fetch(`${API_URL}/api/credits/verify-session?sessionId=${sessionId}`)
                .then(res => res.json())
                .then(data => {
                    console.log('[MY-ACCOUNT] Session verification result:', data);
                    if (data.activated) {
                        setPurchaseMessage('Plan activated successfully! ✓');
                        refetchCredits();
                    } else {
                        setPurchaseMessage(`Activation pending: ${data.details}`);
                    }
                })
                .catch(err => {
                    console.error('[MY-ACCOUNT] Session verification error:', err);
                    setPurchaseMessage('Could not verify payment. Please refresh the page.');
                })
                .finally(() => {
                    setVerifyingSession(false);
                    // Clear message after 8 seconds
                    setTimeout(() => setPurchaseMessage(null), 8000);
                });
        }
    }, [searchParams]);

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
            <div className="min-h-screen bg-[#050505] text-white pl-[260px] flex items-center justify-center font-mono">
                <span className="animate-pulse mr-2">&gt;</span> WAITING_FOR_USER_DATA...
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

    const usagePercent = subscription
        ? Math.min(100, Math.round((subscription.tokensUsed / subscription.tokensAllocated) * 100))
        : 0;

    return (
        <div className="min-h-screen text-[#d4d4d4] relative z-[1]">
            <Sidebar />

            <div className="pl-[260px]">
                <div className="max-w-[1000px] mx-auto px-12 py-12">

                    <header className="mb-12 flex items-end gap-4 border-b border-[#1e1e1e] pb-6">
                        <div>
                            <h1 className="text-4xl font-bold font-['Sora'] tracking-tight text-white mb-2">{t('account.title')}</h1>
                            <p className="text-[#808080] font-mono text-xs">/home/{user.email?.split('@')[0]}/config • rw-r--r--</p>
                        </div>
                    </header>


                    {/* Purchase status message */}
                    {purchaseMessage && (
                        <div className={`mb-8 p-4 border-l-2 ${purchaseMessage.includes('✓')
                            ? 'bg-[#071a0f] border-green-500 text-green-400'
                            : 'bg-[#1a1100] border-yellow-500 text-yellow-400'
                            } text-sm font-mono`}>
                            <span className="mr-2">&gt;</span>
                            {purchaseMessage}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-12">

                        {/* Section 1: Profile & Personalization */}
                        <section>
                            <h2 className="text-sm font-bold text-[#808080] uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Terminal className="w-4 h-4" />
                                User Profile
                            </h2>

                            <div className="bg-[#0a0a0a] border border-[#1e1e1e] p-6 lg:p-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <User className="w-24 h-24" />
                                </div>

                                <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                                    <div className="w-24 h-24 border border-[#2a2a2a] p-1 bg-[#050505]">
                                        <div className="w-full h-full bg-[#1a1a1a] relative">
                                            {userProfile?.avatar_url || user.user_metadata?.avatar_url ? (
                                                <Image
                                                    src={userProfile?.avatar_url || user.user_metadata?.avatar_url}
                                                    alt="Profile"
                                                    fill
                                                    className="object-cover grayscale hover:grayscale-0 transition-all duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[#4a4a4a]">
                                                    <User className="w-8 h-8" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 w-full space-y-4 font-mono text-sm">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="border border-[#1e1e1e] p-3 hover:border-[#8a00c4]/50 transition-colors">
                                                <label className="text-[10px] text-[#4a4a4a] uppercase block mb-1">Display Name</label>
                                                <div className="text-[#d4d4d4]">{userProfile?.full_name || t('account.profile.notSet')}</div>
                                            </div>
                                            <div className="border border-[#1e1e1e] p-3 hover:border-[#8a00c4]/50 transition-colors">
                                                <label className="text-[10px] text-[#4a4a4a] uppercase block mb-1">Handle</label>
                                                <div className="text-[#8a00c4]">
                                                    {userProfile?.handle ? `@${userProfile.handle}` : t('account.profile.notSet')}
                                                </div>
                                            </div>
                                            <div className="border border-[#1e1e1e] p-3 hover:border-[#8a00c4]/50 transition-colors">
                                                <label className="text-[10px] text-[#4a4a4a] uppercase block mb-1">Email</label>
                                                <div className="text-[#808080]">{user.email}</div>
                                            </div>
                                            <div className="border border-[#1e1e1e] p-3 hover:border-[#8a00c4]/50 transition-colors">
                                                <label className="text-[10px] text-[#4a4a4a] uppercase block mb-1">Theme Color</label>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 bg-[#8a00c4]" />
                                                    <span className="text-[#808080]">#8a00c4</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <Link href="/setup" className="inline-flex items-center gap-2 text-xs text-[#8a00c4] hover:text-[#b44cff] uppercase tracking-wider group">
                                                <span className="group-hover:translate-x-1 transition-transform">&gt;</span>
                                                Edit Configuration
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Plan & Usage */}
                        <section>
                            <h2 className="text-sm font-bold text-[#808080] uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                System Resources
                            </h2>

                            <div className="bg-[#0a0a0a] border border-[#1e1e1e] p-6 lg:p-8">
                                <div className="flex flex-col md:flex-row gap-8">
                                    {/* Left: Plan Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-xs font-mono text-[#808080] uppercase">Current Plan</span>
                                            {subscription ? (
                                                <span className="text-xs font-mono text-[#8a00c4] border border-[#8a00c4] px-2 py-0.5 rounded-[2px] uppercase">
                                                    {subscription.planName}
                                                </span>
                                            ) : (
                                                <span className="text-xs font-mono text-[#4a4a4a] border border-[#2a2a2a] px-2 py-0.5 rounded-[2px] uppercase">
                                                    Free Tier
                                                </span>
                                            )}
                                        </div>

                                        {subscription ? (
                                            <div className="space-y-6">
                                                <div>
                                                    <div className="flex justify-between text-xs font-mono mb-2">
                                                        <span className="text-[#4a4a4a]">CPU_ALLOCATION (TOKENS)</span>
                                                        <span className="text-[#d4d4d4]">{subscription.tokensUsed} / {subscription.tokensAllocated}</span>
                                                    </div>
                                                    <div className="w-full h-4 bg-[#161616] border border-[#2a2a2a] p-0.5">
                                                        <div
                                                            className="h-full bg-[#8a00c4] relative"
                                                            style={{ width: `${usagePercent}%` }}
                                                        >
                                                            {/* Scanline on bar */}
                                                            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] animate-shimmer" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-[#161616] p-3 border border-[#2a2a2a]">
                                                        <span className="block text-[10px] text-[#4a4a4a] uppercase mb-1">Renewal Date</span>
                                                        <span className="text-xs text-[#d4d4d4] font-mono">
                                                            {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    </div>
                                                    <div className="bg-[#161616] p-3 border border-[#2a2a2a]">
                                                        <span className="block text-[10px] text-[#4a4a4a] uppercase mb-1">Status</span>
                                                        <span className="text-xs text-green-500 font-mono uppercase">Active • Running</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 border border-dashed border-[#2a2a2a]">
                                                <p className="text-xs text-[#808080] mb-4 font-mono">NO ACTIVE SUBSCRIPTION DETECTED</p>
                                                <Link
                                                    href="/account/upgrade"
                                                    className="inline-block px-4 py-2 bg-[#8a00c4] hover:bg-[#9a10d4] text-white text-xs font-mono uppercase tracking-widest transition-colors"
                                                >
                                                    Upgrade System
                                                </Link>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Token Breakdown */}
                                    <div className="w-full md:w-64 border-l border-[#2a2a2a] md:pl-8 flex flex-col justify-center">
                                        <div className="mb-4">
                                            <span className="block text-[10px] text-[#4a4a4a] uppercase mb-1">Total Available Memory</span>
                                            <span className="text-3xl font-bold font-['Sora'] text-white">
                                                {creditsLoading ? '...' : totalAvailable.toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="space-y-2 text-xs font-mono">
                                            <div className="flex justify-between items-center text-[#808080]">
                                                <span>&gt; plan_tokens</span>
                                                <span className="text-[#a855f7]">{planRemaining.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[#808080]">
                                                <span>&gt; one_time</span>
                                                <span className="text-yellow-500">{extraTokens.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[#808080]">
                                                <span>&gt; bonus</span>
                                                <span className="text-green-500">{freeTokens.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Buy Extra Tokens */}
                        <section>
                            <h2 className="text-sm font-bold text-[#808080] uppercase tracking-widest mb-6 flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                Purchase Memory Expansion
                            </h2>

                            <div className="bg-[#0a0a0a] border border-[#1e1e1e] p-6 lg:p-8">
                                <div className="flex flex-col md:flex-row gap-6 items-end">
                                    <div className="flex-1 w-full">
                                        <label className="text-xs text-[#808080] font-mono uppercase block mb-2">Amount ({currency.toUpperCase()})</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4a4a] font-mono font-bold">
                                                {currency === 'usd' ? '$' : 'R$'}
                                            </span>
                                            <input
                                                type="number"
                                                value={extraAmount}
                                                onChange={(e) => setExtraAmount(e.target.value)}
                                                placeholder={minAmount.toFixed(2)}
                                                min={minAmount}
                                                step="0.01"
                                                className="w-full pl-10 pr-4 py-3 bg-[#050505] border border-[#2a2a2a] focus:border-[#8a00c4] text-white font-mono text-sm outline-none transition-colors rounded-none placeholder:text-[#2a2a2a]"
                                            />
                                        </div>
                                        <div className="mt-2 text-[10px] text-[#4a4a4a] font-mono flex items-center gap-2">
                                            <span>MIN: {currency === 'usd' ? '$2.00' : 'R$11.90'}</span>
                                            <span>•</span>
                                            <span>RATE: $0.012/UNIT</span>
                                        </div>
                                    </div>

                                    <div className="hidden md:block text-[#2a2a2a]">
                                        <ArrowRight className="w-6 h-6" />
                                    </div>

                                    <div className="flex-1 w-full">
                                        <label className="text-xs text-[#808080] font-mono uppercase block mb-2">Estimated Yield</label>
                                        <div className="w-full py-3 px-4 bg-[#161616] border border-[#2a2a2a] text-[#d4d4d4] font-mono text-sm flex justify-between items-center">
                                            <span>tokens_received:</span>
                                            <span className="text-[#8a00c4] font-bold">
                                                {extraAmountNum > 0 ? tokensPreview.toLocaleString() : '0'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="w-full md:w-auto">
                                        <button
                                            onClick={handleBuyExtra}
                                            disabled={purchaseLoading || extraAmountNum < minAmount}
                                            className="w-full md:w-auto px-8 py-3 bg-[#8a00c4] hover:bg-[#9d00de] text-white font-mono text-sm uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#2a2a2a]"
                                        >
                                            {purchaseLoading ? 'PROCESSING...' : 'EXECUTE_ORDER'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
}
