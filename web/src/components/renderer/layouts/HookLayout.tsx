import { Headline } from '../primitives/Headline';
import { BodyText } from '../primitives/BodyText';
import { ImagePlaceholder } from '../primitives/ImagePlaceholder';
import type { SlideData } from '@/types/renderer/slide.types';

interface HookLayoutProps {
  slide: SlideData;
}

export function HookLayout({ slide }: HookLayoutProps) {
  const hasImage = slide.image && slide.image.url;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
      }}
    >
      {/* Full-screen background image */}
      {hasImage && (
        <>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 0,
            }}
          >
            <ImagePlaceholder image={slide.image} width="100%" height="100%" borderRadius={0} bgColor={slide.bg_color} showLabel={false} />
          </div>

          {/* Gradient overlay for text readability */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1,
              background: `linear-gradient(to bottom, ${slide.bg_color}88 0%, ${slide.bg_color}cc 50%, ${slide.bg_color} 100%)`,
            }}
          />
        </>
      )}

      {/* Content layer */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Top accent line */}
        {(slide.decorative_elements || []).includes('top-line-accent') && (
          <div
            style={{
              width: 80,
              height: 4,
              backgroundColor: slide.accent_color,
              borderRadius: 2,
              marginBottom: 40,
            }}
          />
        )}

        <Headline
          text={slide.headline}
          fontFamily={slide.font_headline}
          fontSize={slide.font_size_headline}
          fontWeight={slide.font_weight_headline}
          color={slide.text_color}
          align="center"
          accentColor={slide.accent_color}
          isHook={true}
        />

        {/* Subtitle */}
        {slide.subtitle && (
          <div
            style={{
              marginTop: 20,
              fontFamily: `"${slide.font_body}", sans-serif`,
              fontSize: '20px',
              fontWeight: 500,
              color: slide.accent_color,
              textAlign: 'center',
              letterSpacing: '0.5px',
              opacity: 0.85,
            }}
          >
            {slide.subtitle}
          </div>
        )}

        {/* Optional body text */}
        {(slide.body_markdown || slide.body) && (
          <div style={{ marginTop: 24, maxWidth: 800 }}>
            <BodyText
              text={slide.body_markdown || slide.body || ''}
              fontFamily={slide.font_body}
              fontSize={slide.font_size_body}
              color={slide.text_color + 'bb'}
              align="center"
              isMarkdown={true}
              accentColor={slide.accent_color}
            />
          </div>
        )}
      </div>

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
            zIndex: 3,
          }}
        />
      )}
    </div>
  );
}
