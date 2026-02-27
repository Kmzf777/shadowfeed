
'use client';

import { useEffect, useState, useMemo } from 'react';
import { SlideRouter } from '@/components/renderer/SlideRouter';
import { SlideFrame } from '@/components/renderer/primitives/SlideFrame';
import { TweetFrame } from '@/components/renderer/primitives/TweetFrame';
import { CrtFrame } from '@/components/renderer/primitives/CrtFrame';
import type { SlideData, CarouselData } from '@/types/renderer/slide.types';

interface LivePreviewProps {
    slide: SlideData;
    carousel: CarouselData; // Needed for fonts, branding, etc.
    slideIndex: number;
    uploadedImage?: string | null; // URL of user uploaded image
    uploadedIsVideo?: boolean;
    themeOverride?: string; // Force a specific theme, overriding carousel.theme
}

export function LivePreview({ slide, carousel, slideIndex, uploadedImage, uploadedIsVideo, themeOverride }: LivePreviewProps) {
    const [ready, setReady] = useState(false);

    // Load fonts
    useLoadFont(carousel.fonts.headline);
    useLoadFont(carousel.fonts.body);

    useEffect(() => {
        setReady(false);
        const timeout = setTimeout(() => setReady(true), 400);
        document.fonts.ready.then(() => {
            setReady(true);
            clearTimeout(timeout);
        });
        return () => clearTimeout(timeout);
    }, [carousel.fonts.headline, carousel.fonts.body]);

    // Patch slide with uploaded image if exists
    const patchedSlide = useMemo(() => {
        if (!uploadedImage) return slide;
        return {
            ...slide,
            image: {
                ...slide.image,
                url: uploadedImage,
                is_video: uploadedIsVideo,
            }
        } as SlideData;
    }, [slide, uploadedImage, uploadedIsVideo]);

    // Logic adapted from renderer/App.tsx
    const isTweetThread = carousel.style === 'tweet-thread';
    const isFullBleed =
        patchedSlide.layout === 'hero-image' ||
        patchedSlide.layout === 'tweet-hook' ||
        patchedSlide.role === 'hook';

    const isLight = (hex: string) => {
        const c = hex.replace('#', '');
        if (c.length !== 6) return false;
        const r = parseInt(c.substring(0, 2), 16);
        const g = parseInt(c.substring(2, 4), 16);
        const b = parseInt(c.substring(4, 6), 16);
        return (r * 0.299 + g * 0.587 + b * 0.114) > 150;
    };

    const stripEmojis = (str: string | null | undefined) => {
        if (!str) return null;
        return str.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
    };

    const bgColor = patchedSlide.bg_color || '#000000';
    const bgIsLight = isLight(bgColor);

    const textColor = isTweetThread
        ? (patchedSlide.text_color || (bgIsLight ? '#0F1419' : '#FFFFFF'))
        : (bgIsLight ? '#0A0A0A' : (patchedSlide.text_color || '#ffffff'));

    let accentColor = patchedSlide.accent_color;
    if (!isTweetThread && bgIsLight && isLight(accentColor)) {
        accentColor = '#006600';
    }

    const finalSlide: SlideData = {
        ...patchedSlide,
        // Force global font usage
        font_headline: carousel.fonts.headline || 'Inter',
        font_body: carousel.fonts.body || 'Inter',
        text_color: textColor,
        accent_color: accentColor,
        icon: null,
        headline: stripEmojis(patchedSlide.headline) || '',
        body: stripEmojis(patchedSlide.body) || null,
        body_markdown: stripEmojis(patchedSlide.body_markdown) || null,
        subtitle: stripEmojis(patchedSlide.subtitle) || null,
    };

    if (isTweetThread) {
        return (
            <TweetFrame
                bgColor={finalSlide.bg_color}
                ready={ready}
                isHook={finalSlide.role === 'hook'}
                accentColor={finalSlide.accent_color}
                brandHandle={carousel.profile?.username || carousel.branding?.handle || '@shadowfeed.ai'}
                fontFamily={finalSlide.font_body}
            >
                <SlideRouter slide={finalSlide} profile={carousel.profile || null} />
            </TweetFrame>
        );
    }

    const activeTheme = themeOverride || carousel.theme;
    if (activeTheme === 'shadowfeed-brand') {
        const crtLayoutMap: Record<string, string> = {
            hook: 'crt-hook',
            context: 'crt-body',
            content: 'crt-body',
            list: 'crt-body',
            quote: 'crt-quote',
            'pattern-interrupt': 'crt-body',
            conflict: 'crt-body',
            tension: 'crt-quote',
            conclusion: 'crt-body',
            'soft-cta': 'crt-body',
            cta: 'crt-cta',
            engagement: 'crt-cta',
            tutorial: 'crt-body',
            comparison: 'crt-body',
            showcase: 'crt-body'
        };

        return (
            <CrtFrame
                ready={ready}
                branding={carousel.profile ? { name: carousel.profile.display_name, handle: carousel.profile.username } : carousel.branding}
                textColor={finalSlide.text_color}
            >
                <SlideRouter slide={finalSlide} profile={carousel.profile || null} layoutMap={crtLayoutMap} />
            </CrtFrame>
        );
    }

    return (
        <SlideFrame
            bgColor={finalSlide.bg_color}
            bgGradient={finalSlide.bg_gradient}
            ready={ready}
            branding={carousel.profile ? { name: carousel.profile.display_name, handle: carousel.profile.username } : carousel.branding}
            accentColor={finalSlide.accent_color}
            textColor={finalSlide.text_color}
            fontBody={carousel.fonts.body}
            fontHeadline={carousel.fonts.headline}
            padding={isFullBleed ? 0 : 60}
            isHook={finalSlide.role === 'hook'}
        >
            <SlideRouter slide={finalSlide} profile={carousel.profile || null} />
        </SlideFrame>
    );
}

function useLoadFont(fontName: string) {
    useEffect(() => {
        const existing = document.querySelector(`link[data-font="${fontName}"]`);
        if (existing) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.dataset.font = fontName;
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700;800;900&display=swap`;
        document.head.appendChild(link);
    }, [fontName]);
}
