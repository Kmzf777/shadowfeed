'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '../../contexts/AuthContext';

type Pipeline = 'default' | 'authority';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

export function ManualNewsForm() {
    const router = useRouter();
    const { user } = useAuth();
    const [url, setUrl] = useState('');
    const [pipeline, setPipeline] = useState<Pipeline>('default');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);

    const detectUrlLabel = (input: string): string => {
        const lower = input.toLowerCase();
        if (lower.includes('reddit.com') || lower.includes('redd.it')) return 'Reddit';
        if (lower.includes('x.com') || lower.includes('twitter.com')) return 'Twitter/X';
        if (input.length > 10) return 'Blog';
        return '';
    };

    const urlLabel = detectUrlLabel(url);

    async function handleGenerate() {
        if (!url.trim()) {
            setError('Cole uma URL para continuar.');
            return;
        }

        try {
            new URL(url);
        } catch {
            setError('URL invalida. Verifique o formato.');
            return;
        }

        setError(null);
        setLoading(true);
        setStatus('Extraindo conteudo da URL...');

        try {
            const res = await fetch(`${API_URL}/api/manual-news/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: url.trim(),
                    pipeline,
                    userId: user?.id,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || data.error || `HTTP ${res.status}`);
            }

            setStatus('Post gerado! Redirecionando...');
            const post = await res.json();
            router.push(`/posts/${post.id}`);
        } catch (err) {
            setError((err as Error).message || 'Erro ao gerar post.');
            setLoading(false);
            setStatus(null);
        }
    }

    return (
        <div className="max-w-xl mx-auto">
            {/* URL Input */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL da Noticia
                </label>
                <div className="relative">
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://reddit.com/r/... ou https://x.com/... ou https://blog.com/..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#8a00c4] focus:border-transparent outline-none transition"
                        disabled={loading}
                    />
                    {urlLabel && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-medium">
                            {urlLabel}
                        </span>
                    )}
                </div>
                <p className="mt-1 text-xs text-gray-400">
                    Aceita: Blog, Reddit, Twitter/X
                </p>
            </div>

            {/* Pipeline Selector */}
            <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pipeline
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setPipeline('default')}
                        disabled={loading}
                        className={`p-4 rounded-lg border-2 text-left transition ${pipeline === 'default'
                            ? 'border-[#8a00c4] bg-[#8a00c4]/5'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="font-bold text-gray-900 text-sm">Default</div>
                        <div className="text-xs text-gray-500 mt-1">
                            Magazine editorial, 7-10 slides, design premium
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => setPipeline('authority')}
                        disabled={loading}
                        className={`p-4 rounded-lg border-2 text-left transition ${pipeline === 'authority'
                            ? 'border-[#8a00c4] bg-[#8a00c4]/5'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="font-bold text-gray-900 text-sm">Authority</div>
                        <div className="text-xs text-gray-500 mt-1">
                            Tweet-thread, 6-8 slides, formato Twitter/X
                        </div>
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* Generate Button */}
            <button
                onClick={handleGenerate}
                disabled={loading || !url.trim()}
                className={`w-full py-3.5 rounded-lg font-bold text-sm transition shadow-md ${loading || !url.trim()
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#8a00c4] text-white hover:bg-[#7000a0] active:scale-[0.98]'
                    }`}
            >
                {loading ? 'Gerando...' : 'Gerar Post'}
            </button>

            {/* Loading Status */}
            {loading && status && (
                <div className="mt-4 flex items-center gap-3 text-sm text-gray-500">
                    <div className="w-4 h-4 border-2 border-[#8a00c4] border-t-transparent rounded-full animate-spin" />
                    {status}
                </div>
            )}
        </div>
    );
}
