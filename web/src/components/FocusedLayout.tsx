'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ReactNode } from 'react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';

interface FocusedLayoutProps {
    children: ReactNode;
    currentStep?: number;
    totalSteps?: number;
    showBackButton?: boolean;
    onBack?: () => void;
    className?: string;
    isGlitching?: boolean;
    variant?: 'default' | 'transparent';
}

export function FocusedLayout({
    children,
    currentStep,
    totalSteps,
    showBackButton,
    onBack,
    className,
    isGlitching,
    variant = 'default'
}: FocusedLayoutProps) {
    const progress = (currentStep && totalSteps) ? (currentStep / totalSteps) * 100 : 0;
    const isTransparent = variant === 'transparent';

    return (
        <div className={cn("min-h-screen w-full relative flex flex-col", isTransparent ? "bg-transparent" : "bg-[#0a0a0a]")}>
            {/* Scanlines Overlay - z-index 50 (Only if not transparent, as transparent pages use global scanlines) */}
            {!isTransparent && (
                <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden opacity-30 mix-blend-overlay">
                    <div className="absolute inset-0 bg-[url('/scanlines.png')] bg-[length:100%_4px] animate-scanlines" />
                </div>
            )}

            {/* Header */}
            <header className="w-full h-20 flex items-center justify-between px-8 border-b border-[#1e1e1e] bg-[#0a0a0a] relative z-[60]">
                <div className="flex items-center gap-4">
                    {showBackButton && (
                        <Button variant="ghost" size="icon" onClick={onBack} className="text-[#808080] hover:text-[#d4d4d4]">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    )}
                    <Link href="/" className={cn("relative w-8 h-8 opacity-80 hover:opacity-100 transition-opacity", isGlitching && "glitch-flicker")}>
                        <Image
                            src="/logo.png"
                            alt="Shadowfeed"
                            fill
                            className="object-contain"
                        />
                    </Link>
                </div>

                {/* Progress Bar (if steps provided) */}
                {totalSteps && (
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 md:w-96">
                        <div className="h-1 w-full bg-[#1c1c1c] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#8a00c4] transition-all duration-500 ease-out shadow-[0_0_10px_#8a00c4]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-[#4a4a4a] font-mono">STEP {currentStep}</span>
                            <span className="text-[10px] text-[#4a4a4a] font-mono">OF {totalSteps}</span>
                        </div>
                    </div>
                )}

                <div className="w-8" /> {/* Spacer for centering */}
            </header>

            {/* Main Content - z-index 60 (above scanlines) */}
            <main className={cn("flex-1 w-full max-w-5xl mx-auto p-6 relative z-[60]", className)}>
                {children}
            </main>
        </div>
    );
}
