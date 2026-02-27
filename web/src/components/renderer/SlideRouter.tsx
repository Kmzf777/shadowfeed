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
import { CrtHookLayout } from './layouts/CrtHookLayout';
import { CrtBodyLayout } from './layouts/CrtBodyLayout';
import { CrtCtaLayout } from './layouts/CrtCtaLayout';
import type { SlideData, ProfileData } from '@/types/renderer/slide.types';

const DEFAULT_PROFILE: ProfileData = {
  display_name: 'ShadowFeed',
  username: '@shadowfeed.ai',
  avatar_url: '/logoavatar.png',
  verified: true,
};

/** Mapping from SlideRole to LayoutType (from PostTheme.layoutMap) */
type LayoutMap = Partial<Record<string, string>>;

interface SlideRouterProps {
  slide: SlideData;
  profile?: ProfileData | null;
  /** Optional layoutMap for role-based layout resolution (PDCE pillar system) */
  layoutMap?: LayoutMap | null;
}

export function SlideRouter({ slide, profile, layoutMap }: SlideRouterProps) {
  const resolvedProfile = profile || DEFAULT_PROFILE;

  // Resolve layout: use layoutMap if available and slide has a universal role, otherwise use slide.layout
  const resolvedLayout = (layoutMap && slide.role && layoutMap[slide.role])
    ? layoutMap[slide.role] as SlideData['layout']
    : slide.layout;

  // Use resolved layout for routing (creates a virtual slide with resolved layout for backward compat)
  const routingSlide = resolvedLayout !== slide.layout
    ? { ...slide, layout: resolvedLayout }
    : slide;

  // 0. Tweet-thread layouts (check FIRST — layout-based)
  if (routingSlide.layout === 'tweet-hook') return <TweetHookLayout slide={routingSlide} profile={resolvedProfile} />;
  if (routingSlide.layout === 'tweet-card') return <TweetCardLayout slide={routingSlide} profile={resolvedProfile} />;
  if (routingSlide.layout === 'tweet-image-card') return <TweetImageCardLayout slide={routingSlide} profile={resolvedProfile} />;
  if (routingSlide.layout === 'tweet-engagement') return <TweetEngagementLayout slide={routingSlide} profile={resolvedProfile} />;
  if (routingSlide.layout === 'tweet-cta') return <TweetCTALayout slide={routingSlide} profile={resolvedProfile} />;

  // 0.5. CRT layouts (check FIRST — layout-based)
  if (routingSlide.layout === 'crt-hook') return <CrtHookLayout slide={routingSlide} profile={resolvedProfile} />;
  if (routingSlide.layout === 'crt-body') return <CrtBodyLayout slide={routingSlide} />;
  if (routingSlide.layout === 'crt-quote') return <CrtBodyLayout slide={routingSlide} />;
  if (routingSlide.layout === 'crt-cta') return <CrtCtaLayout slide={routingSlide} profile={resolvedProfile} />;

  // 1. Specific Layout Overrides based on `layout` property
  if (routingSlide.layout === 'hero-image') return <HeroLayout slide={routingSlide} />;
  // FORCE OVERRIDE: Redirect split/bento/profile to ContentLayout to avoid "cut slide" look
  if (routingSlide.layout === 'split-left' || routingSlide.layout === 'split-right') return <ContentLayout slide={routingSlide} />;
  if (routingSlide.layout === 'bento-grid') return <ContentLayout slide={routingSlide} />;
  if (routingSlide.layout === 'profile-card') return <ProfileCardLayout slide={routingSlide} profile={resolvedProfile} />;
  if (routingSlide.layout === 'article-body') return <ContentLayout slide={routingSlide} />;

  // 2. Role-based defaults (backward compat for slides without layoutMap)
  switch (routingSlide.role) {
    case 'hook':
      return <HookLayout slide={routingSlide} />;
    case 'pattern-interrupt':
    case 'tension': // Universal SlideRole equivalent
      if (routingSlide.layout === 'headline-only') return <HookLayout slide={routingSlide} />;
      if (routingSlide.layout === 'quote-attribution') return <QuoteLayout slide={routingSlide} />;
      return <ContentLayout slide={routingSlide} />;
    case 'cta':
      return <CTALayout slide={routingSlide} />;
    case 'soft-cta': // Universal SlideRole — render like conclusion
      return <ContentLayout slide={routingSlide} />;
    case 'quote':
      return <QuoteLayout slide={routingSlide} />;
    case 'conflict':
      if (routingSlide.layout === 'quote-attribution') return <QuoteLayout slide={routingSlide} />;
      return <ContentLayout slide={routingSlide} />;
    case 'conclusion':
      return <ContentLayout slide={routingSlide} />;
    case 'context': // Universal SlideRole — render as content
      return <ContentLayout slide={routingSlide} />;
    case 'list':
      return <ListLayout slide={routingSlide} />;
    case 'engagement':
      return <TweetEngagementLayout slide={routingSlide} profile={resolvedProfile} />;
    case 'tutorial':
    case 'comparison':
    case 'showcase':
    case 'content':
    default:
      if (routingSlide.layout === 'numbered-item') {
        return <ListLayout slide={routingSlide} />;
      }
      return <ContentLayout slide={routingSlide} />;
  }
}
