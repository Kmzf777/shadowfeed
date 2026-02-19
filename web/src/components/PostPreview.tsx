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
        ? `/create?url=${encodeURIComponent(sourceUrl)}`
        : null;

    return (
        <>
            <style jsx global>{`
                body::before {
                    display: none !important;
                }
            `}</style>
            <div className="flex flex-col items-center justify-center min-h-screen py-12 px-8">
                {/* Header / Back Link */}
                <div className="w-full max-w-[1200px] mb-8 flex justify-between items-center">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-[#808080] hover:text-white transition-colors font-mono text-sm group"
                    >
                        <span className="group-hover:-translate-x-1 transition-transform">&lt;</span>
                        BACK_TO_FEED
                    </Link>
                    <div className="text-xs font-mono text-[#808080]">
                        MODE: PREVIEW • READ_ONLY
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="relative w-full max-w-[1200px] flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24">

                    {/* Preview Container */}
                    <div className="relative flex-shrink-0 group">
                        {/* Terminal decorative header for the preview */}
                        <div className="absolute -top-6 left-0 right-0 h-6 bg-[#161616] border-t border-x border-[#2a2a2a] rounded-t-sm flex items-center px-3 gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-[#3a3a3a]" />
                                <div className="w-2 h-2 rounded-full bg-[#3a3a3a]" />
                                <div className="w-2 h-2 rounded-full bg-[#3a3a3a]" />
                            </div>
                            <span className="text-[10px] text-[#808080] font-mono ml-2">slide_viewer.exe</span>
                        </div>

                        <div
                            className="relative overflow-hidden rounded-b-sm border border-[#2a2a2a] bg-[#000]"
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

                        {/* Navigation Controls - styled as floating buttons */}
                        <div className="absolute top-1/2 -translate-y-1/2 -left-16 hidden md:block">
                            <button
                                onClick={handlePrev}
                                disabled={currentSlideIndex === 0}
                                className={`p-4 rounded-full border border-[#2a2a2a] bg-[#0a0a0a] hover:border-[#8a00c4] hover:text-[#8a00c4] transition-all ${currentSlideIndex === 0 ? 'opacity-30 cursor-not-allowed border-transparent' : 'opacity-100'
                                    }`}
                            >
                                <ChevronLeft size={24} />
                            </button>
                        </div>

                        <div className="absolute top-1/2 -translate-y-1/2 -right-16 hidden md:block">
                            <button
                                onClick={handleNext}
                                disabled={currentSlideIndex === totalSlides - 1}
                                className={`p-4 rounded-full border border-[#2a2a2a] bg-[#0a0a0a] hover:border-[#8a00c4] hover:text-[#8a00c4] transition-all ${currentSlideIndex === totalSlides - 1 ? 'opacity-30 cursor-not-allowed border-transparent' : 'opacity-100'
                                    }`}
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>

                        {/* Mobile Navigation */}
                        <div className="flex items-center justify-center gap-6 mt-8 md:hidden">
                            <button
                                onClick={handlePrev}
                                disabled={currentSlideIndex === 0}
                                className={`p-3 rounded-full border border-[#2a2a2a] bg-[#0a0a0a] ${currentSlideIndex === 0 ? 'opacity-30' : 'active:border-[#8a00c4]'}`}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span className="text-sm font-mono text-[#808080]">
                                {currentSlideIndex + 1} / {totalSlides}
                            </span>
                            <button
                                onClick={handleNext}
                                disabled={currentSlideIndex === totalSlides - 1}
                                className={`p-3 rounded-full border border-[#2a2a2a] bg-[#0a0a0a] ${currentSlideIndex === totalSlides - 1 ? 'opacity-30' : 'active:border-[#8a00c4]'}`}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Info & Actions */}
                    <div className="flex flex-col gap-8 md:max-w-md w-full">
                        <div className="border-l-2 border-[#8a00c4] pl-6">
                            <h1 className="text-3xl md:text-4xl font-bold font-['Sora'] mb-2 text-white">{carouselData.theme}</h1>
                            <p className="text-[#808080] font-mono text-sm uppercase tracking-wide">{carouselData.style}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-[#161616] p-4 border border-[#2a2a2a]">
                                <div className="text-[10px] text-[#4a4a4a] uppercase font-mono mb-2">Metadata</div>
                                <div className="grid grid-cols-2 gap-4 text-xs font-mono text-[#d4d4d4]">
                                    <div>
                                        <span className="text-[#808080]">Slides:</span> {totalSlides}
                                    </div>
                                    <div>
                                        <span className="text-[#808080]">Format:</span> 1080x1350
                                    </div>
                                </div>
                            </div>

                            {recreateUrl ? (
                                <Link
                                    href={recreateUrl}
                                    className="group flex items-center justify-center gap-3 w-full py-4 bg-[#8a00c4] hover:bg-[#9d00de] text-white font-mono text-sm font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(138,0,196,0.2)] hover:shadow-[0_0_30px_rgba(138,0,196,0.4)]"
                                >
                                    <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                                    Recreate_Post
                                </Link>
                            ) : (
                                <button
                                    disabled
                                    className="flex items-center justify-center gap-3 w-full py-4 bg-[#161616] text-[#4a4a4a] border border-[#2a2a2a] font-mono text-sm font-bold uppercase tracking-widest cursor-not-allowed"
                                >
                                    <X size={16} />
                                    Source_Unavailable
                                </button>
                            )}

                            <div className="text-xs text-center text-[#4a4a4a] font-mono">
                                src: {sourceUrl ? <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#8a00c4] hover:underline truncate max-w-[200px] inline-block align-bottom">{sourceUrl}</a> : 'null'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
