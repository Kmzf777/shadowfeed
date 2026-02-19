
import { createClient } from '@supabase/supabase-js';
import { ClientPostView } from './ClientPostView';
import { AuthGuard } from '@/components/AuthGuard';

export const dynamic = 'force-dynamic';

// Create a separate client without strict typing for server components
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PageProps) {
    const { id } = await params;

    const { data: post, error } = await supabase
        .from('sf_posts')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !post) {
        return (
            <div className="relative z-[1] min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8">
                <div className="p-8 text-[var(--status-err)] bg-[var(--status-err-bg)] border border-[var(--status-err)]/20 rounded-[3px] max-w-lg w-full">
                    <h2 className="text-xl font-bold mb-2 font-['Sora']">Error Loading Post</h2>
                    <pre className="text-sm opacity-70 overflow-auto">{JSON.stringify(error, null, 2)}</pre>
                </div>
            </div>
        );
    }

    // Construct CarouselData for LivePreview
    const carouselData = {
        theme: post.theme,
        style: post.style,
        total_slides: post.slide_count,
        color_palette: post.color_palette,
        fonts: post.fonts,
        branding: post.branding,
        slides: post.slides,
        caption: post.caption,
        hashtags: post.hashtags,
        cta_text: post.cta_text,
        best_posting_time: post.posting_time,
        profile: post.profile,
        content_json: post.content_json // Pass content_json for theme switching
    };

    return (
        <AuthGuard>
            <ClientPostView post={post} carouselData={carouselData} content_json={post.content_json} />
        </AuthGuard>
    );
}
