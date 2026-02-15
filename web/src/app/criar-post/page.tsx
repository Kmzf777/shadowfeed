'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../../contexts/AuthContext';
import { useCredits, useThemePricing, purchaseExtraTokens } from '../../hooks/useCredits';
import { SetupRequiredGuard } from '../../components/SetupRequiredGuard';
import { motion, AnimatePresence } from 'framer-motion';
import { SlideFrame } from '../../components/renderer/primitives/SlideFrame';
import { SlideRouter } from '../../components/renderer/SlideRouter';
import type { SlideData, ProfileData } from '@/types/renderer/slide.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

interface PostTheme {
    id: string;
    name: string;
    description: string;
    slideCount: { min: number; max: number };
    contentDensity: string;
    emojiUsage: string;
}

const MOCK_PROFILE: ProfileData = {
    display_name: 'ShadowFeed',
    username: '@shadowfeed.ai',
    avatar_url: '/logoavatar.png',
    verified: true,
};

const DEFAULT_THEMES: PostTheme[] = [
    {
        id: 'magazine',
        name: 'Magazine',
        description: 'Visual sofisticado e elegante, ideal para conteúdo editorial e narrativas visuais.',
        slideCount: { min: 5, max: 10 },
        contentDensity: 'medium',
        emojiUsage: 'minimal'
    },
    {
        id: 'twitter',
        name: 'Twitter Thread',
        description: 'Estilo casual e direto, perfeito para insights rápidos e engajamento.',
        slideCount: { min: 5, max: 8 },
        contentDensity: 'high',
        emojiUsage: 'frequent'
    },
    {
        id: 'minimalist',
        name: 'Minimalista',
        description: 'Design limpo e objetivo, focado na mensagem principal.',
        slideCount: { min: 4, max: 7 },
        contentDensity: 'low',
        emojiUsage: 'rare'
    },
    {
        id: 'educational',
        name: 'Educacional',
        description: 'Estruturado para ensinar, com foco em clareza e progressão lógica.',
        slideCount: { min: 6, max: 12 },
        contentDensity: 'medium',
        emojiUsage: 'moderate'
    }
];

const THEME_PREVIEWS: Record<string, SlideData> = {
    magazine: {
        slide: 1,
        role: 'hook',
        layout: 'hero-image',
        headline: 'O Futuro do **Conteúdo**',
        subtitle: 'EDITORIAL',
        body: 'Descubra como a inteligência artificial está redefinindo a criação de narrativas digitais.',
        bg_color: '#000000',
        bg_gradient: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
        text_color: '#ffffff',
        accent_color: '#ffffff',
        font_headline: 'Playfair Display',
        font_body: 'Inter',
        font_size_headline: '48px',
        font_weight_headline: '700',
        font_size_body: '18px',
        text_align: 'center',
        decorative_elements: ['minimal-border'],
        image: {
            type: 'placeholder',
            prompt: 'Abstract minimal dark art',
            url: null,
            position: 'background',
        },
        icon: null,
        number_label: null
    },
    twitter: {
        slide: 1,
        role: 'hook',
        layout: 'tweet-hook',
        headline: 'Como criar **Posts Virais** em 3 passos simples 🧵',
        subtitle: null,
        body: null,
        bg_color: '#ffffff',
        bg_gradient: null,
        text_color: '#0F1419',
        accent_color: '#1D9BF0',
        font_headline: 'Inter',
        font_body: 'Inter',
        font_size_headline: '24px',
        font_weight_headline: '700',
        font_size_body: '18px',
        text_align: 'left',
        decorative_elements: [],
        image: null,
        icon: null,
        number_label: null,
        category_label: 'MARKETING',
        engagement_text: '2.4k Likes • 452 RTs'
    },
    minimalist: {
        slide: 1,
        role: 'hook',
        layout: 'headline-only',
        headline: 'Menos é **Mais**.',
        subtitle: null,
        body: 'A arte de dizer tudo sem dizer quase nada.',
        bg_color: '#f5f5f5',
        bg_gradient: null,
        text_color: '#1a1a1a',
        accent_color: '#1a1a1a',
        font_headline: 'Inter',
        font_body: 'Inter',
        font_size_headline: '56px',
        font_weight_headline: '800',
        font_size_body: '20px',
        text_align: 'left',
        decorative_elements: [],
        image: null,
        icon: null,
        number_label: '01'
    },
    educational: {
        slide: 1,
        role: 'hook',
        layout: 'step-focus',
        headline: 'Guia Definitivo: **SEO 2.0**',
        subtitle: 'AULA 1',
        body: 'Tudo o que você precisa saber para ranquear no topo em 2024.',
        bg_color: '#1e1e1e',
        bg_gradient: null,
        text_color: '#ffffff',
        accent_color: '#8a00c4',
        font_headline: 'Sora',
        font_body: 'Inter',
        font_size_headline: '42px',
        font_weight_headline: '700',
        font_size_body: '18px',
        text_align: 'center',
        decorative_elements: ['progress-bar'],
        image: null,
        icon: 'book',
        number_label: null
    }
};

