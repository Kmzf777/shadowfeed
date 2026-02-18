export interface IntelSource {
  id: string;
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
  relevance_score: number;
  used: boolean;
  used_in_post_id: string | null;
  collected_at: string;
  expires_at: string;
  raw_content?: string;
}

export interface GeneratedPost {
  id: string;
  intel_source_id: string | null;
  theme: string;
  style: string;
  slides: Record<string, unknown>[];
  slide_count: number;
  caption: string;
  hashtags: string[];
  cta_text: string | null;
  posting_time: string | null;
  color_palette: Record<string, string>;
  fonts: Record<string, string>;
  gemini_model: string;
  input_tokens: number | null;
  output_tokens: number | null;
  generation_cost_usd: number | null;
  generation_time_ms: number | null;
  prompt_version: string;
  status: 'draft' | 'rendered' | 'approved' | 'published' | 'rejected';
  rejection_reason: string | null;
  rendered_paths: string[] | null;
  ig_post_id: string | null;
  ig_post_url: string | null;
  created_at: string;
  rendered_at: string | null;
  published_at: string | null;
  generation_method: 'manual' | 'smart';
  smart_query_used: string | null;
}
