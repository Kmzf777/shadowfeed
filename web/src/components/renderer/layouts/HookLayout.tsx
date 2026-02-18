import { Headline } from '../primitives/Headline';
import { BodyText } from '../primitives/BodyText';
import { ImagePlaceholder } from '../primitives/ImagePlaceholder';
import type { SlideData } from '@/types/renderer/slide.types';

interface HookLayoutProps {
  slide: SlideData;
}

export function HookLayout({ slide }: HookLayoutProps) {
  const hasImage = slide.image && slide.image.url;
  const textAlign = slide.text_align || 'center';
  const alignItems = textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center';

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: alignItems,
        textAlign: textAlign,
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
              // Expand beyond parent padding if necessary, but parent uses overflow hidden
              // Since SlideFrame adds padding to the container, we might want the image to be full bleed?
              // Currently HookLayout is a child of SlideFrame which has padding.
              // To make image full bleed, we would need negative margins equal to padding.
              // SlideFrame default padding is 60.
              margin: -60,
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
              margin: -60,
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
          alignItems: alignItems,
          width: '100%',
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
          align={textAlign}
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
              textAlign: textAlign,
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
              align={textAlign}
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
            margin: -60,
          }}
        />
      )}
    </div>
  );
}