export default function CriarPostPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { balance, planRemaining, extraTokens, subscription, loading: creditsLoading } = useCredits();
    const pricing = useThemePricing();

    // State
    const [currentStep, setCurrentStep] = useState(1);
    const [url, setUrl] = useState('');
    const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
    const [themes, setThemes] = useState<PostTheme[]>(DEFAULT_THEMES);
    const [isProductMode, setIsProductMode] = useState(false);
    const [productDescription, setProductDescription] = useState('');
    const [ctaText, setCtaText] = useState('eu quero');

    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [showThemePreview, setShowThemePreview] = useState<PostTheme | null>(null);

    // Fetch themes from API (optional - já temos temas padrão carregados)
    useEffect(() => {
        async function fetchThemes() {
            try {
                const res = await fetch(`${API_URL}/api/forge-personalized/themes`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        console.log('Themes loaded from API:', data);
                        setThemes(data);
                    }
                }
            } catch (err) {
                // Silently fail - já temos os temas padrão
                console.log('Using default themes (API not available)');
            }
        }
        fetchThemes();
    }, []);

    const detectUrlLabel = (input: string): string => {
        if (!input) return '';
        const lower = input.toLowerCase();
        if (lower.includes('reddit.com') || lower.includes('redd.it')) return 'Reddit';
        if (lower.includes('x.com') || lower.includes('twitter.com')) return 'Twitter/X';
        if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YouTube';
        if (input.length > 10) return 'Blog/Site';
        return '';
    };

    const handleNextStep = () => {
        if (currentStep === 1 && url.trim()) {
            try {
                new URL(url);
                setError(null);
                setCurrentStep(2);
            } catch {
                setError('URL inválida. Verifique o formato.');
            }
        } else if (currentStep === 2 && selectedTheme) {
            setCurrentStep(3);
        }
    };

    const handleGenerate = async () => {
        if (!url.trim() || !selectedTheme) return;

        // Verificar se tem userId
        if (!user?.id) {
            setError('Você precisa estar logado para criar posts.');
            return;
        }

        const body = {
            url: url.trim(),
            themeId: selectedTheme,
            userId: user.id,
            productMode: isProductMode,
            productDescription: isProductMode ? productDescription : undefined,
            ctaText: isProductMode ? ctaText : undefined,
        };

        console.log('Sending request to:', `${API_URL}/api/forge-personalized/generate`);
        console.log('Request body:', body);

        // Fire-and-forget: Inicia a geração em background
        fetch(`${API_URL}/api/forge-personalized/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        }).then(res => {
            if (!res.ok) {
                console.error('Error generating post - status:', res.status);
            } else {
                console.log('Post generation started successfully');
            }
        }).catch(err => {
            console.error('Error starting post generation:', err);
        });

        // Redireciona imediatamente para /my-posts com flag de loading
        router.push('/my-posts?generating=true');
    };

    return (
        <SetupRequiredGuard>
            <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center relative overflow-hidden gap-8 p-4">

                {/* Background Logo */}
                <div className="fixed inset-0 flex items-center justify-center z-0 pointer-events-none select-none">
                    <div className="relative h-[70vh] w-[70vh] opacity-20">
                        {/* Using standard img tag temporarily if Next.js Image causes issues, but adhering to previous pattern first */}
                        <img
                            src="/logo.png"
                            alt="Shadowfeed Logo"
                            className="object-contain h-full w-full"
                            draggable={false}
                        />
                    </div>
                </div>

                {/* Main Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-xl bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-[3px] p-8 relative z-10 shadow-2xl"
                >
                    <AnimatePresence mode='wait'>
                        {/* STEP 1: URL */}
                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <h2 className="font-['Sora'] font-bold text-2xl text-center mb-2">Qual conteúdo vamos transformar?</h2>
                                <p className="font-['DM_Sans'] text-white/[0.5] text-center mb-8">
                                    Cole o link do seu artigo, vídeo ou post
                                </p>

                                <div className="space-y-4">
                                    <div className="relative">
                                        <input
                                            type="url"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            placeholder="https://..."
                                            className="w-full px-4 py-4 rounded-[3px] bg-[#0a0a0a] text-white border border-white/[0.12] focus:border-[#8a00c4] outline-none transition font-['DM_Sans']"
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            {detectUrlLabel(url) && (
                                                <span className="bg-[#8a00c4]/20 text-[#8a00c4] text-xs px-2 py-1 rounded font-medium">
                                                    {detectUrlLabel(url)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {error && (
                                        <p className="text-red-400 text-sm text-center">{error}</p>
                                    )}

                                    <button
                                        onClick={handleNextStep}
                                        disabled={!url.trim()}
                                        className={`w-full py-4 rounded-[3px] font-['DM_Sans'] font-bold transition ${!url.trim()
                                            ? 'bg-white/[0.05] text-white/[0.3] cursor-not-allowed'
                                            : 'bg-[#8a00c4] text-white hover:bg-[#a600eb] shadow-[0_0_20px_rgba(138,0,196,0.3)]'
                                            }`}
                                    >
                                        Enviar
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: THEME SELECTION */}
                        {currentStep === 2 && !showThemePreview && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <button onClick={() => setCurrentStep(1)} className="text-white/[0.5] hover:text-white transition">
                                        ← Voltar
                                    </button>
                                    <div className="text-center">
                                        <h2 className="font-['Sora'] font-bold text-xl">Escolha o Estilo</h2>
                                        <p className="font-['DM_Sans'] text-white/[0.5] text-sm">Como deve ser o visual do post?</p>
                                    </div>
                                    <div className="w-12"></div> {/* Spacer for center alignment */}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                    {themes.map((theme) => (
                                        <div
                                            key={theme.id}
                                            onClick={() => setShowThemePreview(theme)}
                                            className={`p-4 rounded-[3px] border cursor-pointer transition group hover:scale-[1.02] ${selectedTheme === theme.id
                                                ? 'bg-[#8a00c4]/20 border-[#8a00c4]'
                                                : 'bg-[#0a0a0a] border-white/[0.1] hover:border-white/[0.3]'
                                                }`}
                                        >
                                            <div className="h-40 bg-[#161616] rounded-[3px] mb-3 relative border border-white/[0.05] flex items-center justify-center overflow-hidden">
                                                {/* Mini Preview */}
                                                {THEME_PREVIEWS[theme.id] ? (
                                                    <div style={{
                                                        width: '108px',
                                                        height: '135px',
                                                        overflow: 'hidden',
                                                        borderRadius: '3px',
                                                        position: 'relative'
                                                    }}>
                                                        <div style={{
                                                            width: '1080px',
                                                            height: '1350px',
                                                            transform: 'scale(0.1)',
                                                            transformOrigin: 'top left'
                                                        }}>
                                                            <SlideFrame
                                                                bgColor={THEME_PREVIEWS[theme.id].bg_color}
                                                                bgGradient={THEME_PREVIEWS[theme.id].bg_gradient}
                                                                branding={null}
                                                                accentColor={THEME_PREVIEWS[theme.id].accent_color}
                                                                textColor={THEME_PREVIEWS[theme.id].text_color}
                                                                fontBody={THEME_PREVIEWS[theme.id].font_body}
                                                            >
                                                                <SlideRouter slide={THEME_PREVIEWS[theme.id]} profile={MOCK_PROFILE} />
                                                            </SlideFrame>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-full bg-[#202020] flex items-center justify-center">
                                                        <span className="text-white/[0.3] text-xs">Preview indisponível</span>
                                                    </div>
                                                )}
                                            </div>
                                            <h3 className="font-['Sora'] font-semibold">{theme.name}</h3>
                                            <p className="font-['DM_Sans'] text-white/[0.5] text-sm mt-1 line-clamp-2">{theme.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2 ALTERNATE: THEME PREVIEW OVERLAY */}
                        {showThemePreview && (
                            <motion.div
                                key="step2-preview"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute inset-0 bg-[#0a0a0a] z-50 flex flex-col p-6 rounded-[3px]"
                            >
                                {/* Header */}
                                <div className="mb-4">
                                    <h3 className="font-['Sora'] font-bold text-xl text-center">{showThemePreview.name}</h3>
                                    <p className="font-['DM_Sans'] text-white/[0.6] text-center text-sm mt-1">{showThemePreview.description}</p>
                                </div>

                                {/* Preview Container */}
                                <div className="flex-1 flex items-center justify-center mb-6 overflow-hidden">
                                    {THEME_PREVIEWS[showThemePreview.id] ? (
                                        <div
                                            className="relative bg-[#0a0a0a] rounded-[3px] shadow-2xl border border-white/[0.15]"
                                            style={{
                                                width: '270px',
                                                height: '337.5px',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            <div style={{
                                                width: '1080px',
                                                height: '1350px',
                                                transform: 'scale(0.25)',
                                                transformOrigin: 'top left',
                                                position: 'absolute',
                                                top: 0,
                                                left: 0
                                            }}>
                                                <SlideFrame
                                                    bgColor={THEME_PREVIEWS[showThemePreview.id].bg_color}
                                                    bgGradient={THEME_PREVIEWS[showThemePreview.id].bg_gradient}
                                                    branding={null}
                                                    accentColor={THEME_PREVIEWS[showThemePreview.id].accent_color}
                                                    textColor={THEME_PREVIEWS[showThemePreview.id].text_color}
                                                    fontBody={THEME_PREVIEWS[showThemePreview.id].font_body}
                                                >
                                                    <SlideRouter slide={THEME_PREVIEWS[showThemePreview.id]} profile={MOCK_PROFILE} />
                                                </SlideFrame>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-[270px] h-[337.5px] bg-[#202020] flex items-center justify-center rounded-[3px] border border-white/[0.1]">
                                            <span className="text-white/[0.3] text-sm">Preview não disponível</span>
                                        </div>
                                    )}
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowThemePreview(null)}
                                        className="flex-1 py-3 bg-white/[0.1] rounded-[3px] font-['DM_Sans'] hover:bg-white/[0.2] transition"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedTheme(showThemePreview.id);
                                            setShowThemePreview(null);
                                            setCurrentStep(3);
                                        }}
                                        className="flex-1 py-3 bg-[#8a00c4] rounded-[3px] font-['DM_Sans'] font-bold hover:bg-[#a600eb] transition shadow-[0_0_15px_rgba(138,0,196,0.3)]"
                                    >
                                        Selecionar Este Tema
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: PRODUCT CTA */}
                        {currentStep === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <button onClick={() => setCurrentStep(2)} className="text-white/[0.5] hover:text-white transition">
                                        ← Voltar
                                    </button>
                                    <h2 className="font-['Sora'] font-bold text-xl">Configurar Produto (Opcional)</h2>
                                    <div className="w-12"></div>
                                </div>

                                <div className="space-y-6">
                                    {/* Toggle Product Mode */}
                                    <div
                                        onClick={() => setIsProductMode(!isProductMode)}
                                        className={`p-4 rounded-[3px] border cursor-pointer transition flex items-center justify-between ${isProductMode
                                            ? 'bg-[#8a00c4]/10 border-[#8a00c4]'
                                            : 'bg-[#0a0a0a] border-white/[0.1] hover:border-white/[0.3]'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${isProductMode ? 'border-[#8a00c4] bg-[#8a00c4]' : 'border-white/[0.3]'
                                                }`}>
                                                {isProductMode && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                            <div>
                                                <h3 className="font-['Sora'] font-semibold">Divulgar um Produto</h3>
                                                <p className="text-xs text-white/[0.5]">Adiciona um CTA focado em vendas no final</p>
                                            </div>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isProductMode && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden space-y-4"
                                            >
                                                <div>
                                                    <label className="font-['Sora'] text-sm block mb-2">O que você está vendendo?</label>
                                                    <textarea
                                                        value={productDescription}
                                                        onChange={(e) => setProductDescription(e.target.value)}
                                                        placeholder="Ex: Ebook sobre produtividade, Curso de marketing..."
                                                        className="w-full px-4 py-3 rounded-[3px] bg-[#0a0a0a] text-white border border-white/[0.1] focus:border-[#8a00c4] outline-none transition font-['DM_Sans'] min-h-[80px]"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="font-['Sora'] text-sm block mb-2">Palavra-chave para o comentário</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/[0.4]">Comente</span>
                                                        <input
                                                            type="text"
                                                            value={ctaText}
                                                            onChange={(e) => setCtaText(e.target.value)}
                                                            placeholder="eu quero"
                                                            className="w-full pl-24 pr-4 py-3 rounded-[3px] bg-[#0a0a0a] text-white border border-white/[0.1] focus:border-[#8a00c4] outline-none transition font-['DM_Sans']"
                                                        />
                                                    </div>
                                                    <p className="text-xs text-white/[0.4] mt-2 bg-white/[0.05] p-2 rounded">
                                                        Preview: &quot;Comente <strong>&quot;{ctaText}&quot;</strong> que te mando o material na sua DM!&quot;
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/[0.1]">
                                    {/* Token cost indicator */}
                                    {pricing && selectedTheme && (
                                        (() => {
                                            const baseCost = pricing.themeCosts[selectedTheme] ?? 40;
                                            const totalCost = isProductMode ? baseCost + pricing.productModeExtraCost : baseCost;
                                            const hasEnough = balance >= totalCost;

                                            return (
                                                <div className={`mb-4 p-3 rounded-[3px] border flex items-center justify-between ${hasEnough
                                                    ? 'bg-white/[0.03] border-white/[0.1]'
                                                    : 'bg-red-500/10 border-red-500/20'
                                                    }`}>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-white/60">Cost:</span>
                                                        <span className="font-bold text-white">{totalCost} tokens</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-white/40">Available:</span>
                                                        <span className={`font-bold ${hasEnough ? 'text-white' : 'text-red-400'}`}>
                                                            {creditsLoading ? '...' : `${balance.toLocaleString()} tokens`}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    )}

                                    {error && (
                                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-[3px] text-red-400 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    {pricing && selectedTheme && balance < ((pricing.themeCosts[selectedTheme] ?? 40) + (isProductMode ? pricing.productModeExtraCost : 0)) ? (
                                        <a
                                            href="/my-account"
                                            className="w-full py-4 rounded-[3px] font-['DM_Sans'] font-bold transition flex items-center justify-center gap-2 bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30"
                                        >
                                            Insufficient tokens — Get more
                                        </a>
                                    ) : (
                                        <button
                                            onClick={handleGenerate}
                                            disabled={loading}
                                            className={`w-full py-4 rounded-[3px] font-['DM_Sans'] font-bold transition flex items-center justify-center gap-2 ${loading
                                                ? 'bg-white/[0.1] text-white/[0.3] cursor-not-allowed'
                                                : 'bg-[#8a00c4] text-white hover:bg-[#a600eb] shadow-[0_0_20px_rgba(138,0,196,0.3)]'
                                                }`}
                                        >
                                            {loading ? (
                                                <>
                                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    {status}
                                                </>
                                            ) : (
                                                'Criar Post Magico'
                                            )}
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </main>
        </SetupRequiredGuard>
    );
}
