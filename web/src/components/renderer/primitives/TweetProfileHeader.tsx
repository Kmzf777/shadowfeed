import type { ProfileData } from '@/types/renderer/slide.types';

interface TweetProfileHeaderProps {
  profile: ProfileData;
  accentColor: string;
  textColor?: string;
  secondaryTextColor?: string;
  fontFamily?: string;
}

export function TweetProfileHeader({
  profile,
  accentColor,
  textColor = '#0F1419',
  secondaryTextColor = '#536471',
  fontFamily = 'Inter'
}: TweetProfileHeaderProps) {
  // Defensive checks for missing profile data
  const displayName = profile?.display_name || 'ShadowFeed';
  const username = profile?.username || '@shadowfeed.ai';
  const avatarUrl = profile?.avatar_url;
  const isVerified = profile?.verified ?? false;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
      }}
    >
      {/* Avatar circle */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundColor: '#333',
          flexShrink: 0,
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
              fontSize: 22,
              fontWeight: 700,
              fontFamily: `"${fontFamily}", sans-serif`,
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name + handle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Display name */}
          <span
            style={{
              fontFamily: `"${fontFamily}", sans-serif`,
              fontSize: 20,
              fontWeight: 700,
              color: textColor,
              lineHeight: 1.2,
            }}
          >
            {displayName}
          </span>

          {/* Verified badge */}
          {isVerified && (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="12" fill="#1DA1F2" />
              <path
                d="M9.5 12.5L11 14L15 10"
                stroke="#000"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        {/* Username/handle */}
        <span
          style={{
            fontFamily: `"${fontFamily}", sans-serif`,
            fontSize: 16,
            fontWeight: 400,
            color: secondaryTextColor,
            lineHeight: 1.2,
          }}
        >
          {username}
        </span>
      </div>
    </div>
  );
}
