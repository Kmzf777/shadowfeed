'use client';

import Link from 'next/link';
import Image from 'next/image';
import { GeneratedPost } from '../types';
import { PostThumbnail } from './PostThumbnail';

interface PhotoCardProps {
    post: GeneratedPost;
    index: number;
}

export function PhotoCard({ post, index }: PhotoCardProps) {
    // Determine the dominant slide for thumbnail (usually first slide or hook slide)
    const slide = post.slides?.[0] as any;

    // Check if rendered path is a valid URL (http/https) or relative path, not a local file path
    let bgImage = slide?.image?.url || null;

    if (post.rendered_paths?.[0]) {
        try {
            const url = new URL(post.rendered_paths[0]);
            if (url.protocol === 'http:' || url.protocol === 'https:') {
                bgImage = post.rendered_paths[0];
            }
        } catch {
            // Not a valid absolute URL, check if it's a relative path starting with /
            if (post.rendered_paths[0].startsWith('/')) {
                bgImage = post.rendered_paths[0];
            }
            // Otherwise ignore local file paths (c:\...) to prevent crash
        }
    }

    return (
        <Link
            href={`/posts/${post.id}`}
            className="group relative aspect-[4/5] bg-[#161616] rounded-[12px] overflow-hidden cursor-pointer"
            style={{
                animationDelay: `${(index % 5) * 0.08}s`,
            }}
        >
            {/* Image or DOM Preview */}
            {bgImage ? (
                <Image
                    src={bgImage}
                    alt={post.theme}
                    fill
                    className="object-cover opacity-100 transition-opacity duration-400"
                />
            ) : (
                // Use DOM-based preview if no image available (instead of shimmer)
                <div className="absolute inset-0 w-full h-full transform scale-[0.35] origin-top-left" style={{ width: '286%', height: '286%' }}>
                    <PostThumbnail post={post} scale={1} withLink={false} />
                </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Badge */}
            <div className="absolute top-3 left-3">
                <span className="px-2 py-1 rounded-md bg-[#8a00c4]/20 backdrop-blur-md text-white/90 text-xs font-medium font-['DM_Sans']">
                    {post.style}
                </span>
            </div>
        </Link>
    );
}
