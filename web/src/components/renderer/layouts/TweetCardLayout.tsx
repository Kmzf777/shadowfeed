import { TweetProfileHeader } from '../primitives/TweetProfileHeader';
import { BodyText } from '../primitives/BodyText';
import type { SlideData, ProfileData } from '@/types/renderer/slide.types';

interface TweetCardLayoutProps {
  slide: SlideData;
  profile: ProfileData;
}

export function TweetCardLayout({ slide, profile }: TweetCardLayoutProps) {
  const accentColor = slide.accent_color || '#8a00c4';
  const textColor = slide.text_color || '#0F1419';

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px 72px',
      }}
    >
      {/* Profile header */}
      <TweetProfileHeader profile={profile} accentColor={accentColor} />

      {/* Headline — bold opening sentence */}
      <h2
        style={{
          fontFamily: '"Inter", sans-serif',
          fontSize: slide.font_size_headline || '40px',
          fontWeight: 700,
          color: textColor,
          lineHeight: 1.3,
          margin: '0 0 20px 0',
          wordWrap: 'break-word',
        }}
        dangerouslySetInnerHTML={{
          __html: slide.headline.replace(
            /\*\*(.*?)\*\*/g,
            `<span style="color: ${accentColor}; font-weight: 900; text-transform: uppercase;">$1</span>`
          )
        }}
      />

      {/* Body text */}
      {(slide.body_markdown || slide.body) && (
        <BodyText
          text={slide.body_markdown || slide.body || ''}
          fontFamily={slide.font_body || 'Inter'}
          fontSize={slide.font_size_body || '24px'}
          color={textColor}
          align="left"
          isMarkdown={true}
          accentColor={accentColor}
        />
      )}
    </div>
  );
}
