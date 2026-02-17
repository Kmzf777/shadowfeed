export interface RawIntelItem {
  source_type: 'google_news' | 'google_trends' | 'google_trends_enriched' | 'reddit' | 'twitter' | 'manual';
  title: string;
  summary: string | null;
  url: string | null;
  author: string | null;
  category:
  | 'ai_models'
  | 'ai_tools'
  | 'automation'
  | 'coding'
  | 'industry_news'
  | 'tutorials'
  | 'opinion'
  | null;
  source_score: number | null;
  source_comments: number | null;
  source_retweets: number | null;
  source_replies: number | null;
  source_views: number | null;
  posted_at: string | null;
  relevance_score: number;
}

export interface ReconResult {
  source: string;
  collected: number;
  errors: number;
}

export interface FullReconResult {
  results: ReconResult[];
  total_collected: number;
  total_errors: number;
  duration_ms: number;
}
