import type { PillarId } from '../../shared/types/pillar.types.js';

export type ReconSourceType = 'google_news' | 'google_trends' | 'reddit' | 'twitter' | 'blog';

export interface ReconUltraRequest {
  userId: string;
  pillarId: PillarId;
  sources?: ReconSourceType[];  // optional filter — default: all
}

export interface ReconUltraCandidate {
  source_type: ReconSourceType;
  title: string;
  summary: string | null;
  body_content: string | null;
  url: string | null;
  author: string | null;
  category: string | null;

  // Engagement
  source_score: number | null;
  source_comments: number | null;
  source_retweets: number | null;
  source_views: number | null;

  // Scoring (5 dimensions)
  recency_score: number;
  engagement_score: number;
  relevance_score: number;
  richness_score: number;
  pillar_alignment_score: number;
  final_score: number;

  // Metadata
  pillar_tag: PillarId;
  query_used: string;
  posted_at: string | null;
  expires_at: string;
}

export interface ReconUltraResult {
  userId: string;
  pillarId: PillarId;
  candidates: ReconUltraCandidate[];
  sources_used: ReconSourceType[];
  total_collected: number;
  total_after_filter: number;
  cache_queries_used: boolean;
  duration_ms: number;
}

export interface BlogSource {
  id: string;
  user_id: string;
  blog_url: string;
  blog_name: string | null;
  scrape_frequency: 'hourly' | 'daily' | 'weekly';
  is_active: boolean;
  last_scraped_at: string | null;
}

export interface BlogScrapedArticle {
  url: string;
  title: string;
  body_content: string;
  author: string | null;
  posted_at: string | null;
  word_count: number;
  key_quotes: string[];
}
