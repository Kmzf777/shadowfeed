import { Headline } from '../primitives/Headline';
import { BodyText } from '../primitives/BodyText';
import type { SlideData } from '@/types/renderer/slide.types';

interface CTALayoutProps {
  slide: SlideData;
}

export function CTALayout({ slide }: CTALayoutProps) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      {/* Top accent line */}
      {(slide.decorative_elements || []).includes('top-line-accent') && (
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 80,
            height: 4,
            backgroundColor: slide.accent_color,
            borderRadius: 2,
          }}
        />
      )}

      {slide.icon && (
        <span style={{ fontSize: 56, marginBottom: 24, display: 'block' }}>
          {slide.icon}
        </span>
      )}

      <Headline
        text={slide.headline}
        fontFamily={slide.font_headline}
        fontSize={slide.font_size_headline}
        fontWeight={slide.font_weight_headline}
        color={slide.text_color}
        align="center"
        accentColor={slide.accent_color}
      />

      {(slide.body_markdown || slide.body) && (
        <div style={{ marginTop: 28 }}>
          <BodyText
            text={slide.body_markdown || slide.body || ''}
            fontFamily={slide.font_body}
            fontSize={slide.font_size_body}
            color={slide.text_color + 'bb'}
            align="center"
            isMarkdown={!!slide.body_markdown}
            accentColor={slide.accent_color}
          />
        </div>
      )}

      {/* Bottom gradient fade */}
      {(slide.decorative_elements || []).includes('bottom-gradient-fade') && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 120,
            background: `linear-gradient(to top, ${slide.accent_color}22, transparent)`,
          }}
        />
      )}
    </div>
  );
}
