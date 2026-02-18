import { BodyText } from '../primitives/BodyText';
import type { SlideData, ProfileData } from '@/types/renderer/slide.types';

interface TweetCTALayoutProps {
  slide: SlideData;
  profile: ProfileData;
}

export function TweetCTALayout({ slide, profile }: TweetCTALayoutProps) {
  const accentColor = slide.accent_color || '#8a00c4';
  const textColor = slide.text_color || '#0F1419';

  // Defensive checks for missing profile data
  const displayName = profile?.display_name || 'ShadowFeed';
  const username = profile?.username || '@shadowfeed.ai';
  const avatarUrl = profile?.avatar_url;
  const isVerified = profile?.verified ?? false;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '80px 72px',
        textAlign: 'center',
      }}
    >
      {/* Large avatar */}
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundColor: '#333',
          marginBottom: 24,
          border: `4px solid ${accentColor}`,
          boxShadow: `0 0 24px ${accentColor}40`,
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(135deg, ${accentColor}, #333)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 48,
              fontWeight: 700,
              fontFamily: `"${slide.font_body || 'Inter'}", sans-serif`,
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Display name + verified */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span
          style={{
            fontFamily: `"${slide.font_body || 'Inter'}", sans-serif`,
            fontSize: 28,
            fontWeight: 700,
            color: textColor,
          }}
        >
          {displayName}
        </span>

        {isVerified && (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="12" fill={accentColor} />
            <path d="M9.5 12.5L11 14L15 10" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Username */}
      <span
        style={{
          fontFamily: `"${slide.font_body || 'Inter'}", sans-serif`,
          fontSize: 20,
          fontWeight: 400,
          color: '#536471',
          marginBottom: 40,
        }}
      >
        {username}
      </span>

      {/* Headline CTA */}
      <h2
        style={{
          fontFamily: `"${slide.font_headline || 'Inter'}", sans-serif`,
          fontSize: slide.font_size_headline || '40px',
          fontWeight: 700,
          color: textColor,
          lineHeight: 1.3,
          margin: '0 0 24px 0',
          textAlign: 'center',
        }}
        dangerouslySetInnerHTML={{
          __html: slide.headline.replace(
            /\*\*(.*?)\*\*/g,
            `<span style="color: #000000; font-weight: 900; text-transform: uppercase;">$1</span>`
          )
        }}
      />

      {/* Body text */}
      {(slide.body_markdown || slide.body) && (
        <div style={{ maxWidth: 800 }}>
          <BodyText
            text={slide.body_markdown || slide.body || ''}
            fontFamily={slide.font_body || 'Inter'}
            fontSize={slide.font_size_body || '24px'}
            color={textColor}
            align="center"
            isMarkdown={true}
            accentColor={accentColor}
          />
        </div>
      )}

      {/* Follow button */}
      <div
        style={{
          marginTop: 40,
          backgroundColor: accentColor,
          borderRadius: 32,
          paddingLeft: 48,
          paddingRight: 48,
          paddingTop: 16,
          paddingBottom: 16,
        }}
      >
        <span
          style={{
            fontFamily: `"${slide.font_body || 'Inter'}", sans-serif`,
            fontSize: 22,
            fontWeight: 700,
            color: '#000000',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          SEGUIR
        </span>
      </div>
    </div>
  );
}
