import { Headline } from '../primitives/Headline';
import { BodyText } from '../primitives/BodyText';
import { Divider } from '../primitives/Divider';
import { NumberBadge } from '../primitives/NumberBadge';
import { ImagePlaceholder } from '../primitives/ImagePlaceholder';
import type { SlideData } from '@/types/renderer/slide.types';
import { getAdaptiveBodySize, getAdaptiveHeadlineSize } from '@/lib/renderer/typography';

interface ArticleLayoutProps {
  slide: SlideData;
}

/**
 * ArticleLayout — 3-zone editorial composition
 * 
 * Supports image positions:
 * - 'inline': Headline → Image → Body (reference @brandsdecoded style)
 * - 'top': Image → Headline → Body
 * - 'bottom': Headline → Body → Image (legacy default)
 * - 'background': Not used in ArticleLayout (use HeroLayout)
 * 
 * Supports aspect ratios: 16:9, 4:5, 1:1
 */
export function ArticleLayout({ slide }: ArticleLayoutProps) {
  const hasImage = slide.image && (slide.image.url || slide.image.prompt);
  const imagePosition = slide.image?.position || 'inline';
  const imageAspectRatio = slide.image?.aspect_ratio || '16:9';
  const adaptiveHeadlineSize = getAdaptiveHeadlineSize(slide.headline);
  const adaptiveBodySize = getAdaptiveBodySize(slide.body_markdown || slide.body || '');

  // Calculate image height based on aspect ratio
  // Slide width is 1080px, padding is 60px each side = 960px content width
  const contentWidth = 960;
  const getImageHeight = (): number => {
    switch (imageAspectRatio) {
      case '16:9': return Math.round(contentWidth * (9 / 16)); // ~540px
      case '4:5': return Math.round(contentWidth * (5 / 4));   // ~1200px — clamp to 500
      case '1:1': return contentWidth;                          // 960px — clamp to 500
      default: return Math.round(contentWidth * (9 / 16));
    }
  };

  // Clamp image height to prevent overflow
  const rawImageHeight = getImageHeight();
  const imageHeight = Math.min(rawImageHeight, 500);

  // Render image block
  const renderImage = () => {
    if (!hasImage) return null;
    return (
      <div
        style={{
          width: '100%',
          height: imageHeight,
          overflow: 'hidden',
          borderRadius: 12,
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <ImagePlaceholder image={slide.image} width="100%" height="100%" borderRadius={12} bgColor={slide.bg_color} />
      </div>
    );
  };

  // Render headline block
  const renderHeadline = () => (
    <>
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
        fontSize={adaptiveHeadlineSize}
        fontWeight={slide.font_weight_headline}
        color={slide.text_color}
        align={slide.text_align}
        accentColor={slide.accent_color}
      />
      {slide.subtitle && (
        <div
          style={{
            marginTop: 12,
            fontFamily: `"${slide.font_body}", sans-serif`,
            fontSize: '20px',
            fontWeight: 500,
            color: slide.accent_color,
            textAlign: slide.text_align,
            letterSpacing: '0.5px',
          }}
        >
          {slide.subtitle}
        </div>
      )}
    </>
  );

  // Render body text block
  const renderBody = () => {
    if (!slide.body_markdown && !slide.body) return null;
    return (
      <div style={{ overflow: 'hidden' }}>
        <BodyText
          text={slide.body_markdown || slide.body || ''}
          fontFamily={slide.font_body}
          fontSize={hasImage ? adaptiveBodySize : adaptiveBodySize}
          color={slide.text_color + 'dd'}
          align={slide.text_align}
          isMarkdown={true}
          accentColor={slide.accent_color}
        />
      </div>
    );
  };

  // Layout composition based on image position
  const renderContent = () => {
    if (!hasImage) {
      // No image — simple headline + divider + body
      return (
        <>
          {renderHeadline()}
          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <Divider color={slide.accent_color} />
          </div>
          {renderBody()}
        </>
      );
    }

    switch (imagePosition) {
      case 'inline':
        // 3-zone: Headline → Image → Body (reference style)
        return (
          <>
            {renderHeadline()}
            <div style={{ marginTop: 24, marginBottom: 24 }}>
              {renderImage()}
            </div>
            {renderBody()}
          </>
        );

      case 'top':
        // Image → Headline → Body
        return (
          <>
            {renderImage()}
            <div style={{ marginTop: 24 }}>
              {renderHeadline()}
            </div>
            <div style={{ marginTop: 16 }}>
              {renderBody()}
            </div>
          </>
        );

      case 'bottom':
      default:
        // Headline → Body → Image (legacy)
        return (
          <>
            {renderHeadline()}
            <div style={{ marginTop: 20, marginBottom: 20 }}>
              <Divider color={slide.accent_color} />
            </div>
            {renderBody()}
            <div style={{ marginTop: 'auto' }}>
              {renderImage()}
            </div>
          </>
        );
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        paddingTop: 20,
      }}
    >
      {renderContent()}

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
