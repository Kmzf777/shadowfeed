'use client';

import { useEffect, useRef, useState } from 'react';
import { PostThumbnail } from './PostThumbnail';
import { GeneratedPost } from '../types';

interface ResponsiveThumbnailProps {
    post: GeneratedPost;
    aspectRatio?: number; // Default 4/5 = 0.8
}

export function ResponsiveThumbnail({ post, aspectRatio = 4 / 5 }: ResponsiveThumbnailProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.1); // Start small to avoid flash
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const width = entry.contentRect.width;
                if (width > 0) {
                    // Base width of SlideFrame is 1080px
                    const newScale = width / 1080;
                    setScale(newScale);
                    setReady(true);
                }
            }
        });

        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={containerRef}
            className="w-full h-full relative overflow-hidden"
            style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.2s' }}
        >
            {ready && (
                <PostThumbnail
                    post={post}
                    scale={scale}
                    withLink={false}
                    clean={true}
                />
            )}
        </div>
    );
}
