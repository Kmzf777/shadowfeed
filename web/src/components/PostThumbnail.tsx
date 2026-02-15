
import { SlideData } from '@/types/renderer/slide.types';
import { SlideFrame } from '@/components/renderer/primitives/SlideFrame';
import { HookLayout } from '@/components/renderer/layouts/HookLayout';
import Link from 'next/link';
import { GeneratedPost } from '@/types';

interface PostThumbnailProps {
    post: GeneratedPost;
    scale?: number;
    withLink?: boolean;
}

export function PostThumbnail({ post, scale = 0.15, withLink = true }: PostThumbnailProps) {
    const firstSlide = post.slides?.[0] as unknown as SlideData | undefined;

    if (!firstSlide) return null;

    // Default 1080x1350
    const w = 1080;
    const h = 1350;

    const Content = (
        <div className="relative overflow-hidden rounded-lg shadow-lg ring-1 ring-white/10 transition-transform group-hover:scale-105 group-hover:ring-white/30"
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
                <SlideFrame
                    bgColor={firstSlide.bg_color}
                    bgGradient={firstSlide.bg_gradient}
                    branding={null}
                    accentColor={firstSlide.accent_color}
                    textColor={firstSlide.text_color}
                    fontBody={firstSlide.font_body}
                >
                    <HookLayout slide={firstSlide} />
                </SlideFrame>
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>
    );

    if (withLink) {
        return (
            <Link href={`/posts/${post.id}`} className="group relative block flex-none">
                {Content}
                <p className="mt-2 text-xs text-gray-400 truncate w-[160px] group-hover:text-white transition-colors">
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
