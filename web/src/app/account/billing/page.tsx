'use client';

import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useCredits, useCreditTransactions, useUsageStats, useModelPricing, cancelSubscription } from '../../../hooks/useCredits';
import { Sidebar } from '../../../components/Sidebar';
import { Loader2, Clock, BarChart3, Settings, ArrowLeft, AlertTriangle, Sparkles, Zap, Crown } from 'lucide-react';
import Link from 'next/link';

type Tab = 'last-uses' | 'usage' | 'plan';

export default function PlanDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const { subscription, extraTokens, freeTokens, planRemaining, loading: creditsLoading } = useCredits();

    const [activeTab, setActiveTab] = useState<Tab>('last-uses');
    const [cancelConfirm, setCancelConfirm] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);

    if (authLoading || creditsLoading) {
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
                    <p className="text-[#808080] mb-6">Please log in to view your plan.</p>
                </div>
            </div>
        );
    }

    const handleCancel = async () => {
        if (!user?.id) return;
        setCancelLoading(true);
        const ok = await cancelSubscription(user.id);
        setCancelLoading(false);
        if (ok) {
            setCancelConfirm(false);
            window.location.reload();
        }
    };

    const tabs = [
        { id: 'last-uses' as Tab, label: 'Last Uses', icon: Clock },
        { id: 'usage' as Tab, label: 'Usage', icon: BarChart3 },
        { id: 'plan' as Tab, label: 'Plan', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white relative z-[1]">
            <Sidebar />

            <div className="pl-[260px]">
                <div className="max-w-[1200px] mx-auto px-8 py-12">

                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/account" className="text-[#808080] hover:text-white transition">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold font-['Sora']">Plan Dashboard</h1>
                            <p className="text-[#808080] font-['DM_Sans'] text-sm">
                                {subscription ? `${subscription.planName} Plan` : 'No active plan'}
                            </p>
                        </div>
                    </div>

                    {/* Layout: Sidebar + Content */}
                    <div className="flex gap-8">

                        {/* Dashboard Sidebar */}
                        <div className="w-[200px] shrink-0 space-y-1">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-[3px] transition-all text-left text-sm font-['DM_Sans'] ${activeTab === tab.id
                                            ? 'bg-[#161616] border-b border-[#8a00c4] text-[#d4d4d4]'
                                            : 'text-[#808080] hover:text-white hover:bg-[#161616] border-b border-transparent'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 min-w-0">
                            {activeTab === 'last-uses' && <LastUsesTab userId={user.id} />}
                            {activeTab === 'usage' && <UsageTab userId={user.id} />}
                            {activeTab === 'plan' && (
                                <PlanTab
                                    subscription={subscription}
                                    extraTokens={extraTokens}
                                    freeTokens={freeTokens}
                                    planRemaining={planRemaining}
                                    cancelConfirm={cancelConfirm}
                                    setCancelConfirm={setCancelConfirm}
                                    cancelLoading={cancelLoading}
                                    onCancel={handleCancel}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Tab 1: Last Uses (Logs)
// ============================================================================

function LastUsesTab({ userId }: { userId: string }) {
    const { transactions, loading } = useCreditTransactions(100);
    const spendTransactions = transactions.filter(tx => tx.type === 'spend');

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#8a00c4]" />
            </div>
        );
    }

    if (spendTransactions.length === 0) {
        return (
            <div className="bg-[#161616] rounded-[3px] border border-[#1e1e1e] p-12 text-center">
                <Clock className="w-12 h-12 text-[#4a4a4a] mx-auto mb-4" />
                <p className="text-[#808080] font-['DM_Sans']">No post generations yet.</p>
                <p className="text-[#4a4a4a] text-sm mt-1">Your usage history will appear here.</p>
            </div>
        );
    }

    return (
        <div className="bg-[#161616] rounded-[3px] border border-[#1e1e1e] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-[#111111] border-b border-[#1e1e1e]">
                            <th className="text-left py-3 px-4 text-[11px] text-[#4a4a4a] font-['DM_Sans'] font-medium uppercase tracking-wider">Date</th>
                            <th className="text-left py-3 px-4 text-[11px] text-[#4a4a4a] font-['DM_Sans'] font-medium uppercase tracking-wider">Description</th>
                            <th className="text-left py-3 px-4 text-[11px] text-[#4a4a4a] font-['DM_Sans'] font-medium uppercase tracking-wider">Source</th>
                            <th className="text-right py-3 px-4 text-[11px] text-[#4a4a4a] font-['DM_Sans'] font-medium uppercase tracking-wider">Tokens</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e1e1e]">
                        {spendTransactions.map((tx) => (
                            <tr key={tx.id} className="odd:bg-[#0d0d0d] even:bg-[#111111] hover:bg-[#1a1a1a] transition-colors">
                                <td className="py-3 px-4 text-sm text-[#808080] font-['DM_Sans'] whitespace-nowrap">
                                    {new Date(tx.createdAt).toLocaleDateString('en-US', {
                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </td>
                                <td className="py-3 px-4 text-sm text-white font-['DM_Sans']">
                                    {tx.description || 'Post generation'}
                                </td>
                                <td className="py-3 px-4">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-[3px] border ${tx.tokenSource === 'extra'
                                            ? 'bg-[#1a1100] border-[#4a3000] text-[#fbbf24]'
                                            : tx.tokenSource === 'free'
                                                ? 'bg-[#071a0f] border-[#1a4a1a] text-[#4ade80]'
                                                : 'bg-[#1a0033] border-[#5c0099] text-[#b44cff]'
                                        }`}>
                                        {tx.tokenSource === 'extra' ? 'Extra' : tx.tokenSource === 'free' ? 'Free' : 'Plan'}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-red-400 font-bold font-['Sora'] text-right">
                                    {tx.amount}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ============================================================================
// Tab 2: Usage
// ============================================================================

function UsageTab({ userId }: { userId: string }) {
    const [range, setRange] = useState<'24h' | '7d' | '30d' | 'all'>('30d');
    const { stats, loading } = useUsageStats(range);

    const ranges = [
        { id: '24h' as const, label: '24h' },
        { id: '7d' as const, label: '7d' },
        { id: '30d' as const, label: '30d' },
        { id: 'all' as const, label: 'All' },
    ];

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#8a00c4]" />
            </div>
        );
    }

    const maxTokens = stats?.daily.length
        ? Math.max(...stats.daily.map(d => d.tokens))
        : 0;

    return (
        <div className="space-y-6">
            {/* Range selector */}
            <div className="flex items-center gap-2">
                {ranges.map((r) => (
                    <button
                        key={r.id}
                        onClick={() => setRange(r.id)}
                        className={`px-3 py-1.5 rounded-[3px] text-sm font-bold transition ${range === r.id
                            ? 'bg-[#8a00c4] text-white'
                            : 'bg-[#161616] text-[#808080] hover:text-white'
                            }`}
                    >
                        {r.label}
                    </button>
                ))}
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#161616] rounded-[3px] border border-[#1e1e1e] p-4">
                    <span className="text-xs text-[#4a4a4a] font-['DM_Sans']">Total Used</span>
                    <div className="text-2xl font-bold font-['Sora'] mt-1">{stats?.totalUsed.toLocaleString() || 0}</div>
                    <span className="text-xs text-[#4a4a4a]">tokens</span>
                </div>
                <div className="bg-[#161616] rounded-[3px] border border-[#1e1e1e] p-4">
                    <span className="text-xs text-[#4a4a4a] font-['DM_Sans']">Daily Average</span>
                    <div className="text-2xl font-bold font-['Sora'] mt-1">{Math.round(stats?.averageDaily || 0).toLocaleString()}</div>
                    <span className="text-xs text-[#4a4a4a]">tokens/day</span>
                </div>
                <div className="bg-[#161616] rounded-[3px] border border-[#1e1e1e] p-4">
                    <span className="text-xs text-[#4a4a4a] font-['DM_Sans']">Projected Monthly</span>
                    <div className="text-2xl font-bold font-['Sora'] mt-1">{Math.round(stats?.projectedMonthly || 0).toLocaleString()}</div>
                    <span className="text-xs text-[#4a4a4a]">tokens/mo</span>
                </div>
            </div>

            {/* Bar chart */}
            <div className="bg-[#111111] rounded-[3px] border border-[#1e1e1e] p-6">
                <h3 className="text-sm text-[#808080] font-['DM_Sans'] mb-4">Daily Token Usage</h3>

                {!stats?.daily.length ? (
                    <div className="text-center py-12 text-[#4a4a4a] text-sm">
                        No usage data for this period.
                    </div>
                ) : (
                    <div className="flex items-end gap-1 h-[200px]">
                        {stats.daily.map((day) => {
                            const heightPercent = maxTokens > 0 ? (day.tokens / maxTokens) * 100 : 0;
                            return (
                                <div
                                    key={day.date}
                                    className="flex-1 flex flex-col items-center justify-end group relative"
                                >
                                    {/* Tooltip */}
                                    <div className="absolute -top-8 bg-[#0a0a0a] border border-[#2a2a2a] text-[#d4d4d4] text-xs px-2 py-1 rounded-[3px] opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                                        {day.date}: {day.tokens} tokens
                                    </div>
                                    <div
                                        className="w-full rounded-t-[2px] bg-[#8a00c4] hover:bg-[#a855f7] transition-colors min-h-[2px]"
                                        style={{ height: `${Math.max(2, heightPercent)}%` }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}

                {stats?.daily.length ? (
                    <div className="flex justify-between mt-2 text-[10px] text-[#4a4a4a]">
                        <span>{stats.daily[0]?.date}</span>
                        <span>{stats.daily[stats.daily.length - 1]?.date}</span>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

// ============================================================================
// Tab 3: Plan
// ============================================================================

function PlanTab({
    subscription,
    extraTokens,
    freeTokens,
    planRemaining,
    cancelConfirm,
    setCancelConfirm,
    cancelLoading,
    onCancel,
}: {
    subscription: any;
    extraTokens: number;
    freeTokens: number;
    planRemaining: number;
    cancelConfirm: boolean;
    setCancelConfirm: (v: boolean) => void;
    cancelLoading: boolean;
    onCancel: () => void;
}) {
    if (!subscription) {
        return (
            <div className="bg-[#161616] rounded-[3px] border border-[#1e1e1e] p-12 text-center">
                <Settings className="w-12 h-12 text-[#4a4a4a] mx-auto mb-4" />
                <p className="text-[#808080] font-['DM_Sans']">No active plan.</p>
                <Link
                    href="/account"
                    className="inline-block mt-4 px-6 py-2 bg-[#8a00c4] text-white rounded-[3px] font-bold text-sm hover:bg-[#a300e6] transition"
                >
                    Choose a Plan
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Plan Details Card */}
            <div className="bg-[#161616] rounded-[3px] border border-[#1e1e1e] p-6">
                <h3 className="text-lg font-bold font-['Sora'] mb-4">Plan Details</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-xs text-[#4a4a4a] font-['DM_Sans']">Plan</span>
                        <div className="text-white font-bold mt-1">{subscription.planName}</div>
                    </div>
                    <div>
                        <span className="text-xs text-[#4a4a4a] font-['DM_Sans']">Status</span>
                        <div className="mt-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-[3px] border ${subscription.status === 'active'
                                ? 'bg-[#071a0f] border-[#1a4a1a] text-[#4ade80]'
                                : 'bg-[var(--status-err-bg,#1a0707)] border-[var(--status-err,#f87171)]/20 text-[var(--status-err,#f87171)]'
                                }`}>
                                {subscription.status === 'active' ? 'Active' : subscription.status}
                            </span>
                            {subscription.cancelAtPeriodEnd && (
                                <span className="text-xs text-[var(--status-err,#f87171)] ml-2">(cancels at period end)</span>
                            )}
                        </div>
                    </div>
                    <div>
                        <span className="text-xs text-[#4a4a4a] font-['DM_Sans']">Tokens / Month</span>
                        <div className="text-white font-bold mt-1">{subscription.tokensAllocated.toLocaleString()}</div>
                    </div>
                    <div>
                        <span className="text-xs text-[#4a4a4a] font-['DM_Sans']">Current Period Ends</span>
                        <div className="text-white font-bold mt-1">
                            {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                                month: 'long', day: 'numeric', year: 'numeric'
                            })}
                        </div>
                    </div>
                    <div>
                        <span className="text-xs text-[#4a4a4a] font-['DM_Sans']">Plan Remaining</span>
                        <div className="text-[#a855f7] font-bold mt-1">{planRemaining.toLocaleString()}</div>
                    </div>
                    <div>
                        <span className="text-xs text-[#4a4a4a] font-['DM_Sans']">Free Tokens</span>
                        <div className="text-green-400 font-bold mt-1">{freeTokens.toLocaleString()}</div>
                    </div>
                    <div>
                        <span className="text-xs text-[#4a4a4a] font-['DM_Sans']">Extra Tokens</span>
                        <div className="text-yellow-400 font-bold mt-1">{extraTokens.toLocaleString()}</div>
                    </div>
                    <div>
                        <span className="text-xs text-[#4a4a4a] font-['DM_Sans']">Total Available</span>
                        <div className="text-white font-bold mt-1">{(planRemaining + freeTokens + extraTokens).toLocaleString()}</div>
                    </div>
                </div>
            </div>

            {/* Model Pricing */}
            <ModelPricingSection />

            {/* Cancel Plan */}
            {!subscription.cancelAtPeriodEnd && (
                <div className="bg-[#161616] rounded-[3px] border border-[var(--status-err,#f87171)]/20 p-6">
                    <h3 className="text-lg font-bold font-['Sora'] text-[var(--status-err,#f87171)] mb-2">Cancel Plan</h3>
                    <p className="text-[#808080] text-sm font-['DM_Sans'] mb-4">
                        Your plan will remain active until the end of the current billing period.
                        Unused plan tokens will be lost, but extra tokens are kept.
                    </p>

                    {!cancelConfirm ? (
                        <button
                            onClick={() => setCancelConfirm(true)}
                            className="px-4 py-2 bg-[var(--status-err-bg,#1a0707)] text-[var(--status-err,#f87171)] border border-[var(--status-err,#f87171)]/20 rounded-[3px] text-sm font-bold hover:bg-[var(--status-err,#f87171)]/10 transition"
                        >
                            Cancel Subscription
                        </button>
                    ) : (
                        <div className="flex items-center gap-3 p-3 bg-[var(--status-err-bg,#1a0707)] rounded-[3px] border border-[var(--status-err,#f87171)]/20">
                            <AlertTriangle className="w-5 h-5 text-[var(--status-err,#f87171)] shrink-0" />
                            <p className="text-sm text-[var(--status-err,#f87171)]/80">Are you sure? This cannot be undone.</p>
                            <button
                                onClick={() => setCancelConfirm(false)}
                                className="px-3 py-1 bg-[#2a2a2a] rounded-[3px] text-sm text-[#d4d4d4] hover:bg-[#3a3a3a] transition"
                            >
                                Keep Plan
                            </button>
                            <button
                                onClick={onCancel}
                                disabled={cancelLoading}
                                className="px-3 py-1 bg-[var(--status-err,#f87171)] rounded-[3px] text-sm text-white font-bold hover:opacity-90 transition disabled:opacity-50"
                            >
                                {cancelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Cancel'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Model Pricing Section
// ============================================================================

const MODEL_ICONS: Record<string, any> = {
    'marketing-friend': Zap,
    'copywriter': Crown,
    'shadowfeed': Sparkles,
};

function ModelPricingSection() {
    const { models, loading } = useModelPricing();

    if (loading) {
        return (
            <div className="bg-[#161616] rounded-[3px] border border-[#1e1e1e] p-6">
                <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-[#8a00c4]" />
                </div>
            </div>
        );
    }

    if (!models.length) return null;

    return (
        <div className="bg-[#161616] rounded-[3px] border border-[#1e1e1e] p-6">
            <h3 className="text-lg font-bold font-['Sora'] mb-4">Token Cost per Post</h3>
            <p className="text-xs text-[#4a4a4a] font-['DM_Sans'] mb-4">
                Cost varies by AI model. Choose your model when creating a post.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {models.map((model) => {
                    const Icon = MODEL_ICONS[model.id] || Zap;
                    return (
                        <div
                            key={model.id}
                            className={`bg-[#161616] rounded-[3px] p-4 border ${model.active ? 'border-[#1e1e1e]' : 'border-[#0d0d0d] opacity-50'}`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Icon className="w-4 h-4 text-[#8a00c4]" />
                                <span className="text-sm font-bold text-white">{model.displayName}</span>
                            </div>
                            {model.active && model.estimatedTokensPerPost ? (
                                <>
                                    <div className="text-2xl font-bold font-['Sora'] text-white">
                                        ~{model.estimatedTokensPerPost} <span className="text-sm font-normal text-[#4a4a4a]">tokens</span>
                                    </div>
                                    <span className="text-[10px] text-[#4a4a4a]">per post (estimated)</span>
                                </>
                            ) : (
                                <div className="text-sm text-[#4a4a4a] mt-1">Coming Soon</div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
