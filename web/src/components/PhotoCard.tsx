'use client';

import Link from 'next/link';
import Image from 'next/image';
import { GeneratedPost } from '../types';
import { PostThumbnail } from './PostThumbnail';
import { ResponsiveThumbnail } from './ResponsiveThumbnail';

interface PhotoCardProps {
    post: GeneratedPost;
    index: number;
    customHref?: string;
}

export function PhotoCard({ post, index, customHref }: PhotoCardProps) {
    // Check if we have a pre-rendered screenshot (rendered_paths)
    // If so, we display that as the main image.
    // If not, we render the DOM-based PostThumbnail (which handles the Pexels background image internally).
    let screenshotUrl: string | null = null;

    if (post.rendered_paths?.[0]) {
        try {
            const url = new URL(post.rendered_paths[0]);
            if (url.protocol === 'http:' || url.protocol === 'https:') {
                screenshotUrl = post.rendered_paths[0];
            }
        } catch {
            // Not a valid absolute URL, check if it's a relative path starting with /
            if (post.rendered_paths[0].startsWith('/')) {
                screenshotUrl = post.rendered_paths[0];
            }
        }
    }

    return (
        <Link
            href={customHref || `/${post.id}`}
            className="group relative aspect-[4/5] bg-[#161616] rounded-[12px] overflow-hidden cursor-pointer"
            style={{
                animationDelay: `${(index % 5) * 0.08}s`,
            }}
        >
            {/* Image or DOM Preview */}
            {screenshotUrl ? (
                <Image
                    src={screenshotUrl}
                    alt={post.theme}
                    fill
                    className="object-cover opacity-100 transition-opacity duration-400"
                />
            ) : (
                // Use ResponsiveThumbnail to fit the 1080x1350 content into the container
                <ResponsiveThumbnail post={post} />
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
