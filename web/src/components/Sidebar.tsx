'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Search, Folder, User, LogOut, Home, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCredits } from '../hooks/useCredits';
import { useLanguage } from '../contexts/LanguageContext';

export function Sidebar() {
    const pathname = usePathname();
    const { user, userProfile, signOut } = useAuth();
    const { subscription, planRemaining, freeTokens, extraTokens, totalAvailable, loading: creditsLoading } = useCredits();
    const { t } = useLanguage();

    const isActive = (path: string) => pathname === path;

    return (
        <aside className="fixed left-0 top-0 h-screen w-[260px] bg-black border-r border-white/10 flex flex-col z-50">
            {/* Logo Header */}
            <div className="p-6">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-11 h-11 relative rounded-[10px] overflow-hidden">
                        <Image
                            src="/logo.png"
                            alt="Shadowfeed Logo"
                            fill
                            className="object-cover"
                        />
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-6">

                {/* Search Section */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-white/40 group-focus-within:text-white/80 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder={t('sidebar.search')}
                        className="w-full bg-[#161616] text-white text-sm rounded-[8px] pl-10 pr-4 py-2.5 border border-transparent focus:border-white/10 focus:bg-[#1a1a1a] outline-none transition-all placeholder:text-white/30"
                    />
                </div>

                {/* Menu Items */}
                <div className="space-y-1">
                    <Link
                        href="/"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] transition-all group ${isActive('/')
                            ? 'bg-[#1a1a1a] text-white'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Home className="w-5 h-5" />
                        <span className="font-['DM_Sans'] font-medium">{t('sidebar.feed')}</span>
                    </Link>
                    <Link
                        href="/my-posts"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] transition-all group ${isActive('/my-posts')
                            ? 'bg-[#1a1a1a] text-white'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Folder className="w-5 h-5" />
                        <span className="font-['DM_Sans'] font-medium">{t('sidebar.myPosts')}</span>
                    </Link>

                    <Link
                        href="/my-account"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] transition-all group ${isActive('/my-account')
                            ? 'bg-[#1a1a1a] text-white'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <User className="w-5 h-5" />
                        <span className="font-['DM_Sans'] font-medium">{t('sidebar.account')}</span>
                    </Link>
                </div>

                {/* Token Usage Display */}
                {user && (
                    <Link
                        href="/my-account"
                        className="flex flex-col gap-2 px-3 py-2.5 rounded-[8px] bg-[#161616] border border-white/5 hover:border-[#8a00c4]/30 transition-all group"
                    >
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-[#8a00c4]" />
                                <span className="font-['DM_Sans'] text-sm text-white/60 group-hover:text-white transition-colors">{t('sidebar.tokens')}</span>
                            </div>
                            <span className="font-['DM_Sans'] font-bold text-sm text-white">
                                {creditsLoading ? '...' : totalAvailable.toLocaleString()}
                            </span>
                        </div>
                        {!creditsLoading && (
                            <div className="flex flex-col gap-0.5">
                                {subscription && (
                                    <>
                                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden mb-1">
                                            <div
                                                className="h-full rounded-full bg-[#8a00c4] transition-all"
                                                style={{ width: `${Math.min(100, Math.round((subscription.tokensUsed / subscription.tokensAllocated) * 100))}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-[#a855f7] font-['DM_Sans']">{t('sidebar.plan')}</span>
                                            <span className="text-[10px] text-white/40 font-['DM_Sans']">{planRemaining.toLocaleString()}</span>
                                        </div>
                                    </>
                                )}
                                {freeTokens > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-green-400 font-['DM_Sans']">{t('sidebar.free')}</span>
                                        <span className="text-[10px] text-white/40 font-['DM_Sans']">{freeTokens.toLocaleString()}</span>
                                    </div>
                                )}
                                {extraTokens > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-yellow-400 font-['DM_Sans']">{t('sidebar.extra')}</span>
                                        <span className="text-[10px] text-white/40 font-['DM_Sans']">{extraTokens.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </Link>
                )}

                {/* Main Action - Create Post */}
                <div className="pt-2">
                    <Link
                        href="/criar-post"
                        className="flex items-center justify-center w-full bg-[#8a00c4] hover:bg-[#a300e6] text-white font-bold text-sm py-3 rounded-[8px] transition-all shadow-[0_0_15px_rgba(138,0,196,0.3)] hover:shadow-[0_0_20px_rgba(138,0,196,0.5)] uppercase"
                    >
                        {t('sidebar.newPost')}
                    </Link>
                </div>

            </nav>

            {/* User Footer */}
            {user && (
                <div className="p-4 border-t border-white/5">
                    <div className="flex items-center gap-3 w-full px-2 py-2">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden relative border border-white/10 shrink-0">
                            {(userProfile?.avatar_url || user.user_metadata?.avatar_url) ? (
                                <Image
                                    src={userProfile?.avatar_url || user.user_metadata.avatar_url}
                                    alt={userProfile?.full_name || user.user_metadata?.full_name || 'User'}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/40">
                                    <User className="w-5 h-5" />
                                </div>
                            )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white font-['DM_Sans'] truncate">
                                {userProfile?.instagram_handle || userProfile?.full_name || user.email?.split('@')[0]}
                            </p>
                            <button
                                onClick={() => signOut()}
                                className="text-xs text-white/40 hover:text-white transition-colors text-left flex items-center gap-1 mt-0.5"
                            >
                                <LogOut className="w-3 h-3" />
                                <span>{t('sidebar.logout')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}
