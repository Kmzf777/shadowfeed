
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
