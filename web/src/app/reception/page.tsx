'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PublicOnlyGuard } from '../../components/PublicOnlyGuard';
import { motion } from 'framer-motion';

export default function ReceptionPage() {
    return (
        <PublicOnlyGuard>
            <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden flex items-center justify-center font-sans">
                {/* Background Logo */}
                <motion.div
                    className="fixed inset-0 flex items-center justify-center z-0 pointer-events-none select-none"
                    initial={{ y: '100%', opacity: 0, scale: 0.5, filter: 'blur(10px)' }}
                    animate={{
                        y: ['100%', '0%', '0%'],
                        opacity: [0, 1, 0.2],
                        scale: [0.5, 1.4, 1], // Start small, overshoot large, settle normal
                        filter: ['blur(10px)', 'blur(0px)', 'blur(0px)']
                    }}
                    transition={{
                        duration: 1.8,
                        times: [0, 0.4, 1], // 0-0.7s (Entry), 0.7s-1.8s (Settle)
                        ease: [0.22, 1, 0.36, 1] // Custom "Call of Duty" / Premium easing (easeOutQuint-ish)
                    }}
                >
                    <div className="relative h-[70vh] w-[70vh]">
                        <Image
                            src="/logo.png"
                            alt="Shadowfeed Logo"
                            fill
                            className="object-contain"
                            priority
                            draggable={false}
                        />
                    </div>
                </motion.div>

                {/* Glassmorphism Card */}
                <motion.div
                    className="relative z-10 w-full max-w-[400px] p-8 mx-4 bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-[3px] shadow-2xl flex flex-col items-center gap-8"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                        delay: 1.2, // Match the new faster logo animation
                        duration: 0.6,
                        ease: [0.22, 1, 0.36, 1]
                    }}
                >
                    <h1 className="text-xl md:text-2xl font-bold tracking-[0.1em] text-center">
                        WELCOME TO SHADOWFEED
                    </h1>

                    <div className="flex flex-col w-full items-center gap-4">
                        {/* Button 1: Purple Outline, Hover Purple Fill */}
                        <Link href="/login" className="w-[70%]">
                            <button className="w-full py-3 px-6 border !border-[#8a00c4] border-solid text-white rounded-[3px] !bg-[#8a00c4] hover:!bg-[#a100e6] transition-all duration-300 uppercase text-sm font-semibold tracking-wide">
                                Sign In
                            </button>
                        </Link>

                        {/* Button 2: Black Border & Fill */}
                        <Link href="/login?signup=true" className="w-[70%]">
                            <button className="w-full py-3 px-6 border !border-black border-solid !bg-black text-white rounded-[3px] hover:bg-black/80 transition-all duration-300 uppercase text-sm font-semibold tracking-wide">
                                Sign Up
                            </button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </PublicOnlyGuard>
    );
}
