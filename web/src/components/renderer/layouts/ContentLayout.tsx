import { Headline } from '../primitives/Headline';
import { BodyText } from '../primitives/BodyText';
import { Divider } from '../primitives/Divider';


import { ImagePlaceholder } from '../primitives/ImagePlaceholder';
import { NumberBadge } from '../primitives/NumberBadge';
import type { SlideData } from '@/types/renderer/slide.types';
import { getAdaptiveBodySize, getAdaptiveHeadlineSize } from '@/lib/renderer/typography';

interface ContentLayoutProps {
  slide: SlideData;
}

export function ContentLayout({ slide }: ContentLayoutProps) {
  const hasImage = slide.image && slide.image.url;
  const adaptiveHeadlineSize = getAdaptiveHeadlineSize(slide.headline);
  const adaptiveBodySize = getAdaptiveBodySize(slide.body_markdown || slide.body || '');

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: hasImage ? 'flex-start' : 'center',
        paddingTop: hasImage ? 20 : 0,
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
        fontSize={adaptiveHeadlineSize}
        fontWeight={slide.font_weight_headline}
        color={slide.text_color}
        align={slide.text_align}
        accentColor={slide.accent_color}
      />

      {(slide.decorative_elements || []).includes('divider-line') && (
        <Divider color={slide.accent_color} />
      )}

      {(slide.body_markdown || slide.body) && (
        <div style={{ marginTop: 24 }}>
          <BodyText
            text={slide.body_markdown || slide.body || ''}
            fontFamily={slide.font_body}
            fontSize={adaptiveBodySize}
            color={slide.text_color + 'cc'}
            align={slide.text_align}
            isMarkdown={true}
            accentColor={slide.accent_color}
          />
        </div>
      )}

      {/* Image below content in 16:9 aspect ratio, cropped to fill */}
      {hasImage && (
        <div
          style={{
            marginTop: 'auto',
            width: '100%',
            aspectRatio: '16 / 9',
            overflow: 'hidden',
            borderRadius: 0,
            position: 'relative',
          }}
        >
          <ImagePlaceholder image={slide.image} width="100%" height="100%" borderRadius={0} bgColor={slide.bg_color} />
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
