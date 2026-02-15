import { ImagePlaceholder } from '../primitives/ImagePlaceholder';
import { TweetProfileHeader } from '../primitives/TweetProfileHeader';
import type { SlideData, ProfileData } from '@/types/renderer/slide.types';

interface TweetHookLayoutProps {
  slide: SlideData;
  profile?: ProfileData;
}

export function TweetHookLayout({ slide, profile }: TweetHookLayoutProps) {
  const hasImage = slide.image && slide.image.url;
  const accentColor = slide.accent_color || '#8a00c4';

  // Parse **bold** in headline for accent highlights
  const renderHeadline = (text: string) => {
    if (!text.includes('**')) {
      return (
        <h1
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: slide.font_size_headline || '72px',
            fontWeight: 800,
            color: '#FFFFFF',
            lineHeight: 1.1,
            margin: 0,
            textTransform: 'uppercase',
            textAlign: 'left',
          }}
        >
          {text}
        </h1>
      );
    }

    const htmlContent = text.replace(
      /\*\*(.*?)\*\*/g,
      `<span style="color: ${accentColor}; font-weight: 900;">$1</span>`
    );

    return (
      <h1
        style={{
          fontFamily: '"Inter", sans-serif',
          fontSize: slide.font_size_headline || '72px',
          fontWeight: 800,
          color: '#FFFFFF',
          lineHeight: 1.1,
          margin: 0,
          textTransform: 'uppercase',
          textAlign: 'left',
        }}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
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
            <ImagePlaceholder
              image={slide.image}
              width="100%"
              height="100%"
              borderRadius={0}
              bgColor={slide.bg_color}
              showLabel={false}
            />
          </div>

          {/* Heavy gradient overlay — dark at bottom for text */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1,
              background: 'rgba(0,0,0,0.2)',
            }}
          />
        </>
      )}

      {/* Content layer */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '60px 60px 80px 60px',
        }}
      >
        {/* Profile Header (if profile data exists) */}
        {profile && (
          <div style={{ marginBottom: 24 }}>
            <TweetProfileHeader profile={profile} accentColor={accentColor} />
          </div>
        )}

        {/* Category label pill */}

        {/* Main headline */}
        {renderHeadline(slide.headline)}

        {/* Subtitle — "SEGUE O FIO >>>>>>>>" */}
        {slide.subtitle && (
          <div
            style={{
              marginTop: 24,
              fontFamily: '"Inter", sans-serif',
              fontSize: 20,
              fontWeight: 600,
              color: accentColor,
              textAlign: 'left',
              letterSpacing: '1px',
            }}
          >
            {slide.subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
