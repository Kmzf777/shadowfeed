
'use client';

import { useEffect } from 'react';
import { SlideData } from '@/types/renderer/slide.types';
import { SlideFrame } from '@/components/renderer/primitives/SlideFrame';
import { SlideRouter } from '@/components/renderer/SlideRouter';
import Link from 'next/link';
import { GeneratedPost } from '@/types';

function useLoadFont(fontName: string | undefined) {
    useEffect(() => {
        if (!fontName) return;
        const existing = document.querySelector(`link[data-font="${fontName}"]`);
        if (existing) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.dataset.font = fontName;
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700;800;900&display=swap`;
        document.head.appendChild(link);
    }, [fontName]);
}

interface PostThumbnailProps {
    post: GeneratedPost;
    scale?: number;
    withLink?: boolean;
    clean?: boolean; // New prop to remove card styling (rounded, shadow, etc)
}

export function PostThumbnail({ post, scale = 0.15, withLink = true, clean = false }: PostThumbnailProps) {
    const firstSlide = post.slides?.[0] as unknown as SlideData | undefined;

    // Extract profile from content_json (runtime property) or construct from branding
    const content = (post as unknown as { content_json?: any }).content_json;
    const branding = content?.branding || null;
    const profile = content?.profile || (branding ? {
        display_name: branding.name,
        username: branding.handle,
        avatar_url: '/logoavatar.png',
        verified: true
    } : undefined);

    useLoadFont(firstSlide?.font_headline);
    useLoadFont(firstSlide?.font_body);

    if (!firstSlide) return null;

    // Default 1080x1350
    const w = 1080;
    const h = 1350;

    const containerClasses = clean
        ? "relative overflow-hidden transition-transform group-hover:scale-105 origin-center"
        : "relative overflow-hidden rounded-[3px] shadow-sm border border-[#1e1e1e] transition-transform group-hover:scale-105 group-hover:border-[#8a00c4]/50";

    const Content = (
        <div className={containerClasses}
            style={{
                width: w * scale,
                height: h * scale,
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: w,
                    height: h,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    pointerEvents: 'none',
                }}
            >
                <div style={{ transform: 'scale(1)', width: '100%', height: '100%' }}>
                    <SlideFrame
                        bgColor={firstSlide.bg_color}
                        bgGradient={firstSlide.bg_gradient}
                        branding={branding}
                        accentColor={firstSlide.accent_color}
                        textColor={firstSlide.text_color}
                        fontBody={firstSlide.font_body}
                    >
                        <SlideRouter
                            slide={firstSlide}
                            profile={profile}
                        />
                    </SlideFrame>
                </div>
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>
    );

    if (withLink) {
        return (
            <Link href={`/posts/${post.id}`} className="group relative block flex-none">
                {Content}
                <p className="mt-2 text-xs text-[#808080] truncate w-[160px] group-hover:text-[#d4d4d4] transition-colors font-mono">
                    {post.theme || 'Untitled Post'}
                </p>
            </Link>
        );
    }

    return (
        <div className="group relative block flex-none">
            {Content}
        </div>
    );
}
