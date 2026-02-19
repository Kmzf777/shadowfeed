'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Search, Folder, User, LogOut, Home, Zap, Plus, Terminal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCredits } from '../hooks/useCredits';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function Sidebar() {
    const pathname = usePathname();
    const { user, userProfile, signOut } = useAuth();
    const { subscription, planRemaining, freeTokens, extraTokens, totalAvailable, loading: creditsLoading } = useCredits();
    const { t } = useLanguage();

    const isActive = (path: string) => pathname === path;

    return (
        <aside className="fixed left-0 top-0 h-screen w-[260px] bg-[#050505] border-r border-[#1e1e1e] flex flex-col z-50 font-mono text-sm">
            {/* Header / Brand */}
            <div className="p-6 pb-4 border-b border-[#1e1e1e]/50">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative w-8 h-8 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Image
                            src="/logo.png"
                            alt="Shadowfeed Logo"
                            fill
                            className="object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[#d4d4d4] font-bold tracking-tight">SHADOWFEED</span>
                        <span className="text-[10px] text-[#4a4a4a] uppercase tracking-wider">System v0.1</span>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">

                {/* Section: MAIN */}
                <div className="space-y-2">
                    <h3 className="text-[10px] text-[#4a4a4a] uppercase tracking-widest pl-2 mb-2">/the-new-era</h3>

                    {/* Search (Styled as command input) */}
                    <div className="relative group mb-4">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                            <span className="text-[#4a4a4a] group-focus-within:text-[#8a00c4] mr-2">$</span>
                        </div>
                        <Input
                            type="text"
                            placeholder="search..."
                            className="pl-8 h-9 bg-[#0a0a0a] border border-[#1e1e1e] rounded-none focus:border-[#8a00c4] focus:ring-0 text-xs font-mono text-[#d4d4d4] placeholder:text-[#4a4a4a]"
                        />
                    </div>

                    <Link
                        href="/"
                        className={`flex items-center gap-3 px-3 py-2 transition-all group ${isActive('/')
                            ? 'text-[#d4d4d4]'
                            : 'text-[#808080] hover:text-[#d4d4d4]'
                            }`}
                    >
                        <span className={`w-4 text-center ${isActive('/') ? 'opacity-100 text-[#8a00c4]' : 'opacity-0'} transition-opacity`}>&gt;</span>
                        <span className="">FEED</span>

                    </Link>

                    <Link
                        href="/my-posts"
                        className={`flex items-center gap-3 px-3 py-2 transition-all group ${isActive('/my-posts')
                            ? 'text-[#d4d4d4]'
                            : 'text-[#808080] hover:text-[#d4d4d4]'
                            }`}
                    >
                        <span className={`w-4 text-center ${isActive('/my-posts') ? 'opacity-100 text-[#8a00c4]' : 'opacity-0'} transition-opacity`}>&gt;</span>
                        <span className="">MY POSTS</span>

                    </Link>

                    <Link
                        href="/account"
                        className={`flex items-center gap-3 px-3 py-2 transition-all group ${isActive('/account')
                            ? 'text-[#d4d4d4]'
                            : 'text-[#808080] hover:text-[#d4d4d4]'
                            }`}
                    >
                        <span className={`w-4 text-center ${isActive('/account') ? 'opacity-100 text-[#8a00c4]' : 'opacity-0'} transition-opacity`}>&gt;</span>
                        <span className="">ACCOUNT</span>

                    </Link>
                </div>

                {/* Section: RESOURCES */}
                <div className="space-y-2">
                    <h3 className="text-[10px] text-[#4a4a4a] uppercase tracking-widest pl-2 mb-2">/var/resources</h3>

                    {user && (
                        <div className="px-3 py-2 border border-[#1e1e1e] bg-[#0a0a0a] relative group overflow-hidden">
                            {/* Scanline effect on hover */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#8a00c4]/5 to-transparent translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000 pointer-events-none" />

                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-[#808080]">Tokens:</span>
                                <span className="text-xs font-bold text-[#d4d4d4] font-mono">
                                    {creditsLoading ? '...' : totalAvailable.toLocaleString()}
                                </span>
                            </div>

                            {!creditsLoading && subscription && (
                                <div className="space-y-1">
                                    <div className="w-full bg-[#1e1e1e] h-[2px]">
                                        <div
                                            className="h-full bg-[#8a00c4]"
                                            style={{ width: `${Math.min(100, Math.round((subscription.tokensUsed / subscription.tokensAllocated) * 100))}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[8px] text-[#4a4a4a] uppercase">
                                        <span>Usage</span>
                                        <span>{Math.round((subscription.tokensUsed / subscription.tokensAllocated) * 100)}%</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Action */}
                <div className="px-2">
                    <Link href="/create" className="block">
                        <button className="w-full py-2 bg-[#161616] border border-[#2a2a2a] hover:border-[#8a00c4] hover:bg-[#8a00c4]/10 text-[#d4d4d4] hover:text-[#8a00c4] transition-all text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 group">
                            <span className="group-hover:animate-pulse">+</span>
                            <span>new_post.sh</span>
                        </button>
                    </Link>
                </div>

            </nav>

            {/* Footer / User Session */}
            {user && (
                <div className="p-4 border-t border-[#1e1e1e] bg-[#080808]">
                    <div className="text-[10px] text-[#4a4a4a] mb-2 font-mono">session_id: {user.id.slice(0, 8)}...</div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#161616] border border-[#2a2a2a] flex items-center justify-center text-[#4a4a4a]">
                            <User className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs text-[#d4d4d4] truncate font-mono">
                                {userProfile?.handle ? `@${userProfile.handle}` : 'user'}
                            </div>
                            <button
                                onClick={() => signOut()}
                                className="text-[10px] text-[#808080] hover:text-[#f87171] transition-colors flex items-center gap-1 mt-0.5 group"
                            >
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity">&gt;</span>
                                exit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}
