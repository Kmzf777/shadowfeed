import { HookLayout } from './layouts/HookLayout';
import { ContentLayout } from './layouts/ContentLayout';
import { ListLayout } from './layouts/ListLayout';
import { QuoteLayout } from './layouts/QuoteLayout';
import { CTALayout } from './layouts/CTALayout';
import { HeroLayout } from './layouts/HeroLayout';
import { ProfileCardLayout } from './layouts/ProfileCardLayout';
import { TweetHookLayout } from './layouts/TweetHookLayout';
import { TweetCardLayout } from './layouts/TweetCardLayout';
import { TweetImageCardLayout } from './layouts/TweetImageCardLayout';
import { TweetEngagementLayout } from './layouts/TweetEngagementLayout';
import { TweetCTALayout } from './layouts/TweetCTALayout';
import type { SlideData, ProfileData } from '@/types/renderer/slide.types';

const DEFAULT_PROFILE: ProfileData = {
  display_name: 'ShadowFeed',
  username: '@shadowfeed.ai',
  avatar_url: '/logoavatar.png',
  verified: true,
};

interface SlideRouterProps {
  slide: SlideData;
  profile?: ProfileData | null;
}

export function SlideRouter({ slide, profile }: SlideRouterProps) {
  const resolvedProfile = profile || DEFAULT_PROFILE;

  // 0. Tweet-thread layouts (check FIRST — layout-based)
  if (slide.layout === 'tweet-hook') return <TweetHookLayout slide={slide} profile={resolvedProfile} />;
  if (slide.layout === 'tweet-card') return <TweetCardLayout slide={slide} profile={resolvedProfile} />;
  if (slide.layout === 'tweet-image-card') return <TweetImageCardLayout slide={slide} profile={resolvedProfile} />;
  if (slide.layout === 'tweet-engagement') return <TweetEngagementLayout slide={slide} profile={resolvedProfile} />;
  if (slide.layout === 'tweet-cta') return <TweetCTALayout slide={slide} profile={resolvedProfile} />;

  // 1. Specific Layout Overrides based on `layout` property
  if (slide.layout === 'hero-image') return <HeroLayout slide={slide} />;
  // FORCE OVERRIDE: Redirect split/bento/profile to ContentLayout to avoid "cut slide" look
  if (slide.layout === 'split-left' || slide.layout === 'split-right') return <ContentLayout slide={slide} />;
  if (slide.layout === 'bento-grid') return <ContentLayout slide={slide} />;
  if (slide.layout === 'profile-card') return <ProfileCardLayout slide={slide} profile={resolvedProfile} />;
  if (slide.layout === 'article-body') return <ContentLayout slide={slide} />;

  // 2. Role-based defaults
  switch (slide.role) {
    case 'hook':
      return <HookLayout slide={slide} />;
    case 'pattern-interrupt':
      if (slide.layout === 'headline-only') return <HookLayout slide={slide} />;
      if (slide.layout === 'quote-attribution') return <QuoteLayout slide={slide} />;
      return <ContentLayout slide={slide} />;
    case 'cta':
      return <CTALayout slide={slide} />;
    case 'quote':
      return <QuoteLayout slide={slide} />;
    case 'conflict':
      if (slide.layout === 'quote-attribution') return <QuoteLayout slide={slide} />;
      return <ContentLayout slide={slide} />;
    case 'conclusion':
      return <ContentLayout slide={slide} />;
    case 'list':
      return <ListLayout slide={slide} />;
    case 'engagement':
      return <TweetEngagementLayout slide={slide} profile={resolvedProfile} />;
    case 'tutorial':
    case 'comparison':
    case 'showcase':
    case 'content':
    default:
      if (slide.layout === 'numbered-item') {
        return <ListLayout slide={slide} />;
      }
      return <ContentLayout slide={slide} />;
  }
}
