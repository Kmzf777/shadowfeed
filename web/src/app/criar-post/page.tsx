'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../../contexts/AuthContext';
import { useCredits, useThemePricing, useModelPricing, purchaseExtraTokens } from '../../hooks/useCredits';
import type { LLMModel } from '../../hooks/useCredits';
import { SetupRequiredGuard } from '../../components/SetupRequiredGuard';
import { motion, AnimatePresence } from 'framer-motion';
import { SlideFrame } from '../../components/renderer/primitives/SlideFrame';
import { SlideRouter } from '../../components/renderer/SlideRouter';
import { Sparkles, Zap, Crown } from 'lucide-react';
import type { SlideData, ProfileData } from '@/types/renderer/slide.types';
import { useLanguage } from '../../contexts/LanguageContext';

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
        description: 'Visual sofisticado e elegante, ideal para conteudo editorial e narrativas visuais.',
        slideCount: { min: 5, max: 10 },
        contentDensity: 'medium',
        emojiUsage: 'minimal'
    },
    {
        id: 'twitter',
        name: 'Twitter Thread',
        description: 'Estilo casual e direto, perfeito para insights rapidos e engajamento.',
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
        description: 'Estruturado para ensinar, com foco em clareza e progressao logica.',
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
        headline: 'O Futuro do **Conteudo**',
        subtitle: 'EDITORIAL',
        body: 'Descubra como a inteligencia artificial esta redefinindo a criacao de narrativas digitais.',
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
        headline: 'Como criar **Posts Virais** em 3 passos simples',
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
        headline: 'Menos e **Mais**.',
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
        body: 'Tudo o que voce precisa saber para ranquear no topo em 2024.',
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

const MODEL_ICONS: Record<string, typeof Zap> = {
    'marketing-friend': Zap,
    'copywriter': Sparkles,
    'shadowfeed': Crown,
};

const DEFAULT_MODELS: LLMModel[] = [
    {
        id: 'marketing-friend',
        displayName: 'Marketing Friend',
        provider: 'openai',
        modelId: 'gpt-3.5-turbo',
        tierOrder: 1,
        description: 'Ideal para posts rápidos e criativos.',
        active: true,
        estimatedTokensPerPost: 5
    },
    {
        id: 'copywriter',
        displayName: 'Expert Copywriter',
        provider: 'anthropic',
        modelId: 'claude-3-sonnet',
        tierOrder: 2,
        description: 'Textos mais persuasivos e elaborados.',
        active: true,
        estimatedTokensPerPost: 10
    },
    {
        id: 'shadowfeed',
        displayName: 'ShadowFeed Ultimate',
        provider: 'openai',
        modelId: 'gpt-4-turbo',
        tierOrder: 3,
        description: 'A melhor qualidade possível.',
        active: false,
        estimatedTokensPerPost: 25
    }
];

export default function CriarPostPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const { user } = useAuth();
    const { balance, planRemaining, freeTokens, extraTokens, subscription, loading: creditsLoading } = useCredits();
    const pricing = useThemePricing();
    const { models, loading: modelsLoading } = useModelPricing();

    // State
    const [currentStep, setCurrentStep] = useState(1);
    const [url, setUrl] = useState('');
    const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<string>('marketing-friend');
    const [themes, setThemes] = useState<PostTheme[]>(DEFAULT_THEMES);
    const [isProductMode, setIsProductMode] = useState(false);
    const [productDescription, setProductDescription] = useState('');
    const [ctaText, setCtaText] = useState('eu quero');

    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [showThemePreview, setShowThemePreview] = useState<PostTheme | null>(null);

    // Fetch themes from API
    useEffect(() => {
        async function fetchThemes() {
            try {
                const res = await fetch(`${API_URL}/api/forge-personalized/themes`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        setThemes(data);
                    }
                }
            } catch (err) {
                console.log('Using default themes (API not available)');
            }
        }
        fetchThemes();
    }, []);


    const availableModels = models.length > 0 ? models : DEFAULT_MODELS;
    const activeModels = availableModels.filter(m => m.active);
    const selectedModelData = activeModels.find(m => m.id === selectedModel);
    const tokenCost = selectedModelData?.estimatedTokensPerPost ?? 7;

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
                setError('URL invalida. Verifique o formato.');
            }
        } else if (currentStep === 2 && selectedTheme) {
            setCurrentStep(3);
        } else if (currentStep === 3) {
            setCurrentStep(4);
        }
    };

    const handleGenerate = async () => {
        if (!url.trim() || !selectedTheme) return;

        if (!user?.id) {
            setError('You need to be logged in to create posts.');
            return;
        }

        const body = {
            url: url.trim(),
            themeId: selectedTheme,
            userId: user.id,
            productMode: isProductMode,
            productDescription: isProductMode ? productDescription : undefined,
            ctaText: isProductMode ? ctaText : undefined,
            modelConfigId: selectedModel,
        };

        fetch(`${API_URL}/api/forge-personalized/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        }).then(res => {
            if (!res.ok) {
                console.error('Error generating post - status:', res.status);
            }
        }).catch(err => {
            console.error('Error starting post generation:', err);
        });

        router.push('/my-posts?generating=true');
    };

    const postsRemaining = tokenCost > 0 ? Math.floor(balance / tokenCost) : 0;

    return (
        <SetupRequiredGuard>
            <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center relative overflow-hidden gap-8 p-4">

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
                                <h2 className="font-['Sora'] font-bold text-2xl text-center mb-2">{t('createPost.step1.title')}</h2>
                                <p className="font-['DM_Sans'] text-white/[0.5] text-center mb-8">
                                    {t('createPost.step1.subtitle')}
                                </p>

                                <div className="space-y-4">
                                    <div className="relative">
                                        <input
                                            type="url"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            placeholder={t('createPost.step1.placeholder')}
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
                                        {t('createPost.step1.submit')}
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
                                        &#8592; {t('createPost.step2.back')}
                                    </button>
                                    <div className="text-center">
                                        <h2 className="font-['Sora'] font-bold text-xl">{t('createPost.step2.title')}</h2>
                                        <p className="font-['DM_Sans'] text-white/[0.5] text-sm">{t('createPost.step2.subtitle')}</p>
                                    </div>
                                    <div className="w-12"></div>
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
                                                        <span className="text-white/[0.3] text-xs">{t('createPost.step2.previewUnavailable')}</span>
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
                                <div className="mb-4">
                                    <h3 className="font-['Sora'] font-bold text-xl text-center">{showThemePreview.name}</h3>
                                    <p className="font-['DM_Sans'] text-white/[0.6] text-center text-sm mt-1">{showThemePreview.description}</p>
                                </div>

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
                                            <span className="text-white/[0.3] text-sm">{t('createPost.step2.previewUnavailable')}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowThemePreview(null)}
                                        className="flex-1 py-3 bg-white/[0.1] rounded-[3px] font-['DM_Sans'] hover:bg-white/[0.2] transition"
                                    >
                                        {t('createPost.step2.cancel')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedTheme(showThemePreview.id);
                                            setShowThemePreview(null);
                                            setCurrentStep(3);
                                        }}
                                        className="flex-1 py-3 bg-[#8a00c4] rounded-[3px] font-['DM_Sans'] font-bold hover:bg-[#a600eb] transition shadow-[0_0_15px_rgba(138,0,196,0.3)]"
                                    >
                                        {t('createPost.step2.selectTheme')}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: MODEL SELECTION */}
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
                                        &#8592; {t('createPost.step2.back')}
                                    </button>
                                    <div className="text-center">
                                        <h2 className="font-['Sora'] font-bold text-xl">{t('createPost.step3.title')}</h2>
                                        <p className="font-['DM_Sans'] text-white/[0.5] text-sm">{t('createPost.step3.subtitle')}</p>
                                    </div>
                                    <div className="w-12"></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {modelsLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="w-6 h-6 border-2 border-[#8a00c4] border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : (
                                        <>
                                            {activeModels.map((model) => {
                                                const Icon = MODEL_ICONS[model.id] || Zap;
                                                const isSelected = selectedModel === model.id;
                                                const estCost = model.estimatedTokensPerPost ?? 0;
                                                const postsWithModel = estCost > 0 ? Math.floor(balance / estCost) : 0;

                                                return (
                                                    <div
                                                        key={model.id}
                                                        onClick={() => setSelectedModel(model.id)}
                                                        className={`p-4 rounded-[3px] border cursor-pointer transition hover:scale-[1.01] ${isSelected
                                                            ? 'bg-[#8a00c4]/15 border-[#8a00c4]'
                                                            : 'bg-[#0a0a0a] border-white/[0.1] hover:border-white/[0.2]'
                                                            }`}
                                                    >
                                                        <div className="flex flex-col items-center gap-3 text-center h-full pt-2">
                                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${isSelected ? 'bg-[#8a00c4]/30' : 'bg-white/[0.05]'}`}>
                                                                <Icon size={24} className={isSelected ? 'text-[#8a00c4]' : 'text-white/50'} />
                                                            </div>
                                                            <div className="flex-1 flex flex-col items-center w-full">
                                                                <h3 className="font-['Sora'] font-semibold text-white text-lg mb-1">{model.displayName}</h3>

                                                                <div className="flex items-center justify-center gap-2 mb-2">
                                                                    <span className="text-sm font-bold text-white">{estCost}</span>
                                                                    <span className="text-xs text-white/40">{t('createPost.step3.tokensPerPost')}</span>
                                                                </div>

                                                                <p className="font-['DM_Sans'] text-white/[0.5] text-sm mb-4 flex-grow px-2">{model.description}</p>

                                                                <div className="flex flex-col items-center gap-1 mt-auto w-full pt-4 border-t border-white/[0.05]">
                                                                    {!creditsLoading && (
                                                                        <span className={`text-xs font-medium ${postsWithModel > 10 ? 'text-green-400/70' : postsWithModel > 0 ? 'text-yellow-400/70' : 'text-red-400/70'}`}>
                                                                            ~{postsWithModel} {t('createPost.step3.postsRemaining')}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-[10px] text-white/20 uppercase tracking-wider">{model.modelId}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {/* Show inactive models as "Coming Soon" */}
                                            {availableModels.filter(m => !m.active).map((model) => {
                                                const Icon = MODEL_ICONS[model.id] || Crown;
                                                return (
                                                    <div
                                                        key={model.id}
                                                        className="p-4 rounded-[3px] border border-white/[0.05] bg-[#0a0a0a] opacity-50 cursor-not-allowed"
                                                    >
                                                        <div className="flex flex-col items-center gap-3 text-center h-full pt-2">
                                                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/[0.03] mb-1">
                                                                <Icon size={24} className="text-white/30" />
                                                            </div>
                                                            <div className="flex-1 flex flex-col items-center w-full">
                                                                <h3 className="font-['Sora'] font-semibold text-white/50 text-lg mb-2">{model.displayName}</h3>
                                                                <span className="text-xs bg-white/[0.05] text-white/30 px-2 py-1 rounded-[3px] mb-3">{t('createPost.step3.comingSoon')}</span>
                                                                <p className="font-['DM_Sans'] text-white/[0.3] text-sm flex-grow px-2">{model.description}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </>
                                    )}
                                </div>

                                <button
                                    onClick={handleNextStep}
                                    className="w-full mt-6 py-4 rounded-[3px] font-['DM_Sans'] font-bold transition bg-[#8a00c4] text-white hover:bg-[#a600eb] shadow-[0_0_20px_rgba(138,0,196,0.3)]"
                                >
                                    Continue
                                </button>
                            </motion.div>
                        )}

                        {/* STEP 4: PRODUCT CTA */}
                        {currentStep === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <button onClick={() => setCurrentStep(3)} className="text-white/[0.5] hover:text-white transition">
                                        &#8592; {t('createPost.step2.back')}
                                    </button>
                                    <h2 className="font-['Sora'] font-bold text-xl">{t('createPost.step4.title')}</h2>
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
                                                <h3 className="font-['Sora'] font-semibold">{t('createPost.step4.toggleLabel')}</h3>
                                                <p className="text-xs text-white/[0.5]">{t('createPost.step4.toggleDesc')}</p>
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
                                                    <label className="font-['Sora'] text-sm block mb-2">{t('createPost.step4.productLabel')}</label>
                                                    <textarea
                                                        value={productDescription}
                                                        onChange={(e) => setProductDescription(e.target.value)}
                                                        placeholder={t('createPost.step4.productPlaceholder')}
                                                        className="w-full px-4 py-3 rounded-[3px] bg-[#0a0a0a] text-white border border-white/[0.1] focus:border-[#8a00c4] outline-none transition font-['DM_Sans'] min-h-[80px]"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="font-['Sora'] text-sm block mb-2">{t('createPost.step4.keywordLabel')}</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/[0.4]">{t('createPost.step4.comment')}</span>
                                                        <input
                                                            type="text"
                                                            value={ctaText}
                                                            onChange={(e) => setCtaText(e.target.value)}
                                                            placeholder="eu quero"
                                                            className="w-full pl-24 pr-4 py-3 rounded-[3px] bg-[#0a0a0a] text-white border border-white/[0.1] focus:border-[#8a00c4] outline-none transition font-['DM_Sans']"
                                                        />
                                                    </div>
                                                    <p className="text-xs text-white/[0.4] mt-2 bg-white/[0.05] p-2 rounded">
                                                        {t('createPost.step4.preview')}: &quot;{t('createPost.step4.comment')} <strong>&quot;{ctaText}&quot;</strong> {t('createPost.step4.dmMessage')}&quot;
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/[0.1]">
                                    {/* Token cost indicator */}
                                    {selectedModelData && (
                                        (() => {
                                            const hasEnough = balance >= tokenCost;

                                            return (
                                                <div className={`mb-4 p-3 rounded-[3px] border ${hasEnough
                                                    ? 'bg-white/[0.03] border-white/[0.1]'
                                                    : 'bg-red-500/10 border-red-500/20'
                                                    }`}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-white/60">{t('createPost.step4.cost')}:</span>
                                                            <span className="font-bold text-white">~{tokenCost} tokens</span>
                                                            <span className="text-xs text-white/30">({selectedModelData.displayName})</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-white/40">{t('createPost.step4.available')}:</span>
                                                            <span className={`font-bold ${hasEnough ? 'text-white' : 'text-red-400'}`}>
                                                                {creditsLoading ? '...' : `${balance.toLocaleString()} tokens`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {!creditsLoading && (
                                                        <div className="flex items-center gap-3 text-[10px]">
                                                            {planRemaining > 0 && (
                                                                <span className="text-[#a855f7]">Plan: {planRemaining.toLocaleString()}</span>
                                                            )}
                                                            {freeTokens > 0 && (
                                                                <span className="text-green-400">Free: {freeTokens.toLocaleString()}</span>
                                                            )}
                                                            {extraTokens > 0 && (
                                                                <span className="text-yellow-400">Extra: {extraTokens.toLocaleString()}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()
                                    )}

                                    {error && (
                                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-[3px] text-red-400 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    {balance < tokenCost ? (
                                        <a
                                            href="/my-account"
                                            className="w-full py-4 rounded-[3px] font-['DM_Sans'] font-bold transition flex items-center justify-center gap-2 bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30"
                                        >
                                            {t('createPost.step4.insufficientTokens')}
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
                                                t('createPost.step4.createMagicPost')
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
