'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';
import { LivePreview } from '@/components/LivePreview';
import type { CarouselData, SlideData } from '@/types/renderer/slide.types';

interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    carouselData: CarouselData; // Contains slides and other metadata
    uploads: Record<number, string>;
}

export function PreviewModal({ isOpen, onClose, carouselData, uploads }: PreviewModalProps) {
    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

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
                        className="flex-none relative shadow-2xl"
                        style={{
                            height: '80vh',
                            aspectRatio: '1080/1350',
                            borderRadius: '16px',
                            overflow: 'hidden'
                        }}
                    >
                        {/* We use a transform scale hack to fit the 1080x1350 content into the 80vh container 
                            The container has the correct aspect ratio, but we need to render the content at reliable 1080px width 
                            and scale it down.
                        */}
                        <div className="w-full h-full relative">
                            {/* Inner Scale Wrapper */}
                            <PreviewScaleWrapper>
                                <LivePreview
                                    slide={slide}
                                    carousel={carouselData}
                                    slideIndex={index}
                                    uploadedImage={uploads[index]}
                                />
                            </PreviewScaleWrapper>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Helper to scale content to fit parent
function PreviewScaleWrapper({ children }: { children: React.ReactNode }) {
    // Hardcoded logic for simplicity: The child is always 1080x1350
    // The parent is styled by the modal to possess the correct aspect ratio 
    // We just need to scale the child to '100%' of the parent.
    // CSS 'container queries' or resize observer would be ideal, but let's use a simple ResizeObserver hook or CSS transform.

    // Actually, simpler approach: 
    // Use a fixed large container and scale it with CSS container queries or just CSS zoom/transform.
    // But since `LivePreview` expects 1080px context (fonts, padding), we MUST render at 1080px and scale down.

    return (
        <div
            style={{
                width: 1080,
                height: 1350,
                position: 'absolute',
                top: 0,
                left: 0,
                transformOrigin: 'top left',
                // We need dynamic scaling here.
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
