import { Headline } from '../primitives/Headline';
import { BodyText } from '../primitives/BodyText';
import type { SlideData } from '@/types/renderer/slide.types';

interface BentoLayoutProps {
    slide: SlideData;
}

export function BentoLayout({ slide }: BentoLayoutProps) {
    // Bento expects content to be parsed from body_markdown possibly?
    // For now, let's assume body_markdown contains a list, and we can split it.
    // Or we create a generic 4-quadrant grid if specific data isn't structured yet.

    // Simple implementation: Headline Top, then Grid

    return (
        <div
            style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: 60,
            }}
        >
            <div style={{ marginBottom: 40 }}>
                <Headline
                    text={slide.headline}
                    fontFamily={slide.font_headline}
                    fontSize={slide.font_size_headline}
                    fontWeight={slide.font_weight_headline}
                    color={slide.text_color}
                    align="left"
                    accentColor={slide.accent_color}
                />
            </div>

            <div
                style={{
                    flex: 1,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gridTemplateRows: '1fr 1fr',
                    gap: 20,
                }}
            >
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            borderRadius: 16,
                            border: '1px solid rgba(255,255,255,0.1)',
                            padding: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <span style={{ color: slide.text_color, opacity: 0.5, fontFamily: slide.font_body }}>
                            Item {i} (Placeholder)
                        </span>
                    </div>
                ))}
            </div>

            {slide.body_markdown && (
                <div style={{ marginTop: 24 }}>
                    <BodyText
                        text={slide.body_markdown}
                        fontFamily={slide.font_body}
                        fontSize="20px"
                        color={slide.text_color + 'aa'}
                        align="left"
                        isMarkdown={true}
                        accentColor={slide.accent_color}
                    />
                </div>
            )}
        </div>
    );
}
