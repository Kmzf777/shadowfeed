
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
            <div className="p-8 text-red-600 bg-red-50 rounded-lg">
                <h2 className="text-xl font-bold mb-2">Error Loading Post</h2>
                <pre>{JSON.stringify(error, null, 2)}</pre>
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
