'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useCredits, useThemePricing, useModelPricing } from '../../hooks/useCredits';
import type { LLMModel } from '../../hooks/useCredits';
import { SetupRequiredGuard } from '../../components/SetupRequiredGuard';
import { motion, AnimatePresence } from 'framer-motion';
import { SlideFrame } from '../../components/renderer/primitives/SlideFrame';
import { SlideRouter } from '../../components/renderer/SlideRouter';
import { Sparkles, Zap, Crown, Terminal, ArrowRight, Link as LinkIcon, Wand2 } from 'lucide-react';
import type { SlideData, ProfileData } from '@/types/renderer/slide.types';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';
import { Sidebar } from '../../components/Sidebar';

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
    const searchParams = useSearchParams();
    const prefillUrl = searchParams.get('url');
    const { t } = useLanguage();
    const { user } = useAuth();
    const { balance, planRemaining, freeTokens, extraTokens, subscription, loading: creditsLoading } = useCredits();
    // const pricing = useThemePricing(); // Unused
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

    // Creation mode
    const [creationMode, setCreationMode] = useState<'manual' | 'auto'>('manual');
    const [userTargetAudience, setUserTargetAudience] = useState<string | null>(null);

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

    // Handle URL pre-fill from query params
    useEffect(() => {
        if (prefillUrl) {
            setUrl(prefillUrl);
            const timer = setTimeout(() => {
                setCurrentStep(2);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [prefillUrl]);

    // Fetch target_audience for auto mode card
    useEffect(() => {
        if (!user?.id) return;
        supabase
            .from('users')
            .select('target_audience')
            .eq('id', user.id)
            .single()
            .then(({ data }) => {
                if (data?.target_audience) setUserTargetAudience(data.target_audience);
            });
    }, [user?.id]);


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
        if (currentStep === 1) {
            if (creationMode === 'manual' && url.trim()) {
                try {
                    new URL(url);
                    setError(null);
                    setCurrentStep(2);
                } catch {
                    setError('URL invalida. Verifique o formato.');
                }
            } else if (creationMode === 'auto') {
                setCurrentStep(2);
            }
        } else if (currentStep === 2 && selectedTheme) {
            setCurrentStep(3);
        } else if (currentStep === 3) {
            setCurrentStep(4);
        }
    };

    const handleGenerate = async () => {
        setLoading(true);
        setStatus('Initializing...');
        if (creationMode === 'manual' && !url.trim()) { setLoading(false); return; }
        if (!selectedTheme) { setLoading(false); return; }

        if (!user?.id) {
            setError('You need to be logged in to create posts.');
            setLoading(false);
            return;
        }

        const isAutoMode = creationMode === 'auto';
        const endpoint = isAutoMode
            ? `${API_URL}/api/forge-smart/generate`
            : `${API_URL}/api/forge-personalized/generate`;
        const body = isAutoMode
            ? {
                userId: user.id,
                themeId: selectedTheme,
                productMode: isProductMode,
                productDescription: isProductMode ? productDescription : undefined,
                ctaText: isProductMode ? ctaText : undefined,
                modelConfigId: selectedModel,
            }
            : {
                url: url.trim(),
                themeId: selectedTheme,
                userId: user.id,
                productMode: isProductMode,
                productDescription: isProductMode ? productDescription : undefined,
                ctaText: isProductMode ? ctaText : undefined,
                modelConfigId: selectedModel,
            };

        try {
            fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            }).then(res => {
                if (!res.ok) {
                    console.error('Error generating post - status:', res.status);
                    setError('Failed to start generation.');
                    setLoading(false);
                } else {
                    router.push('/my-posts?generating=true');
                }
            });
        } catch (err) {
            console.error('Error starting post generation:', err);
            setError('An unexpected error occurred.');
            setLoading(false);
        }
    };

    const totalSteps = creationMode === 'auto' ? 3 : 4;

    const handleBack = () => {
        if (showThemePreview) {
            setShowThemePreview(null);
            return;
        }
        if (currentStep > 1) {
            setCurrentStep(s => s - 1);
        } else {
            router.push('/my-posts');
        }
    };

    return (
        <SetupRequiredGuard>
            <div className="flex min-h-screen bg-[#050505] justify-center">
                <main className="flex-1 max-w-5xl p-8 relative min-h-screen flex flex-col items-center justify-center">

                    {/* Background decorations */}
                    <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
                        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#8a00c4]/30 rounded-full blur-[120px]" />
                        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#8a00c4]/20 rounded-full blur-[120px]" />
                    </div>

                    {/* Back to Home Button */}
                    <div className="fixed top-8 left-8 z-50">
                        <button
                            onClick={() => router.push('/')}
                            className="flex items-center gap-2 text-[#808080] hover:text-[#d4d4d4] transition-colors group"
                        >
                            <div className="w-8 h-8 rounded-full border border-[#2a2a2a] bg-[#0a0a0a] flex items-center justify-center group-hover:border-[#8a00c4] group-hover:bg-[#8a00c4]/10 transition-all">
                                <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                            </div>
                            <span className="text-xs font-mono uppercase tracking-wider">Back to Home</span>
                        </button>
                    </div>

                    <div className="relative z-10 w-full max-w-2xl">
                        {/* Terminal Window */}
                        <div className="bg-[#111111] border border-[#1e1e1e] rounded shadow-2xl overflow-hidden relative">
                            {/* Terminal Header */}
                            <div className="h-10 bg-[#161616] border-b border-[#1e1e1e] flex items-center justify-between px-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                                    <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                                </div>
                                <div className="text-[#4a4a4a] text-xs font-mono flex items-center gap-1">
                                    <Terminal size={12} />
                                    <span>create_post.exe</span>
                                </div>
                                <div className="w-16" /> {/* Spacer */}
                            </div>

                            {/* Terminal Content */}
                            <div className="p-8 min-h-[500px] flex flex-col">
                                {/* Progress Bar */}
                                <div className="mb-8">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[#808080] text-xs font-mono uppercase tracking-wider">Progress</span>
                                        <span className="text-[#808080] text-xs font-mono">{Math.round((currentStep / totalSteps) * 100)}%</span>
                                    </div>
                                    <div className="h-1 bg-[#1e1e1e] rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                                            className="h-full bg-[#8a00c4] shadow-[0_0_10px_#8a00c4]"
                                        />
                                    </div>
                                </div>

                                <AnimatePresence mode='wait'>
                                    {/* STEP 1 */}
                                    {currentStep === 1 && (
                                        <motion.div
                                            key="step1"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="flex-1 flex flex-col"
                                        >
                                            <div className="text-center mb-8">
                                                <h1 className="text-2xl font-bold text-[#d4d4d4] font-mono mb-2">{t('createPost.step1.title')}</h1>
                                                <p className="text-[#808080] text-sm">{t('createPost.step1.subtitle')}</p>
                                            </div>

                                            {/* Mode Toggle */}
                                            <div className="flex justify-center mb-8">
                                                <div className="bg-[#0a0a0a] border border-[#1e1e1e] p-1 rounded-lg flex gap-1">
                                                    <button
                                                        onClick={() => setCreationMode('manual')}
                                                        className={`px-4 py-2 rounded text-xs font-mono uppercase tracking-wide transition-all ${creationMode === 'manual' ? 'bg-[#1e1e1e] text-[#d4d4d4] border border-[#2a2a2a]' : 'text-[#4a4a4a] hover:text-[#808080]'}`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <LinkIcon size={14} />
                                                            <span>URL Input</span>
                                                        </div>
                                                    </button>
                                                    <button
                                                        onClick={() => setCreationMode('auto')}
                                                        className={`px-4 py-2 rounded text-xs font-mono uppercase tracking-wide transition-all ${creationMode === 'auto' ? 'bg-[#8a00c4]/20 text-[#c084fc] border border-[#8a00c4]/50 shadow-[0_0_10px_rgba(138,0,196,0.2)]' : 'text-[#4a4a4a] hover:text-[#808080]'}`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Wand2 size={14} />
                                                            <span>Auto Mode</span>
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>

                                            {creationMode === 'manual' ? (
                                                <div className="space-y-4 max-w-md mx-auto w-full">
                                                    <div className="relative group">
                                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#8a00c4] to-[#4a00e0] rounded opacity-0 group-focus-within:opacity-20 transition duration-500 blur"></div>
                                                        <input
                                                            type="url"
                                                            value={url}
                                                            onChange={(e) => setUrl(e.target.value)}
                                                            placeholder="https://..."
                                                            className="relative w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#d4d4d4] px-4 py-3 rounded focus:outline-none focus:border-[#8a00c4] font-mono text-sm placeholder-[#4a4a4a]"
                                                            autoFocus
                                                            onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
                                                        />
                                                    </div>
                                                    {error && <p className="text-red-500 text-xs font-mono bg-red-500/10 p-2 border border-red-500/20 rounded">{error}</p>}

                                                    <button
                                                        onClick={handleNextStep}
                                                        className="w-full bg-[#d4d4d4] text-[#050505] font-bold py-3 rounded hover:bg-white transition-all uppercase tracking-wide text-xs font-mono flex items-center justify-center gap-2 group"
                                                    >
                                                        <span>Next Step</span>
                                                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="max-w-md mx-auto w-full text-center space-y-6">
                                                    <div className="bg-[#161616] border border-[#2a2a2a] p-6 rounded relative overflow-hidden group">
                                                        <div className="absolute inset-0 bg-gradient-to-b from-[#8a00c4]/5 to-transparent opacity-50" />
                                                        <div className="relative z-10">
                                                            <h3 className="text-[#d4d4d4] font-bold mb-2 font-mono">Auto-Discovery Protocol</h3>
                                                            <p className="text-[#808080] text-sm mb-4">
                                                                System will analyze target audience params and generate optimal content strategy.
                                                            </p>
                                                            <div className="bg-[#0a0a0a] border border-[#1e1e1e] p-3 rounded text-left">
                                                                <span className="text-[#8a00c4] text-xs font-mono block mb-1">Target Audience:</span>
                                                                <span className="text-[#d4d4d4] font-mono text-sm">{userTargetAudience || 'Not defined'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setCurrentStep(2)}
                                                        className="w-full bg-[#8a00c4] text-white font-bold py-3 rounded hover:bg-[#9d00de] transition-all uppercase tracking-wide text-xs font-mono flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(138,0,196,0.3)] hover:shadow-[0_0_25px_rgba(138,0,196,0.5)]"
                                                    >
                                                        <span>Initialize Auto-Mode</span>
                                                        <Sparkles size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {/* STEP 2: Theme Selection */}
                                    {currentStep === 2 && (
                                        <motion.div
                                            key="step2"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="flex-1 flex flex-col"
                                        >
                                            <div className="flex items-center justify-between mb-6">
                                                <button onClick={() => setCurrentStep(1)} className="text-[#4a4a4a] hover:text-[#d4d4d4] text-xs font-mono flex items-center gap-1 transition-colors">
                                                    <span className="text-lg">‹</span> BACK
                                                </button>
                                                <h2 className="text-[#d4d4d4] font-bold font-mono">SELECT_THEME</h2>
                                                <div className="w-12" />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
                                                {themes.map(theme => (
                                                    <div
                                                        key={theme.id}
                                                        onClick={() => { setSelectedTheme(theme.id); setCurrentStep(3); }}
                                                        className={`p-4 bg-[#0a0a0a] border rounded cursor-pointer transition-all group hover:border-[#8a00c4] hover:shadow-[0_0_10px_rgba(138,0,196,0.1)] relative overflow-hidden ${selectedTheme === theme.id ? 'border-[#8a00c4] bg-[#8a00c4]/5' : 'border-[#1e1e1e]'}`}
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h3 className="text-[#d4d4d4] font-bold text-sm font-mono">{theme.name}</h3>
                                                            <div className={`w-3 h-3 rounded-full border ${selectedTheme === theme.id ? 'bg-[#8a00c4] border-[#8a00c4]' : 'border-[#2a2a2a]'}`} />
                                                        </div>
                                                        <p className="text-[#808080] text-xs mb-3 line-clamp-2">{theme.description}</p>
                                                        <div className="flex gap-2">
                                                            <span className="text-[10px] bg-[#161616] border border-[#2a2a2a] px-1.5 py-0.5 rounded text-[#4a4a4a] uppercase">{theme.slideCount.min}-{theme.slideCount.max} slides</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* STEP 3: Model Selection */}
                                    {currentStep === 3 && (
                                        <motion.div
                                            key="step3"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="flex-1 flex flex-col"
                                        >
                                            <div className="flex items-center justify-between mb-6">
                                                <button onClick={() => setCurrentStep(2)} className="text-[#4a4a4a] hover:text-[#d4d4d4] text-xs font-mono flex items-center gap-1 transition-colors">
                                                    <span className="text-lg">‹</span> BACK
                                                </button>
                                                <h2 className="text-[#d4d4d4] font-bold font-mono">SELECT_MODEL</h2>
                                                <div className="w-12" />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                {activeModels.map(model => {
                                                    const Icon = MODEL_ICONS[model.id] || Zap;
                                                    const isSelected = selectedModel === model.id;
                                                    return (
                                                        <div
                                                            key={model.id}
                                                            onClick={() => setSelectedModel(model.id)}
                                                            className={`p-4 bg-[#0a0a0a] border rounded cursor-pointer transition-all hover:bg-[#111111] flex flex-col items-center text-center gap-3 ${isSelected ? 'border-[#8a00c4] shadow-[0_0_10px_rgba(138,0,196,0.15)] ring-1 ring-[#8a00c4]' : 'border-[#1e1e1e]'}`}
                                                        >
                                                            <div className={`p-3 rounded-full ${isSelected ? 'bg-[#8a00c4]/20 text-[#c084fc]' : 'bg-[#161616] text-[#4a4a4a]'}`}>
                                                                <Icon size={20} />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-[#d4d4d4] font-bold text-sm">{model.displayName}</h3>
                                                                <p className="text-[#808080] text-[10px] mt-1">{model.description}</p>
                                                            </div>
                                                            <div className="mt-auto pt-3 border-t border-[#1e1e1e] w-full">
                                                                <span className="text-[#8a00c4] font-mono text-xs font-bold">{model.estimatedTokensPerPost || 0} tk</span>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            <button
                                                onClick={handleNextStep}
                                                className="w-full mt-8 bg-[#d4d4d4] text-[#050505] font-bold py-3 rounded hover:bg-white transition-all uppercase tracking-wide text-xs font-mono flex items-center justify-center gap-2 group"
                                            >
                                                <span>Continue Configuration</span>
                                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </motion.div>
                                    )}

                                    {/* STEP 4: Product / Finalize */}
                                    {currentStep === 4 && (
                                        <motion.div
                                            key="step4"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="flex-1 flex flex-col"
                                        >
                                            <div className="flex items-center justify-between mb-6">
                                                <button onClick={() => setCurrentStep(3)} className="text-[#4a4a4a] hover:text-[#d4d4d4] text-xs font-mono flex items-center gap-1 transition-colors">
                                                    <span className="text-lg">‹</span> BACK
                                                </button>
                                                <h2 className="text-[#d4d4d4] font-bold font-mono">FINALIZE</h2>
                                                <div className="w-12" />
                                            </div>

                                            <div className="space-y-4 mb-8">
                                                <div
                                                    onClick={() => setIsProductMode(!isProductMode)}
                                                    className={`p-4 border rounded cursor-pointer transition-all flex items-center gap-4 ${isProductMode ? 'bg-[#8a00c4]/10 border-[#8a00c4]' : 'bg-[#0a0a0a] border-[#1e1e1e] hover:border-[#2a2a2a]'}`}
                                                >
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${isProductMode ? 'bg-[#8a00c4] border-[#8a00c4]' : 'bg-[#161616] border-[#2a2a2a]'}`}>
                                                        {isProductMode && <Sparkles size={12} className="text-white bg-transparent" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-[#d4d4d4] font-bold text-sm">Product Promotion Mode</h4>
                                                        <p className="text-[#808080] text-xs">Inject specific product details into the narrative</p>
                                                    </div>
                                                </div>

                                                <AnimatePresence>
                                                    {isProductMode && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden space-y-4 pt-2"
                                                        >
                                                            <div>
                                                                <label className="text-[#808080] text-xs font-mono uppercase mb-1 block">Product Details</label>
                                                                <textarea
                                                                    value={productDescription}
                                                                    onChange={(e) => setProductDescription(e.target.value)}
                                                                    className="w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded p-3 text-[#d4d4d4] text-sm focus:border-[#8a00c4] focus:outline-none min-h-[80px]"
                                                                    placeholder="Describe your product or offer..."
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[#808080] text-xs font-mono uppercase mb-1 block">CTA Button Text</label>
                                                                <input
                                                                    type="text"
                                                                    value={ctaText}
                                                                    onChange={(e) => setCtaText(e.target.value)}
                                                                    className="w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded p-3 text-[#d4d4d4] text-sm focus:border-[#8a00c4] focus:outline-none"
                                                                    placeholder="e.g., Learn More"
                                                                />
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Cost Summary */}
                                            <div className="mt-auto bg-[#0a0a0a] border border-[#1e1e1e] p-4 rounded mb-4">
                                                <div className="flex justify-between items-center text-xs font-mono mb-2">
                                                    <span className="text-[#808080]">ESTIMATED COST</span>
                                                    <span className="text-[#d4d4d4]">{tokenCost} TOKENS</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs font-mono">
                                                    <span className="text-[#808080]">BALANCE</span>
                                                    <span className={balance >= tokenCost ? 'text-[#8a00c4]' : 'text-red-500'}>{balance} TOKENS</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleGenerate}
                                                disabled={loading || balance < tokenCost}
                                                className={`w-full py-4 rounded font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${loading || balance < tokenCost ? 'bg-[#1e1e1e] text-[#4a4a4a] cursor-not-allowed' : 'bg-[#8a00c4] text-white hover:bg-[#9d00de] shadow-[0_0_20px_rgba(138,0,196,0.3)]'}`}
                                            >
                                                {loading ? (
                                                    <span className="animate-pulse">PROCESSING...</span>
                                                ) : balance < tokenCost ? (
                                                    <span>INSUFFICIENT TOKENS</span>
                                                ) : (
                                                    <>
                                                        <Zap size={16} />
                                                        <span>EXECUTE GENERATION</span>
                                                    </>
                                                )}
                                            </button>
                                        </motion.div>
                                    )}

                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </SetupRequiredGuard>
    );
}
