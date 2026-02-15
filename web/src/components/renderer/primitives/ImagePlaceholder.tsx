'use client';

import { useState } from 'react';
import type { SlideData } from '@/types/renderer/slide.types';
import { isLightColor, adjustColor } from '@/lib/renderer/colors';

interface ImagePlaceholderProps {
    image?: SlideData['image'];
    width?: string | number;
    height?: string | number;
    borderRadius?: number;
    bgColor?: string;
    /** When false, hides the prompt text and badge (useful for background layers) */
    showLabel?: boolean;
}



export function ImagePlaceholder({
    image,
    width = '100%',
    height = '100%',
    borderRadius = 16,
    bgColor,
    showLabel = true,
}: ImagePlaceholderProps) {
    const [imgLoaded, setImgLoaded] = useState(false);

    if (!image) return null;

    // Derive checkerboard colors from the slide background for seamless blending.
    // If no bgColor, fall back to neutral dark.
    const light = bgColor ? isLightColor(bgColor) : false;
    const base = bgColor || '#1a1a1a';

    // Subtle shift: ±12 units from the base color creates a low-contrast checkerboard
    const checkerBg = adjustColor(base, light ? -15 : 10);
    const checkerFg = adjustColor(base, light ? -25 : 20);
    const borderColor = light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
    const textColor = light ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)';
    const badgeBg = light ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
    const badgeText = light ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)';

    // Container always renders the checkerboard as a base layer.
    // If image URL exists, <img> renders on top and hides the checkerboard once loaded.
    return (
        <div
            style={{
                width,
                height,
                backgroundColor: checkerBg,
                backgroundImage: `
          linear-gradient(45deg, ${checkerFg} 25%, transparent 25%, transparent 75%, ${checkerFg} 75%, ${checkerFg}),
          linear-gradient(45deg, ${checkerFg} 25%, transparent 25%, transparent 75%, ${checkerFg} 75%, ${checkerFg})
        `,
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 10px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius,
                border: `1px solid ${borderColor}`,
                position: 'relative',
                overflow: 'hidden',
                color: textColor,
                flexDirection: 'column',
                padding: showLabel ? 24 : 0,
                textAlign: 'center',
            }}
        >
            {/* Actual image renders on top when URL exists */}
            {image.url && (
                <img
                    src={image.url}
                    alt=""
                    onLoad={() => setImgLoaded(true)}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius,
                        display: 'block',
                        zIndex: 2,
                        // Hide broken image icon: make it invisible until loaded
                        opacity: imgLoaded ? 1 : 0,
                    }}
                />
            )}

            {/* Placeholder labels – hidden when image loaded or showLabel is false */}
            {showLabel && !imgLoaded && (
                <>
                    <div style={{ fontSize: 32, marginBottom: 12, zIndex: 1 }}>🖼️</div>
                    <div style={{ fontSize: 12, opacity: 0.7, maxWidth: '80%', zIndex: 1 }}>
                        {image.prompt || 'Image Placeholder'}
                    </div>
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 8,
                            right: 8,
                            backgroundColor: badgeBg,
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: 10,
                            color: badgeText,
                            zIndex: 1,
                        }}
                    >
                        ID: {image.type}
                    </div>
                </>
            )}
        </div>
    );
}
