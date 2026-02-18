'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, RefreshCw, X } from 'lucide-react';
import { LivePreview } from '@/components/LivePreview';
import type { CarouselData } from '@/types/renderer/slide.types';

interface PostPreviewProps {
    carouselData: CarouselData;
    sourceUrl?: string | null;
}

export function PostPreview({ carouselData, sourceUrl }: PostPreviewProps) {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);
    const totalSlides = carouselData.total_slides || carouselData.slides.length;

    // Calculate scale based on container width
    const PREVIEW_WIDTH = 1080;
    const PREVIEW_HEIGHT = 1350;

    const scale = containerWidth / PREVIEW_WIDTH;

    const handlePrev = () => {
        setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : prev));
    };

    const handleNext = () => {
        setCurrentSlideIndex((prev) => (prev < totalSlides - 1 ? prev + 1 : prev));
    };

    const currentSlide = carouselData.slides[currentSlideIndex];

    // Encode the source URL for the "Recriar Post" link
    const recreateUrl = sourceUrl
        ? `/criar-post?url=${encodeURIComponent(sourceUrl)}`
        : null;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8 bg-[#0a0a0a] text-white">
            {/* Header / Close Button */}
            <div className="absolute top-6 right-6 z-50">
                <Link
                    href="/"
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white"
                >
                    <X size={24} />
                </Link>
            </div>

            {/* Main Content Area */}
            <div className="relative w-full max-w-[1200px] flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">

                {/* Preview Container */}
                <div className="relative flex-shrink-0">
                    <div
                        className="relative overflow-hidden shadow-2xl rounded-lg border border-white/10"
                        style={{
                            width: 'min(80vw, 400px)',
                            aspectRatio: '1080/1350',
                        }}
                        ref={(el) => {
                            if (el) {
                                // Simple ResizeObserver to update width
                                const observer = new ResizeObserver((entries) => {
                                    setContainerWidth(entries[0].contentRect.width);
                                });
                                observer.observe(el);
                                return () => observer.disconnect();
                            }
                        }}
                    >
                        {/* Scaled Preview Wrapper */}
                        <div
                            style={{
                                width: '1080px',
                                height: '1350px',
                                transform: `scale(${scale || 0.1})`, // Fallback scale to avoid initial blowup
                                transformOrigin: 'top left',
                            }}
                        >
                            <LivePreview
                                slide={currentSlide}
                                carousel={carouselData}
                                slideIndex={currentSlideIndex}
                            />
                        </div>
                    </div>

                    {/* Navigation Controls */}
                    <div className="absolute top-1/2 -translate-y-1/2 -left-12 hidden md:block">
                        <button
                            onClick={handlePrev}
                            disabled={currentSlideIndex === 0}
                            className={`p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors ${currentSlideIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-100'
                                }`}
                        >
                            <ChevronLeft size={24} />
                        </button>
                    </div>

                    <div className="absolute top-1/2 -translate-y-1/2 -right-12 hidden md:block">
                        <button
                            onClick={handleNext}
                            disabled={currentSlideIndex === totalSlides - 1}
                            className={`p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors ${currentSlideIndex === totalSlides - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-100'
                                }`}
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>

                    {/* Mobile Navigation */}
                    <div className="flex items-center justify-center gap-4 mt-6 md:hidden">
                        <button
                            onClick={handlePrev}
                            disabled={currentSlideIndex === 0}
                            className={`p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors ${currentSlideIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-100'
                                }`}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-sm font-medium font-['DM_Sans'] text-white/60">
                            {currentSlideIndex + 1} / {totalSlides}
                        </span>
                        <button
                            onClick={handleNext}
                            disabled={currentSlideIndex === totalSlides - 1}
                            className={`p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors ${currentSlideIndex === totalSlides - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-100'
                                }`}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Info & Actions */}
                <div className="flex flex-col gap-6 md:max-w-md w-full">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold font-['Sora'] mb-2">{carouselData.theme}</h1>
                        <p className="text-white/60 font-['DM_Sans']">{carouselData.style}</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        {recreateUrl ? (
                            <Link
                                href={recreateUrl}
                                className="flex items-center justify-center gap-2 w-full py-4 bg-[#8a00c4] hover:bg-[#a600eb] text-white rounded-lg font-bold font-['DM_Sans'] transition-all shadow-[0_0_20px_rgba(138,0,196,0.3)] hover:shadow-[0_0_30px_rgba(138,0,196,0.5)]"
                            >
                                <RefreshCw size={20} />
                                Recriar Post
                            </Link>
                        ) : (
                            <button
                                disabled
                                className="flex items-center justify-center gap-2 w-full py-4 bg-white/10 text-white/30 rounded-lg font-bold font-['DM_Sans'] cursor-not-allowed"
                                title="URL original não disponível"
                            >
                                <RefreshCw size={20} />
                                Recriar Post (Indisponível)
                            </button>
                        )}

                        <div className="text-xs text-center text-white/30 font-['DM_Sans'] mt-2">
                            Baseado em: {sourceUrl || 'Fonte desconhecida'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
