import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { GeneratedPost } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UsePostsLoaderOptions {
  pageSize?: number;
  enableRealtime?: boolean;
}

interface UsePostsLoaderReturn {
  posts: GeneratedPost[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook para carregar posts públicos com paginação e realtime
 * Ideal para a página Home
 */
export function usePostsLoader(
  options: UsePostsLoaderOptions = {}
): UsePostsLoaderReturn {
  const { pageSize = 20, enableRealtime = true } = options;

  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);
  const loadingMoreRef = useRef(false);

  // Função para carregar posts iniciais
  const loadPosts = useCallback(async (reset = false) => {
    if (loadingMoreRef.current) return;

    try {
      loadingMoreRef.current = true;
      if (reset) {
        setLoading(true);
        setError(null);
      }

      const currentOffset = reset ? 0 : offset;
      const { data, error: fetchError } = await supabase
        .from('sf_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + pageSize - 1);

      if (fetchError) throw fetchError;

      if (!mountedRef.current) return;

      const newPosts = (data || []) as GeneratedPost[];

      if (reset) {
        setPosts(newPosts);
        setOffset(newPosts.length);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
        setOffset((prev) => prev + newPosts.length);
      }

      // Se retornou menos posts que o pageSize, não há mais posts
      setHasMore(newPosts.length === pageSize);

    } catch (err) {
      console.error('[usePostsLoader] Error loading posts:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to load posts'));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        loadingMoreRef.current = false;
      }
    }
  }, [offset, pageSize]);

  // Função para carregar mais posts (infinite scroll)
  const loadMore = useCallback(async () => {
    if (!hasMore || loading || loadingMoreRef.current) return;
    await loadPosts(false);
  }, [hasMore, loading, loadPosts]);

  // Função para recarregar do zero
  const refresh = useCallback(async () => {
    setOffset(0);
    await loadPosts(true);
  }, [loadPosts]);

  // Carregamento inicial
  useEffect(() => {
    mountedRef.current = true;
    loadPosts(true);

    return () => {
      mountedRef.current = false;
    };
  }, []); // Apenas na montagem

  // Realtime subscription
  useEffect(() => {
    if (!enableRealtime) return;

    console.log('[usePostsLoader] Setting up realtime subscription');

    channelRef.current = supabase
      .channel('public_posts_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sf_posts',
        },
        (payload) => {
          console.log('[usePostsLoader] New post received:', payload.new);
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
      .subscribe((status) => {
        console.log('[usePostsLoader] Subscription status:', status);
      });

    return () => {
      if (channelRef.current) {
        console.log('[usePostsLoader] Cleaning up realtime subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enableRealtime]);

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
