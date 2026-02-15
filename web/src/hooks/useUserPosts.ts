import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { GeneratedPost } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseUserPostsOptions {
  userId: string | null;
  enableRealtime?: boolean;
}

interface UseUserPostsReturn {
  posts: GeneratedPost[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook para carregar posts de um usuário específico com realtime
 * Ideal para a página My Posts
 */
export function useUserPosts(
  options: UseUserPostsOptions
): UseUserPostsReturn {
  const { userId, enableRealtime = true } = options;

  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);

  // Função para carregar posts do usuário
  const loadUserPosts = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setPosts([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[useUserPosts] Loading posts for user:', userId);

      const { data, error: fetchError } = await supabase
        .from('sf_posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (!mountedRef.current) return;

      console.log('[useUserPosts] Loaded posts:', data?.length || 0);
      setPosts((data || []) as GeneratedPost[]);

    } catch (err) {
      console.error('[useUserPosts] Error loading posts:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to load user posts'));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [userId]);

  // Função para recarregar posts
  const refresh = useCallback(async () => {
    await loadUserPosts();
  }, [loadUserPosts]);

  // Carregamento inicial
  useEffect(() => {
    mountedRef.current = true;
    loadUserPosts();

    return () => {
      mountedRef.current = false;
    };
  }, [loadUserPosts]);

  // Realtime subscription
  useEffect(() => {
    if (!enableRealtime || !userId) return;

    console.log('[useUserPosts] Setting up realtime subscription for user:', userId);

    channelRef.current = supabase
      .channel(`user_posts_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sf_posts',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[useUserPosts] New post received:', payload.new);
          if (mountedRef.current) {
            setPosts((prev) => {
              // Evitar duplicatas
              if (prev.some((p) => p.id === payload.new.id)) {
                return prev;
              }
              return [payload.new as GeneratedPost, ...prev];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sf_posts',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[useUserPosts] Post updated:', payload.new);
          if (mountedRef.current) {
            setPosts((prev) =>
              prev.map((p) => (p.id === payload.new.id ? (payload.new as GeneratedPost) : p))
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'sf_posts',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[useUserPosts] Post deleted:', payload.old);
          if (mountedRef.current) {
            setPosts((prev) => prev.filter((p) => p.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('[useUserPosts] Subscription status:', status);
      });

    return () => {
      if (channelRef.current) {
        console.log('[useUserPosts] Cleaning up realtime subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, enableRealtime]);

  return {
    posts,
    loading,
    error,
    refresh,
  };
}
