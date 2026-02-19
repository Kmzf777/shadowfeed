'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { FocusedLayout } from '../../components/FocusedLayout';
import { Zap, ArrowRight, Check } from 'lucide-react';
import Image from 'next/image';

export default function ReceptionPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    // Auth check - redirect if already logged in
    useEffect(() => {
        if (!loading && user) {
            router.replace('/');
        }
    }, [user, loading, router]);

    // Don't render if checking auth or redirecting
    if (loading || user) return null;

    return (
        <FocusedLayout showBackButton={false} variant="transparent" className="flex flex-col items-center justify-center min-h-[80vh]">
            <div className="w-full max-w-md mx-auto space-y-8 text-center">

                {/* Logo & Branding */}
                <div className="flex flex-col items-center gap-6">
                    <div className="relative w-24 h-24">
                        <Image
                            src="/logo.png"
                            alt="Shadowfeed"
                            fill
                            className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                            priority
                        />
                    </div>
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold font-mono tracking-tight text-white mb-2">
                            shadowfeed
                        </h1>
                        <p className="text-[#808080] font-mono text-sm tracking-[0.2em] uppercase">
                            THE NEW ERA OF CONTENT
                        </p>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-[#111111]/80 backdrop-blur-sm border border-[#1e1e1e] rounded-lg p-8 shadow-2xl relative overflow-hidden group">
                    {/* Hover Glow Effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#8a00c4] to-[#4a00e0] rounded-lg opacity-0 group-hover:opacity-10 transition duration-1000 blur-lg"></div>

                    <div className="relative z-10 space-y-6">
                        <div className="space-y-4">
                            <Link
                                href="/login"
                                className="w-full flex items-center justify-center gap-3 bg-[#8a00c4] hover:bg-[#9d00de] text-white font-bold py-4 rounded transition-all uppercase tracking-wide text-sm font-mono shadow-[0_0_20px_rgba(138,0,196,0.2)] hover:shadow-[0_0_30px_rgba(138,0,196,0.4)]"
                            >
                                <span>Initialize Session</span>
                                <ArrowRight size={16} />
                            </Link>

                            <Link
                                href="/login?signup=true"
                                className="w-full flex items-center justify-center gap-2 bg-[#1c1c1c] border border-[#2a2a2a] hover:border-[#808080] text-[#808080] hover:text-white font-bold py-4 rounded transition-all uppercase tracking-wide text-sm font-mono"
                            >
                                <span>Create Account</span>
                            </Link>
                        </div>

                        <div className="pt-6 border-t border-[#1e1e1e]">
                            <div className="flex items-center justify-center gap-6 text-[#4a4a4a] text-xs font-mono">
                                <span className="flex items-center gap-1">
                                    <Check size={12} className="text-[#8a00c4]" />
                                    AI Powered
                                </span>
                                <span className="flex items-center gap-1">
                                    <Check size={12} className="text-[#8a00c4]" />
                                    Auto-Post
                                </span>
                                <span className="flex items-center gap-1">
                                    <Check size={12} className="text-[#8a00c4]" />
                                    Viral Ready
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer simple */}
                <div className="text-[#4a4a4a] text-[10px] font-mono uppercase tracking-wider">
                    v0.1 // SYSTEM READY
                </div>
            </div>
        </FocusedLayout>
    );
}
