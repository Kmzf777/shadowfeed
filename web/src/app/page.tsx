'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PhotoCard } from '../components/PhotoCard';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { usePostsLoader } from '../hooks/usePostsLoader';
import { AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function Home() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
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
          console.log('[Home] Loading more posts...');
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
      router.push('/criar-post');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Sidebar />

      {/* Background Logo */}
      <div className="fixed inset-0 flex items-center justify-center z-0 pointer-events-none select-none">
        <div className="relative h-[70vh] w-[70vh] opacity-20">
          <img
            src="/logo.png"
            alt="Shadowfeed Logo"
            className="object-contain h-full w-full"
            draggable={false}
          />
        </div>
      </div>

      <div className="pl-[260px] relative z-10">
        <div className="max-w-[1600px] mx-auto px-8 py-8">
          {/* Header */}
          <header className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold font-['Sora']">Explorar</h1>
          </header>

          {/* Error State */}
          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-500 mb-1">Erro ao carregar posts</h3>
                <p className="text-sm text-red-400/80">{error.message}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-[48px]">
            {posts.map((post, index) => (
              <PhotoCard key={post.id} post={post} index={index} />
            ))}

            {/* Loading Skeletons */}
            {loading && posts.length === 0 && (
              Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="bg-[#161616] rounded-[12px] overflow-hidden aspect-[4/5]"
                >
                  <div className="w-full h-full shimmer-placeholder" />
                </div>
              ))
            )}

            {/* Loading More Indicator */}
            {loading && posts.length > 0 && (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={`loading-${i}`}
                  className="bg-[#161616] rounded-[12px] overflow-hidden aspect-[4/5]"
                >
                  <div className="w-full h-full shimmer-placeholder" />
                </div>
              ))
            )}
          </div>

          {/* Empty State */}
          {!loading && posts.length === 0 && !error && (
            <div className="col-span-full py-12 text-center text-white/50 font-['DM_Sans']">
              <p className="text-lg">Nenhum post encontrado</p>
              <p className="text-sm mt-2">Comece criando um novo post!</p>
              <button
                onClick={handleCreatePostClick}
                className="mt-6 px-6 py-3 bg-[#8a00c4] hover:bg-[#9a10d4] text-white rounded-lg font-medium transition-colors"
              >
                Criar Primeiro Post
              </button>
            </div>
          )}

          {/* End of Results Message */}
          {!hasMore && posts.length > 0 && (
            <div className="col-span-full py-8 text-center text-white/40 text-sm font-['DM_Sans']">
              Você viu todos os posts disponíveis
            </div>
          )}

          {/* Sentinel for Infinite Scroll */}
          <div ref={sentinelRef} className="h-1" />
        </div>
      </div>
    </div>
  );
}
