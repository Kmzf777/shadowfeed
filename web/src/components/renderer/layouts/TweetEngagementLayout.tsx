import { TweetProfileHeader } from '../primitives/TweetProfileHeader';
import type { SlideData, ProfileData } from '@/types/renderer/slide.types';

interface TweetEngagementLayoutProps {
  slide: SlideData;
  profile: ProfileData;
}

export function TweetEngagementLayout({ slide, profile }: TweetEngagementLayoutProps) {
  const accentColor = slide.accent_color || '#8a00c4';
  const textColor = slide.text_color || '#0F1419';
  const engagementBg = slide.engagement_box_bg || '#000000';
  const engagementText = slide.engagement_text || 'NAO ESQUECE DE DEIXAR O SEU LIKE!';

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top section — tweet card style */}
      <div
        style={{
          flex: '0 0 auto',
          padding: '60px 72px 32px 72px',
        }}
      >
        {/* Profile header */}
        <TweetProfileHeader profile={profile} accentColor={accentColor} fontFamily={slide.font_body} />

        {/* Headline text */}
        <p
          style={{
            fontFamily: `"${slide.font_body || 'Inter'}", sans-serif`,
            fontSize: slide.font_size_body || '24px',
            fontWeight: 400,
            color: textColor,
            lineHeight: 1.5,
            margin: 0,
            wordWrap: 'break-word',
          }}
          dangerouslySetInnerHTML={{
            __html: slide.headline.replace(
              /\*\*(.*?)\*\*/g,
              `<span style="color: #000000; font-weight: 900; text-transform: uppercase;">$1</span>`
            )
          }}
        />
      </div>

      {/* Black engagement box — takes remaining space */}
      <div
        style={{
          flex: 1,
          margin: '24px 72px 72px 72px',
          backgroundColor: engagementBg,
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 48px',
        }}
      >
        <span
          style={{
            fontFamily: `"${slide.font_headline || 'Inter'}", sans-serif`,
            fontSize: 48,
            fontWeight: 800,
            color: '#FFFFFF',
            textAlign: 'center',
            lineHeight: 1.2,
            textTransform: 'uppercase',
          }}
        >
          {engagementText}
        </span>
      </div>
    </div>
  );
}
