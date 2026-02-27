'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PhotoCard } from '../components/PhotoCard';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Sidebar } from '../components/Sidebar';
import { usePostsLoader } from '../hooks/usePostsLoader';
import { AlertCircle, Terminal } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function Home() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { t } = useLanguage();
  const { posts, loading, error, hasMore, loadMore } = usePostsLoader({
    pageSize: 20,
    enableRealtime: true,
  });

  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Infinite scroll com IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;

    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          console.log(`[Home] ${t('home.loadingMore')}`);
          loadMore();
        }
      },
      {
        rootMargin: '400px', // Carregar antes de chegar ao final
      }
    );

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, loadMore]);

  const handleCreatePostClick = () => {
    if (!user) {
      router.push('/reception');
    } else if (userProfile && !userProfile.setup_completed) {
      router.push('/setup');
    } else {
      router.push('/create');
    }
  };

  return (
    <div className="min-h-screen text-[#d4d4d4] relative z-[1]">
      <div className="max-w-[1600px] mx-auto px-4 md:px-12 py-12">
        {/* Header */}
        <header className="mb-12 flex items-end gap-4 border-b border-[#1e1e1e] pb-6">
          <div>
            <h1 className="text-4xl font-bold font-['Sora'] tracking-tight text-white mb-2">{t('home.explore')}</h1>
            <p className="text-[#808080] font-mono text-xs">/var/www/feed • public_access</p>
          </div>
        </header>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-[#1a0707] border border-[#4a1a1a] rounded-none flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#f87171] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-[#f87171] mb-1 font-mono text-sm uppercase">System Error</h3>
              <p className="text-sm text-[#f87171]/70 font-mono">{error.message}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-xs bg-[#f87171]/10 hover:bg-[#f87171]/20 text-[#f87171] px-3 py-1.5 uppercase font-mono tracking-wider transition-colors"
              >
                {t('common.retry')}
              </button>
            </div>
          </div>
        )}

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-[48px]">
          {posts.map((post, index) => (
            <PhotoCard key={post.id} post={post} index={index} />
          ))}

          {/* Loading Skeletons */}
          {loading && posts.length === 0 && (
            Array.from({ length: 15 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="bg-[#0a0a0a] border border-[#1e1e1e] aspect-[4/5] relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#1e1e1e]/20 to-transparent animate-pulse" />
              </div>
            ))
          )}

          {/* Loading More Indicator */}
          {loading && posts.length > 0 && (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={`loading-${i}`}
                className="bg-[#0a0a0a] border border-[#1e1e1e] aspect-[4/5] relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#1e1e1e]/20 to-transparent animate-pulse" />
              </div>
            ))
          )}
        </div>

        {/* Empty State */}
        {!loading && posts.length === 0 && !error && (
          <div className="col-span-full py-24 text-center">
            <div className="inline-flex flex-col items-center justify-center p-12 bg-[#0a0a0a] border border-[#1e1e1e] max-w-md">
              <Terminal className="w-12 h-12 text-[#4a4a4a] mb-6" />
              <p className="text-lg font-['Sora'] font-medium text-white mb-2">{t('home.noPosts')}</p>
              <p className="text-sm text-[#808080] font-mono mb-8">{t('home.startCreating')}</p>
              <button
                onClick={handleCreatePostClick}
                className="px-6 py-3 bg-[#161616] hover:bg-[#8a00c4] text-[#d4d4d4] hover:text-white border border-[#2a2a2a] hover:border-[#8a00c4] font-mono text-xs uppercase tracking-widest transition-all"
              >
                {t('home.createFirstPost')}
              </button>
            </div>
          </div>
        )}

        {/* End of Results Message */}
        {!hasMore && posts.length > 0 && (
          <div className="col-span-full py-12 text-center">
            <span className="text-[#4a4a4a] text-xs font-mono uppercase tracking-widest">
              -- End of Stream --
            </span>
          </div>
        )}

        {/* Sentinel for Infinite Scroll */}
        <div ref={sentinelRef} className="h-1" />
      </div>
    </div>
  );
}
