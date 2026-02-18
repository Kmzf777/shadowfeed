'use client';

import { X, Play, Pause } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { LivePreview } from '@/components/LivePreview';
import type { CarouselData } from '@/types/renderer/slide.types';

interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    carouselData: CarouselData;
    uploads: Record<number, string>;
    uploadTypes?: Record<number, boolean>;
}

export function PreviewModal({ isOpen, onClose, carouselData, uploads, uploadTypes = {} }: PreviewModalProps) {
    const [playingVideos, setPlayingVideos] = useState<Record<number, boolean>>({});
    const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            // Reset playing state — all videos autoPlay when modal opens
            const initial: Record<number, boolean> = {};
            carouselData.slides.forEach((_, i) => {
                if (uploadTypes[i]) initial[i] = false;
            });
            setPlayingVideos(initial);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleVideoPlayback = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const slideEl = slideRefs.current[index];
        const video = slideEl?.querySelector('video');
        if (!video) return;
        if (video.paused) {
            video.play();
            setPlayingVideos(prev => ({ ...prev, [index]: true }));
        } else {
            video.pause();
            setPlayingVideos(prev => ({ ...prev, [index]: false }));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors z-50"
            >
                <X className="w-8 h-8" />
            </button>

            {/* Scroll Container */}
            <div className="w-full h-full overflow-x-auto overflow-y-hidden flex items-center px-12 py-8 gap-8 custom-scrollbar">
                {carouselData.slides.map((slide, index) => (
                    <div
                        key={index}
                        ref={el => { slideRefs.current[index] = el; }}
                        className="flex-none relative shadow-2xl"
                        style={{
                            height: '80vh',
                            aspectRatio: '1080/1350',
                            borderRadius: '16px',
                            overflow: 'hidden'
                        }}
                    >
                        <div className="w-full h-full relative">
                            {/* Inner Scale Wrapper */}
                            <PreviewScaleWrapper>
                                <LivePreview
                                    slide={slide}
                                    carousel={carouselData}
                                    slideIndex={index}
                                    uploadedImage={uploads[index]}
                                    uploadedIsVideo={!!uploadTypes[index]}
                                />
                            </PreviewScaleWrapper>
                        </div>

                        {/* Play/Pause overlay for video slides */}
                        {uploadTypes[index] && (
                            <button
                                onClick={(e) => toggleVideoPlayback(index, e)}
                                className="absolute bottom-4 right-4 z-30 p-3 bg-black/70 rounded-full text-white hover:bg-black/90 transition-all hover:scale-110 shadow-xl"
                                title={playingVideos[index] ? 'Pause video' : 'Play video'}
                            >
                                {playingVideos[index]
                                    ? <Pause className="w-6 h-6" />
                                    : <Play className="w-6 h-6" />
                                }
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// Helper to scale content to fit parent
function PreviewScaleWrapper({ children }: { children: React.ReactNode }) {
    return (
        <div
            style={{
                width: 1080,
                height: 1350,
                position: 'absolute',
                top: 0,
                left: 0,
                transformOrigin: 'top left',
            }}
            ref={(node) => {
                if (node && node.parentElement) {
                    const update = () => {
                        const parentWidth = node.parentElement?.offsetWidth || 0;
                        const scale = parentWidth / 1080;
                        node.style.transform = `scale(${scale})`;
                    }
                    update();
                    const observer = new ResizeObserver(update);
                    observer.observe(node.parentElement);
                    return () => observer.disconnect();
                }
            }}
        >
            {children}
        </div>
    );
}
