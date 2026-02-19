'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { PhotoCard } from '../../components/PhotoCard';
import { useAuth } from '../../contexts/AuthContext';
import { Sidebar } from '../../components/Sidebar';
import { useUserPosts } from '../../hooks/useUserPosts';
import { Loader2, Sparkles, AlertCircle, Terminal, Cpu } from 'lucide-react';
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
      <div className="min-h-screen bg-[#050505] text-white pl-[260px] flex items-center justify-center font-mono">
        <span className="animate-pulse mr-2">&gt;</span> AUTHENTICATING...
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] text-white">
        <Sidebar />
        <div className="pl-[260px] flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold font-['Sora'] mb-4 tracking-tight">ACCESS DENIED</h1>
          <p className="text-[#808080] font-mono text-sm uppercase tracking-wider mb-6">/var/auth/login_required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#d4d4d4] relative z-[1]">
      <Sidebar />

      <div className="pl-[260px]">
        <div className="max-w-[1600px] mx-auto px-12 py-12">
          {/* Header */}
          <header className="mb-12 flex items-end gap-4 border-b border-[#1e1e1e] pb-6">
            <div>
              <h1 className="text-4xl font-bold font-['Sora'] tracking-tight text-white mb-2">{t('myPosts.title')}</h1>
              <p className="text-[#808080] font-mono text-xs">/home/{user.email?.split('@')[0]}/posts • private_dir</p>
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
                  {t('myPosts.retry')}
                </button>
              </div>
            </div>
          )}

          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-[48px]">
            {/* Generating Card (Terminal Style) */}
            {showGeneratingCard && (
              <div className="bg-[#0a0a0a] border border-[#8a00c4] aspect-[4/5] relative overflow-hidden flex flex-col font-mono">
                {/* Terminal Header */}
                <div className="bg-[#161616] border-b border-[#1e1e1e] px-3 py-2 flex items-center justify-between">
                  <span className="text-[10px] text-[#808080] uppercase">task_runner.exe</span>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#2a2a2a]" />
                    <div className="w-2 h-2 rounded-full bg-[#2a2a2a]" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 flex flex-col justify-end">
                  <div className="space-y-1 mb-6">
                    <div className="text-[10px] text-[#4a4a4a] mb-1">$ start_generation --verbose</div>
                    <div className="text-xs text-[#8a00c4]">
                      &gt; {progressMessage}
                      <span className="animate-pulse">_</span>
                    </div>
                  </div>

                  {/* Progress Bar (ASCII Style or Block) */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] text-[#808080] uppercase tracking-wider">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-1 bg-[#1e1e1e]">
                      <div
                        className="h-full bg-[#8a00c4] transition-all duration-300 ease-out relative"
                        style={{ width: `${progress}%` }}
                      >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-2 bg-white animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Background decorative elements */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#8a00c4]/10">
                  <Cpu className="w-24 h-24 animate-pulse" />
                </div>
              </div>
            )}

            {/* Posts */}
            {!loading && posts.map((post, index) => (
              <PhotoCard key={post.id} post={post} index={index} customHref={`/posts/${post.id}`} />
            ))}

            {/* Loading Skeletons */}
            {loading && !showGeneratingCard && (
              Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="bg-[#0a0a0a] border border-[#1e1e1e] aspect-[4/5] relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#1e1e1e]/20 to-transparent animate-pulse" />
                </div>
              ))
            )}
          </div>

          {/* Empty State */}
          {!loading && posts.length === 0 && !showGeneratingCard && !error && (
            <div className="col-span-full py-24 text-center">
              <div className="inline-flex flex-col items-center justify-center p-12 bg-[#0a0a0a] border border-[#1e1e1e] max-w-md">
                <Terminal className="w-12 h-12 text-[#4a4a4a] mb-6" />
                <h3 className="text-lg text-white font-medium font-['Sora'] mb-2">{t('myPosts.noPostsTitle')}</h3>
                <p className="text-sm text-[#808080] font-mono tracking-wide max-w-xs mx-auto">
                  {t('myPosts.noPostsDesc')}
                </p>
              </div>
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
