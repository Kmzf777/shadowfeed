import { Headline } from '../primitives/Headline';
import { BodyText } from '../primitives/BodyText';
import type { SlideData } from '@/types/renderer/slide.types';
import { getAdaptiveBodySize, getAdaptiveHeadlineSize } from '@/lib/renderer/typography';

interface QuoteLayoutProps {
  slide: SlideData;
}

export function QuoteLayout({ slide }: QuoteLayoutProps) {
  const adaptiveHeadlineSize = getAdaptiveHeadlineSize(slide.headline);
  const adaptiveBodySize = getAdaptiveBodySize(slide.body_markdown || slide.body || '');

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: slide.text_align === 'center' ? 'center' : 'flex-start',
      }}
    >
      {/* Decorative quote mark */}
      <span
        style={{
          fontSize: 120,
          lineHeight: 0.6,
          color: slide.accent_color,
          opacity: 0.3,
          fontFamily: 'Georgia, serif',
          display: 'block',
          marginBottom: 24,
        }}
      >
        "
      </span>

      <Headline
        text={slide.headline}
        fontFamily={slide.font_headline}
        fontSize={adaptiveHeadlineSize}
        fontWeight={slide.font_weight_headline}
        color={slide.text_color}
        align={slide.text_align}
        accentColor={slide.accent_color}
      />

      {(slide.body_markdown || slide.body) && (
        <div style={{ marginTop: 32 }}>
          <BodyText
            text={slide.body_markdown || slide.body || ''}
            fontFamily={slide.font_body}
            fontSize={adaptiveBodySize}
            color={slide.text_color + '99'}
            align={slide.text_align}
            isMarkdown={!!slide.body_markdown}
            accentColor={slide.accent_color}
          />
        </div>
      )}
    </div>
  );
}
