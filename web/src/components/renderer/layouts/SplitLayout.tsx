import { Headline } from '../primitives/Headline';
import { BodyText } from '../primitives/BodyText';
import { ImagePlaceholder } from '../primitives/ImagePlaceholder';
import type { SlideData } from '@/types/renderer/slide.types';
import { getAdaptiveBodySize, getAdaptiveHeadlineSize } from '@/lib/renderer/typography';

interface SplitLayoutProps {
    slide: SlideData;
}

export function SplitLayout({ slide }: SplitLayoutProps) {
    const isRight = slide.layout === 'split-right';
    const adaptiveHeadlineSize = getAdaptiveHeadlineSize(slide.headline);
    const adaptiveBodySize = getAdaptiveBodySize(slide.body_markdown || slide.body || '', 'split');

    return (
        <div
            style={{
                flex: 1,
                display: 'flex',
                flexDirection: isRight ? 'row-reverse' : 'row',
                height: '100%',
            }}
        >
            <div style={{ flex: 1, padding: 60, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Headline
                    text={slide.headline}
                    fontFamily={slide.font_headline}
                    fontSize={adaptiveHeadlineSize}
                    fontWeight={slide.font_weight_headline}
                    color={slide.text_color}
                    align="left"
                    accentColor={slide.accent_color}
                />
                {slide.body_markdown && (
                    <div style={{ marginTop: 24 }}>
                        <BodyText
                            text={slide.body_markdown}
                            fontFamily={slide.font_body}
                            fontSize={adaptiveBodySize}
                            color={slide.text_color + 'dd'}
                            align="left"
                            isMarkdown={true}
                            accentColor={slide.accent_color}
                        />
                    </div>
                )}
                {slide.body && !slide.body_markdown && (
                    <div style={{ marginTop: 24 }}>
                        <BodyText
                            text={slide.body}
                            fontFamily={slide.font_body}
                            fontSize={adaptiveBodySize}
                            color={slide.text_color + 'dd'}
                            align="left"
                        />
                    </div>
                )}
            </div>

            {/* Image side — fills entire half, no padding, image covers via object-fit */}
            <div style={{
                flex: 1,
                position: 'relative',
                overflow: 'hidden',
            }}>
                <ImagePlaceholder image={slide.image} width="100%" height="100%" borderRadius={0} bgColor={slide.bg_color} />

                {/* Decoration */}
                <div style={{
                    position: 'absolute',
                    top: 40,
                    right: 40,
                    width: 40,
                    height: 40,
                    borderTop: `4px solid ${slide.accent_color}`,
                    borderRight: `4px solid ${slide.accent_color}`,
                    opacity: 0.8
                }} />
            </div>
        </div>
    );
}
