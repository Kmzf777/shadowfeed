import { Headline } from '../primitives/Headline';
import { BodyText } from '../primitives/BodyText';
import { ImagePlaceholder } from '../primitives/ImagePlaceholder';
import type { SlideData, ProfileData } from '@/types/renderer/slide.types';

interface ProfileCardLayoutProps {
    slide: SlideData;
    profile?: ProfileData;
}

export function ProfileCardLayout({ slide, profile }: ProfileCardLayoutProps) {
    // Prefer profile avatar if available, otherwise fallback to slide image
    const avatarImage = profile?.avatar_url
        ? { url: profile.avatar_url, type: 'image', position: 'center' }
        : slide.image;

    return (
        <div
            style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 60,
            }}
        >
            <div
                style={{
                    width: 200,
                    height: 200,
                    marginBottom: 40,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: `4px solid ${slide.accent_color}`,
                    boxShadow: `0 0 30px ${slide.accent_color}40`,
                }}
            >
                {profile?.avatar_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={profile.avatar_url}
                        alt={profile.display_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <ImagePlaceholder image={slide.image} width="100%" height="100%" bgColor={slide.bg_color} />
                )}
            </div>

            <Headline
                text={slide.headline}
                fontFamily={slide.font_headline}
                fontSize={slide.font_size_headline}
                fontWeight={slide.font_weight_headline}
                color={slide.text_color}
                align="center"
                accentColor={slide.accent_color}
            />

            <div style={{
                marginTop: 24,
                padding: 24,
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: 12,
                borderLeft: `4px solid ${slide.accent_color}`
            }}>
                <BodyText
                    text={slide.body_markdown || slide.body || ''}
                    fontFamily={slide.font_body}
                    fontSize={slide.font_size_body}
                    color={slide.text_color}
                    align="center"
                    isMarkdown={true}
                    accentColor={slide.accent_color}
                />
            </div>

        </div>
    );
}
