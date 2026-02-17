'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { PhotoCard } from '../../components/PhotoCard';
import { useAuth } from '../../contexts/AuthContext';
import { Sidebar } from '../../components/Sidebar';
import { useUserPosts } from '../../hooks/useUserPosts';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export const dynamic = 'force-dynamic';

export default function MyPostsPage() {
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { posts, loading, error } = useUserPosts({
    userId: user?.id || null,
    enableRealtime: true,
  });

  const [showGeneratingCard, setShowGeneratingCard] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const generatingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Detectar query param "generating=true" e iniciar progresso
  useEffect(() => {
    const isGenerating = searchParams.get('generating') === 'true';

    if (isGenerating) {
      console.log('[MY-POSTS] Detected generating=true, starting progress');
      setShowGeneratingCard(true);
      setProgress(0);
      setProgressMessage(t('myPosts.extracting'));

      // Limpar query param da URL
      const url = new URL(window.location.href);
      url.searchParams.delete('generating');
      window.history.replaceState({}, '', url.toString());

      // Sistema de progresso simulado
      const startTime = Date.now();
      const estimatedDuration = 45000; // 45 segundos

      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const rawProgress = Math.min((elapsed / estimatedDuration) * 100, 95);
        const easedProgress = Math.floor(rawProgress);

        setProgress(easedProgress);

        // Atualizar mensagens de progresso
        if (easedProgress < 25) {
          setProgressMessage(t('myPosts.extracting'));
        } else if (easedProgress < 50) {
          setProgressMessage(t('myPosts.generatingSlides'));
        } else if (easedProgress < 75) {
          setProgressMessage(t('myPosts.applyingDesign'));
        } else if (easedProgress < 95) {
          setProgressMessage(t('myPosts.finalizing'));
        } else {
          setProgressMessage(t('myPosts.waiting'));
        }

        // Para em 95% e espera realtime
        if (easedProgress >= 95 && progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      }, 300);

      // Timeout de segurança: 2 minutos
      generatingTimeoutRef.current = setTimeout(() => {
        console.warn('[MY-POSTS] Timeout reached, hiding generating card');
        setShowGeneratingCard(false);
        setProgress(0);
        setProgressMessage('');
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      }, 120000);
    }

    return () => {
      if (generatingTimeoutRef.current) {
        clearTimeout(generatingTimeoutRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [searchParams, t]);

  // Quando um novo post chegar via realtime, completar o progresso
  useEffect(() => {
    if (showGeneratingCard && posts.length > 0) {
      // Animar progresso para 100%
      setProgress(100);
      setProgressMessage(t('myPosts.completed'));

      setTimeout(() => {
        setShowGeneratingCard(false);
        setProgress(0);
        setProgressMessage('');

        if (generatingTimeoutRef.current) {
          clearTimeout(generatingTimeoutRef.current);
        }
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      }, 800);
    }
  }, [posts.length, showGeneratingCard, t]);

  // Loading state durante autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white pl-[260px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8a00c4]" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <Sidebar />
        <div className="pl-[260px] flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold font-['Sora'] mb-4">{t('myPosts.accessRestricted')}</h1>
          <p className="text-white/60 mb-6">{t('myPosts.loginToView')}</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold font-['Sora']">{t('myPosts.title')}</h1>
          </header>

          {/* Error State */}
          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-500 mb-1">{t('myPosts.errorLoading')}</h3>
                <p className="text-sm text-red-400/80">{error.message}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
                >
                  {t('myPosts.retry')}
                </button>
              </div>
            </div>
          )}

          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-[48px]">
            {/* Generating Card */}
            {showGeneratingCard && (
              <div className="bg-gradient-to-br from-[#8a00c4]/10 to-[#161616] rounded-[12px] overflow-hidden aspect-[4/5] border border-[#8a00c4]/30 relative group">
                <div className="w-full h-full flex flex-col items-center justify-center p-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#8a00c4]/5 via-transparent to-[#8a00c4]/5 animate-pulse" />

                  <div className="relative z-10 flex flex-col items-center gap-6 w-full">
                    <div className="relative">
                      <Sparkles className="w-16 h-16 text-[#8a00c4] animate-pulse" />
                      <div className="absolute inset-0 blur-xl bg-[#8a00c4]/30 animate-pulse" />
                    </div>

                    <div className="text-center space-y-2">
                      <h3 className="font-['Sora'] font-bold text-xl text-white">
                        {t('myPosts.creatingPost')}
                      </h3>
                      <p className="font-['DM_Sans'] text-sm text-white/60">
                        {progressMessage}
                      </p>
                    </div>

                    <div className="w-full max-w-[200px] space-y-2">
                      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#8a00c4] to-[#b44cff] rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${progress}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                        </div>
                      </div>
                      <p className="text-center font-['DM_Sans'] font-bold text-[#8a00c4] text-lg">
                        {progress}%
                      </p>
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-shimmer" />
                </div>
              </div>
            )}

            {/* Posts */}
            {!loading && posts.map((post, index) => (
              <PhotoCard key={post.id} post={post} index={index} />
            ))}

            {/* Loading Skeletons */}
            {loading && !showGeneratingCard && (
              Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="bg-[#161616] rounded-[12px] overflow-hidden aspect-[4/5]"
                >
                  <div className="w-full h-full shimmer-placeholder" />
                </div>
              ))
            )}
          </div>

          {/* Empty State */}
          {!loading && posts.length === 0 && !showGeneratingCard && !error && (
            <div className="py-20 text-center text-white/50 font-['DM_Sans']">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <PhotoCardIcon className="w-8 h-8 text-white/20" />
              </div>
              <h3 className="text-xl text-white font-medium mb-2">{t('myPosts.noPostsTitle')}</h3>
              <p className="text-sm text-white/40 max-w-sm mx-auto">
                {t('myPosts.noPostsDesc')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PhotoCardIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}
