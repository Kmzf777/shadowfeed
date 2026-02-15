import { Headline } from '../primitives/Headline';
import { BodyText } from '../primitives/BodyText';
import { NumberBadge } from '../primitives/NumberBadge';
import type { SlideData } from '@/types/renderer/slide.types';

interface ListLayoutProps {
  slide: SlideData;
}

export function ListLayout({ slide }: ListLayoutProps) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      {slide.number_label && (
        <NumberBadge
          label={slide.number_label}
          accentColor={slide.accent_color}
          fontFamily={slide.font_headline}
        />
      )}

      <Headline
        text={slide.headline}
        fontFamily={slide.font_headline}
        fontSize={slide.font_size_headline}
        fontWeight={slide.font_weight_headline}
        color={slide.text_color}
        align={slide.text_align}
        accentColor={slide.accent_color}
      />

      {(slide.body_markdown || slide.body) && (
        <div style={{ marginTop: 20 }}>
          <BodyText
            text={slide.body_markdown || slide.body || ''}
            fontFamily={slide.font_body}
            fontSize={slide.font_size_body}
            color={slide.text_color + 'cc'}
            align={slide.text_align}
            isMarkdown={!!slide.body_markdown}
            accentColor={slide.accent_color}
          />
        </div>
      )}

      {/* Side bar accent */}
      {(slide.decorative_elements || []).includes('side-bar-accent') && (
        <div
          style={{
            position: 'absolute',
            left: 30,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 4,
            height: 200,
            backgroundColor: slide.accent_color,
            borderRadius: 2,
          }}
        />
      )}
    </div>
  );
}
