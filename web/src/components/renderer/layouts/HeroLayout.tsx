import { Headline } from '../primitives/Headline';
import { ImagePlaceholder } from '../primitives/ImagePlaceholder';
import type { SlideData } from '@/types/renderer/slide.types';

interface HeroLayoutProps {
    slide: SlideData;
}

export function HeroLayout({ slide }: HeroLayoutProps) {
    return (
        <div
            style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                height: '100%',
                padding: 0,
            }}
        >
            {/* Background Image Layer */}
            {slide.image?.url && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 0,
                        opacity: 0.6,
                    }}
                >
                    <ImagePlaceholder image={slide.image} width="100%" height="100%" borderRadius={0} bgColor={slide.bg_color} showLabel={false} />
                </div>
            )}

            {/* Gradient Overlay */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1,
                    background: `linear-gradient(to bottom, transparent 0%, ${slide.bg_color} 100%)`,
                }}
            />

            {/* Content Layer */}
            <div
                style={{
                    position: 'relative',
                    zIndex: 2,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: 60,
                    paddingBottom: 120,
                }}
            >
                <Headline
                    text={slide.headline}
                    fontFamily={slide.font_headline}
                    fontSize={slide.font_size_headline}
                    fontWeight={slide.font_weight_headline}
                    color={slide.text_color}
                    align="center"
                    accentColor={slide.accent_color}
                    isHook={slide.role === 'hook'}
                />
            </div>

            {/* Bottom Accent */}
            {(slide.decorative_elements || []).includes('bottom-gradient-fade') && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 10,
                        background: slide.accent_color,
                        zIndex: 3,
                        boxShadow: `0 0 20px ${slide.accent_color}`,
                    }}
                />
            )}
        </div>
    );
}
