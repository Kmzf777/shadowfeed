'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Folder, Plus, User, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { useCredits } from '../hooks/useCredits';

export function MobileNav() {
    const pathname = usePathname();
    const { totalAvailable } = useCredits();

    const regularLinks = [
        { href: '/', icon: Home, label: 'FEED' },
        { href: '/my-posts', icon: Folder, label: 'POSTS' },
        { href: '/account', icon: User, label: 'ACCOUNT' },
    ];

    const isCreateActive = pathname === '/create';

    return (
        <>
            {/* Floating Action Button */}
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 md:hidden">
                <Link
                    href="/create"
                    className="flex flex-col items-center group"
                >
                    <div className={cn(
                        "w-14 h-14 rounded-full bg-gradient-to-tr from-[#8a00c4] to-[#a000e0] border-4 border-[#050505] flex items-center justify-center shadow-lg transition-transform active:scale-95",
                        isCreateActive && "shadow-[0_0_20px_rgba(138,0,196,0.6)]"
                    )}>
                        <Plus className="w-6 h-6 text-white" />
                    </div>
                </Link>
            </div>

            {/* Bottom Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#050505]/80 backdrop-blur-xl border-t border-[#1e1e1e] flex items-center justify-around px-2 z-40 md:hidden pb-safe">
                {/* Glossy top border effect */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#8a00c4]/50 to-transparent" />

                {regularLinks.map((link) => {
                    const Icon = link.icon;
                    const active = pathname === link.href;

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="flex flex-col items-center justify-center flex-1 h-full gap-1 group"
                        >
                            <div className={cn(
                                "relative flex items-center justify-center transition-colors",
                                active ? "text-[#8a00c4]" : "text-[#808080] group-hover:text-[#d4d4d4]"
                            )}>
                                <Icon className="w-5 h-5" />
                                {active && (
                                    <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#8a00c4] shadow-[0_0_8px_#8a00c4]" />
                                )}
                            </div>
                            <span className={cn(
                                "text-[9px] font-mono tracking-tighter transition-colors mt-0.5",
                                active ? "text-[#d4d4d4]" : "text-[#4a4a4a] group-hover:text-[#808080]"
                            )}>
                                {link.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
