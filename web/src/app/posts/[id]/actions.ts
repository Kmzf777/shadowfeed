'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Create a separate client without strict typing for server actions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function updatePostSlides(
    postId: string,
    slides: any[],
    color_palette?: any,
    content_json?: any,
    caption?: string,
    hashtags?: string[],
    profile_name?: string,
    profile_handle?: string,
    profile_avatar?: string
) {
    try {
        const updateData: Record<string, any> = { slides };
        if (color_palette) updateData.color_palette = color_palette;
        if (content_json) updateData.content_json = content_json;
        if (caption !== undefined) updateData.caption = caption;
        if (hashtags !== undefined) updateData.hashtags = hashtags;

        // Profile updates
        if (profile_name !== undefined) updateData.profile_name = profile_name;
        if (profile_handle !== undefined) updateData.profile_handle = profile_handle;
        if (profile_avatar !== undefined) updateData.profile_avatar = profile_avatar;

        const { error: updateError } = await supabase
            .from('sf_posts')
            .update(updateData)
            .eq('id', postId)

        if (updateError) {
            console.error('Error updating post:', updateError);
            throw new Error('Failed to update post');
        }

        revalidatePath(`/posts/${postId}`);
        return { success: true };
    } catch (err) {
        console.error('Server action failed:', err);
        return { success: false, error: 'Failed to update post' };
    }
}
