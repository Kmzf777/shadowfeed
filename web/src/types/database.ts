export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      sf_posts: {
        Row: {
          id: string
          user_id: string | null
          intel_source_id: string | null
          theme: string
          style: string
          slides: Json[]
          slide_count: number
          caption: string
          hashtags: string[]
          cta_text: string | null
          posting_time: string | null
          color_palette: Json
          fonts: Json
          gemini_model: string
          input_tokens: number | null
          output_tokens: number | null
          generation_cost_usd: number | null
          generation_time_ms: number | null
          prompt_version: string
          status: 'draft' | 'rendered' | 'approved' | 'published' | 'rejected'
          rejection_reason: string | null
          rendered_paths: string[] | null
          ig_post_id: string | null
          ig_post_url: string | null
          created_at: string
          rendered_at: string | null
          published_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          intel_source_id?: string | null
          theme: string
          style: string
          slides: Json[]
          slide_count: number
          caption: string
          hashtags: string[]
          cta_text?: string | null
          posting_time?: string | null
          color_palette: Json
          fonts: Json
          gemini_model: string
          input_tokens?: number | null
          output_tokens?: number | null
          generation_cost_usd?: number | null
          generation_time_ms?: number | null
          prompt_version: string
          status?: 'draft' | 'rendered' | 'approved' | 'published' | 'rejected'
          rejection_reason?: string | null
          rendered_paths?: string[] | null
          ig_post_id?: string | null
          ig_post_url?: string | null
          created_at?: string
          rendered_at?: string | null
          published_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          intel_source_id?: string | null
          theme?: string
          style?: string
          slides?: Json[]
          slide_count?: number
          caption?: string
          hashtags?: string[]
          cta_text?: string | null
          posting_time?: string | null
          color_palette?: Json
          fonts?: Json
          gemini_model?: string
          input_tokens?: number | null
          output_tokens?: number | null
          generation_cost_usd?: number | null
          generation_time_ms?: number | null
          prompt_version?: string
          status?: 'draft' | 'rendered' | 'approved' | 'published' | 'rejected'
          rejection_reason?: string | null
          rendered_paths?: string[] | null
          ig_post_id?: string | null
          ig_post_url?: string | null
          created_at?: string
          rendered_at?: string | null
          published_at?: string | null
        }
      }
      users: {
        Row: {
          id: string
          email: string
          setup_completed: boolean
          highlight_color: string | null
          full_name: string | null
          avatar_url: string | null
          avatar_path: string | null
          instagram_handle: string | null
          instagram_username: string | null
          target_audience: string | null
          main_pain_point: string | null
          voice_tone: string | null
          user_prompt: string | null
          created_at: string
        }
        Insert: {
          id: string
          email?: string
          setup_completed?: boolean
          highlight_color?: string | null
          full_name?: string | null
          avatar_url?: string | null
          avatar_path?: string | null
          instagram_handle?: string | null
          instagram_username?: string | null
          target_audience?: string | null
          main_pain_point?: string | null
          voice_tone?: string | null
          user_prompt?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          setup_completed?: boolean
          highlight_color?: string | null
          full_name?: string | null
          avatar_url?: string | null
          avatar_path?: string | null
          instagram_handle?: string | null
          instagram_username?: string | null
          target_audience?: string | null
          main_pain_point?: string | null
          voice_tone?: string | null
          user_prompt?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      post_status: 'draft' | 'rendered' | 'approved' | 'published' | 'rejected'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
