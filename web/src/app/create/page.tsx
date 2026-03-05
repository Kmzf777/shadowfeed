'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { OfferSelector } from './components/OfferSelector';
import type { Offer } from './components/OfferSelector';
import { PillarSelector } from './components/PillarSelector';
import type { PillarDisplayConfig } from './components/PillarSelector';
import { usePillarSuggestion } from './components/usePillarSuggestion';
import { DiscoveryProgress } from './components/DiscoveryProgress';
import { DiscoveryCandidates } from './components/DiscoveryCandidates';
import type { DiscoveryCandidate } from './components/DiscoveryCandidates';
import { useCredits, useModelPricing } from '../../hooks/useCredits';
import type { LLMModel } from '../../hooks/useCredits';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Terminal, ArrowRight, Link as LinkIcon, Wand2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

interface PostTheme {
    id: string;
    name: string;
    description: string;
    colorPalette?: {
        bgPrimary: string;
        bgSecondary: string;
        textPrimary: string;
        textSecondary: string;
        accent: string;
    };
    fonts?: {
        headline: string;
        body: string;
    };
    backgroundStrategy?: 'alternate' | 'uniform';
}

const DEFAULT_THEMES: PostTheme[] = [
    {
        id: 'magazine',
        name: 'Magazine',
        description: 'Sophisticated editorial design with alternating dark/light backgrounds.',
        colorPalette: { bgPrimary: '#0A0A0A', bgSecondary: '#F5F0EB', textPrimary: '#F5F0EB', textSecondary: '#A0A0A0', accent: '#8a00c4' },
        fonts: { headline: 'Inter Tight', body: 'Inter' },
        backgroundStrategy: 'alternate',
    },
    {
        id: 'twitter',
        name: 'Twitter Thread',
        description: 'Clean tweet-card layout with uniform white backgrounds.',
        colorPalette: { bgPrimary: '#FFFFFF', bgSecondary: '#0A0A0A', textPrimary: '#0F1419', textSecondary: '#536471', accent: '#8a00c4' },
        fonts: { headline: 'Inter Tight', body: 'Inter' },
        backgroundStrategy: 'uniform',
    },
    {
        id: 'minimalist',
        name: 'Minimalist',
        description: 'Clean and objective design focused on the core message.',
        colorPalette: { bgPrimary: '#f5f5f5', bgSecondary: '#ffffff', textPrimary: '#1a1a1a', textSecondary: '#808080', accent: '#1a1a1a' },
        fonts: { headline: 'Inter', body: 'Inter' },
        backgroundStrategy: 'uniform',
    },
    {
        id: 'educational',
        name: 'Educational',
        description: 'Structured for teaching, with clear visual progression.',
        colorPalette: { bgPrimary: '#1e1e1e', bgSecondary: '#2a2a2a', textPrimary: '#ffffff', textSecondary: '#a0a0a0', accent: '#8a00c4' },
        fonts: { headline: 'Sora', body: 'Inter' },
        backgroundStrategy: 'alternate',
    }
];

const MODEL_ICONS: Record<string, typeof Zap> = {
    'marketing-friend': Zap,
    'copywriter': Sparkles,
};

const DEFAULT_MODELS: LLMModel[] = [
    {
        id: 'marketing-friend',
        displayName: 'Marketing Friend',
        provider: 'google',
        modelId: 'gemini-2.5-flash',
        tierOrder: 1,
        description: 'Fast and creative posts with great value.',
        active: true,
        estimatedTokensPerPost: 5
    },
    {
        id: 'copywriter',
        displayName: 'Expert Copywriter',
        provider: 'google',
        modelId: 'gemini-3-flash-preview',
        tierOrder: 2,
        description: 'More persuasive and elaborate copy.',
        active: true,
        estimatedTokensPerPost: 10
    }
];

// Step mapping:
// Manual: 1=Source, 2=Pillar, 3=Theme, 4=Model, 5=Finalize
// Auto:   1=Pillar, 2=SourceDiscovery, 3=Theme, 4=Model, 5=Finalize

export default function CriarPostPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const prefillUrl = searchParams.get('url');
    const { t } = useLanguage();
    const { user, userProfile } = useAuth();
    const { balance } = useCredits();
    const { models } = useModelPricing();

    // State
    const [currentStep, setCurrentStep] = useState(1);
    const [url, setUrl] = useState('');
    const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
    const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<string>('marketing-friend');
    const [themes, setThemes] = useState<PostTheme[]>(DEFAULT_THEMES);
    const [isProductMode, setIsProductMode] = useState(false);
    const [selectedOfferIndex, setSelectedOfferIndex] = useState<number | null>(null);

    // Pillar state
    const [pillars, setPillars] = useState<PillarDisplayConfig[]>([]);
    const [pillarsLoading, setPillarsLoading] = useState(true);

    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Creation mode
    const [creationMode, setCreationMode] = useState<'manual' | 'auto'>('manual');
    const [userTargetAudience, setUserTargetAudience] = useState<string | null>(null);
    const [userNiche, setUserNiche] = useState<string | null>(null);

    // Discovery state
    const [discoveryLoading, setDiscoveryLoading] = useState(false);
    const [discoveryCandidates, setDiscoveryCandidates] = useState<DiscoveryCandidate[] | null>(null);
    const [selectedCandidate, setSelectedCandidate] = useState<DiscoveryCandidate | null>(null);

    // Smart pillar suggestion
    const suggestedPillarId = usePillarSuggestion(user?.id);

    // Fetch pillars from API
    useEffect(() => {
        async function fetchPillars() {
            setPillarsLoading(true);
            try {
                const res = await fetch(`${API_URL}/api/pillars`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        setPillars(data);
                    }
                }
            } catch {
                console.log('Failed to fetch pillars');
            } finally {
                setPillarsLoading(false);
            }
        }
        fetchPillars();
    }, []);

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
            } catch {
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

    // Fetch target_audience and niche for auto mode
    useEffect(() => {
        if (!user?.id) return;
        supabase
            .from('users')
            .select('target_audience, niche')
            .eq('id', user.id)
            .single()
            .then(({ data }) => {
                if (data?.target_audience) setUserTargetAudience(data.target_audience);
                if (data?.niche) setUserNiche(data.niche);
            });
    }, [user?.id]);

    const availableModels = models.length > 0 ? models : DEFAULT_MODELS;
    const activeModels = availableModels.filter(m => m.active && m.id !== 'shadowfeed');
    const selectedModelData = activeModels.find(m => m.id === selectedModel);
    const tokenCost = selectedModelData?.estimatedTokensPerPost ?? 7;

    const totalSteps = 5;

    const handleNextStep = () => {
        if (creationMode === 'manual') {
            if (currentStep === 1) {
                if (url.trim()) {
                    try {
                        new URL(url);
                        setError(null);
                        setCurrentStep(2);
                    } catch {
                        setError('Invalid URL. Please check the format.');
                    }
                }
            } else if (currentStep === 2 && selectedPillar) {
                setCurrentStep(3);
            } else if (currentStep === 3 && selectedTheme) {
                setCurrentStep(4);
            } else if (currentStep === 4) {
                setCurrentStep(5);
            }
        } else {
            // Auto mode
            if (currentStep === 1 && selectedPillar) {
                setCurrentStep(2);
                // Trigger discovery API call
                setDiscoveryLoading(true);
                setDiscoveryCandidates(null);
                setSelectedCandidate(null);
                fetch(`${API_URL}/api/forge-smart/discover`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user?.id, pillarId: selectedPillar }),
                })
                    .then((res) => res.ok ? res.json() : Promise.reject(new Error('Discovery failed')))
                    .then((data) => {
                        setDiscoveryCandidates(data.candidates);
                        setDiscoveryLoading(false);
                    })
                    .catch((err) => {
                        console.error('Discovery error:', err);
                        setError('Failed to discover content. Please try again.');
                        setDiscoveryLoading(false);
                    });
            } else if (currentStep === 2 && selectedCandidate) {
                setCurrentStep(3);
            } else if (currentStep === 3 && selectedTheme) {
                setCurrentStep(4);
            } else if (currentStep === 4) {
                setCurrentStep(5);
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handlePillarSelect = (pillarId: string) => {
        setSelectedPillar(pillarId);
    };

    const handleGenerate = async () => {
        setLoading(true);
        if (creationMode === 'manual' && !url.trim()) { setLoading(false); return; }
        if (creationMode === 'auto' && !selectedCandidate && !url.trim()) { setLoading(false); return; }
        if (!selectedTheme) { setLoading(false); return; }
        if (!selectedPillar) { setLoading(false); return; }

        if (!user?.id) {
            setError('You need to be logged in to create posts.');
            setLoading(false);
            return;
        }

        const userOffers: Offer[] = userProfile?.offers ?? [];
        const selectedOffer = isProductMode && selectedOfferIndex !== null ? userOffers[selectedOfferIndex] : undefined;

        const isAutoMode = creationMode === 'auto';

        // Auto mode with curated candidate: use forge-personalized with candidate URL
        // Auto mode without candidate (shouldn't happen): fallback to forge-smart
        // Manual mode: use forge-personalized with user URL
        let endpoint: string;
        let body: Record<string, unknown>;

        if (isAutoMode && selectedCandidate?.url) {
            // Curated source selected — send to forge-personalized with the candidate URL
            endpoint = `${API_URL}/api/forge-personalized/generate`;
            body = {
                url: selectedCandidate.url,
                themeId: selectedTheme,
                pillarId: selectedPillar,
                userId: user.id,
                productMode: isProductMode,
                offer: selectedOffer,
                modelConfigId: selectedModel,
            };
        } else if (isAutoMode) {
            // Auto mode without a specific URL (custom URL or no URL candidate)
            endpoint = url.trim()
                ? `${API_URL}/api/forge-personalized/generate`
                : `${API_URL}/api/forge-smart/generate`;
            body = url.trim()
                ? {
                    url: url.trim(),
                    themeId: selectedTheme,
                    pillarId: selectedPillar,
                    userId: user.id,
                    productMode: isProductMode,
                    offer: selectedOffer,
                    modelConfigId: selectedModel,
                }
                : {
                    userId: user.id,
                    themeId: selectedTheme,
                    pillarId: selectedPillar,
                    productMode: isProductMode,
                    offer: selectedOffer,
                    modelConfigId: selectedModel,
                };
        } else {
            endpoint = `${API_URL}/api/forge-personalized/generate`;
            body = {
                url: url.trim(),
                themeId: selectedTheme,
                pillarId: selectedPillar,
                userId: user.id,
                productMode: isProductMode,
                offer: selectedOffer,
                modelConfigId: selectedModel,
            };
        }

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

    // Determine what to render for current step based on mode
    const renderStep = () => {
        if (creationMode === 'manual') {
            switch (currentStep) {
                case 1: return renderSourceStep();
                case 2: return renderPillarStep();
                case 3: return renderThemeStep();
                case 4: return renderModelStep();
                case 5: return renderFinalizeStep();
            }
        } else {
            switch (currentStep) {
                case 1: return renderPillarStep();
                case 2: return renderAutoSourceStep();
                case 3: return renderThemeStep();
                case 4: return renderModelStep();
                case 5: return renderFinalizeStep();
            }
        }
    };

    const renderSourceStep = () => (
        <motion.div
            key="source"
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
                        onClick={() => { setCreationMode('manual'); setCurrentStep(1); }}
                        className={`px-4 py-2 rounded text-xs font-mono uppercase tracking-wide transition-all ${creationMode === 'manual' ? 'bg-[#1e1e1e] text-[#d4d4d4] border border-[#2a2a2a]' : 'text-[#4a4a4a] hover:text-[#808080]'}`}
                    >
                        <div className="flex items-center gap-2">
                            <LinkIcon size={14} />
                            <span>Inserir URL</span>
                        </div>
                    </button>
                    <button
                        onClick={() => { setCreationMode('auto'); setCurrentStep(1); }}
                        className={`px-4 py-2 rounded text-xs font-mono uppercase tracking-wide transition-all ${creationMode === 'auto' ? 'bg-[#8a00c4]/20 text-[#c084fc] border border-[#8a00c4]/50 shadow-[0_0_10px_rgba(138,0,196,0.2)]' : 'text-[#4a4a4a] hover:text-[#808080]'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Wand2 size={14} />
                            <span>Modo Auto</span>
                        </div>
                    </button>
                </div>
            </div>

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
        </motion.div>
    );

    const renderPillarStep = () => (
        <motion.div
            key="pillar"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
        >
            <div className="flex items-center justify-between mb-6">
                {/* In auto mode step 1, show mode toggle instead of back button */}
                {creationMode === 'auto' && currentStep === 1 ? (
                    <div className="flex gap-1 bg-[#0a0a0a] border border-[#1e1e1e] p-0.5 rounded-lg">
                        <button
                            onClick={() => { setCreationMode('manual'); setCurrentStep(1); }}
                            className="px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wide text-[#4a4a4a] hover:text-[#808080] transition-all"
                        >
                            <LinkIcon size={12} />
                        </button>
                        <button
                            className="px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wide bg-[#8a00c4]/20 text-[#c084fc] border border-[#8a00c4]/50"
                        >
                            <Wand2 size={12} />
                        </button>
                    </div>
                ) : (
                    <button onClick={handleBack} className="text-[#4a4a4a] hover:text-[#d4d4d4] text-xs font-mono flex items-center gap-1 transition-colors">
                        <span className="text-lg">‹</span> VOLTAR
                    </button>
                )}
                <h2 className="text-[#d4d4d4] font-bold font-mono">SELECIONAR_PILAR</h2>
                <div className="w-12" />
            </div>

            <p className="text-[#808080] text-xs font-mono mb-4 text-center">Escolha a intenção estratégica do seu post</p>

            <div className="overflow-y-auto max-h-[380px] custom-scrollbar pr-1">
                <PillarSelector
                    pillars={pillars}
                    selectedPillar={selectedPillar}
                    suggestedPillarId={suggestedPillarId}
                    onSelect={handlePillarSelect}
                    loading={pillarsLoading}
                />
            </div>

            {selectedPillar && (
                <button
                    onClick={handleNextStep}
                    className="w-full mt-4 bg-[#d4d4d4] text-[#050505] font-bold py-3 rounded hover:bg-white transition-all uppercase tracking-wide text-xs font-mono flex items-center justify-center gap-2 group"
                >
                    <span>Continuar</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
            )}
        </motion.div>
    );

    const handleCandidateSelect = (candidate: DiscoveryCandidate) => {
        setSelectedCandidate(candidate);
        if (candidate.url) {
            setUrl(candidate.url);
        }
        setCurrentStep(3);
    };

    const handleCustomUrlFromDiscovery = (customUrlValue: string) => {
        setUrl(customUrlValue);
        setSelectedCandidate(null);
        setCurrentStep(3);
    };

    const selectedPillarName = pillars.find(p => p.id === selectedPillar)?.name || selectedPillar || '';

    const renderAutoSourceStep = () => (
        <motion.div
            key="auto-source"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
        >
            <div className="flex items-center justify-between mb-6">
                <button onClick={handleBack} className="text-[#4a4a4a] hover:text-[#d4d4d4] text-xs font-mono flex items-center gap-1 transition-colors">
                    <span className="text-lg">‹</span> VOLTAR
                </button>
                <h2 className="text-[#d4d4d4] font-bold font-mono">DESCOBERTA_DE_FONTES</h2>
                <div className="w-12" />
            </div>

            <div className="max-w-md mx-auto w-full">
                {discoveryLoading && (
                    <DiscoveryProgress niche={userNiche} pillarName={selectedPillarName} />
                )}

                {!discoveryLoading && discoveryCandidates && discoveryCandidates.length > 0 && (
                    <DiscoveryCandidates
                        candidates={discoveryCandidates}
                        onSelect={handleCandidateSelect}
                        onCustomUrl={handleCustomUrlFromDiscovery}
                    />
                )}

                {!discoveryLoading && discoveryCandidates && discoveryCandidates.length === 0 && (
                    <div className="text-center py-8 space-y-4">
                        <p className="text-[#808080] font-mono text-sm">Nenhuma fonte encontrada. Tente outro pilar ou cole uma URL personalizada.</p>
                        <button
                            onClick={handleBack}
                            className="text-[#c084fc] hover:text-[#d4d4d4] text-xs font-mono transition-colors"
                        >
                            Voltar e tentar outro pilar
                        </button>
                    </div>
                )}

                {error && (
                    <div className="mt-4">
                        <p className="text-red-500 text-xs font-mono bg-red-500/10 p-2 border border-red-500/20 rounded">{error}</p>
                    </div>
                )}
            </div>
        </motion.div>
    );

    const renderThemeStep = () => (
        <motion.div
            key="theme"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
        >
            <div className="flex items-center justify-between mb-6">
                <button onClick={handleBack} className="text-[#4a4a4a] hover:text-[#d4d4d4] text-xs font-mono flex items-center gap-1 transition-colors">
                    <span className="text-lg">‹</span> VOLTAR
                </button>
                <h2 className="text-[#d4d4d4] font-bold font-mono">SELECIONAR_TEMA</h2>
                <div className="w-12" />
            </div>

            <div className="grid grid-cols-2 gap-4 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
                {themes.map(theme => (
                    <div
                        key={theme.id}
                        onClick={() => { setSelectedTheme(theme.id); setCurrentStep(currentStep + 1); }}
                        className={`p-4 bg-[#0a0a0a] border rounded-[3px] cursor-pointer transition-all group hover:border-[#8a00c4] hover:shadow-[0_0_10px_rgba(138,0,196,0.1)] relative overflow-hidden ${selectedTheme === theme.id ? 'border-[#8a00c4] bg-[#8a00c4]/5' : 'border-white/10'}`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[#d4d4d4] font-bold text-sm font-mono">{theme.name}</h3>
                            <div className={`w-3 h-3 rounded-full border ${selectedTheme === theme.id ? 'bg-[#8a00c4] border-[#8a00c4]' : 'border-[#2a2a2a]'}`} />
                        </div>
                        {/* Visual-only: color palette + font sample + layout style */}
                        <div className="space-y-2">
                            {theme.colorPalette && (
                                <div className="flex gap-1">
                                    <div className="w-5 h-5 rounded-[2px] border border-white/10" style={{ background: theme.colorPalette.bgPrimary }} />
                                    <div className="w-5 h-5 rounded-[2px] border border-white/10" style={{ background: theme.colorPalette.bgSecondary }} />
                                    <div className="w-5 h-5 rounded-[2px] border border-white/10" style={{ background: theme.colorPalette.textPrimary }} />
                                    <div className="w-5 h-5 rounded-[2px] border border-white/10" style={{ background: theme.colorPalette.accent }} />
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                {theme.fonts && (
                                    <span className="text-[10px] bg-[#161616] border border-[#2a2a2a] px-1.5 py-0.5 rounded-[3px] text-[#4a4a4a]" style={{ fontFamily: theme.fonts.headline }}>
                                        {theme.fonts.headline}
                                    </span>
                                )}
                                {theme.backgroundStrategy && (
                                    <span className="text-[10px] bg-[#161616] border border-[#2a2a2a] px-1.5 py-0.5 rounded-[3px] text-[#4a4a4a]">
                                        {theme.backgroundStrategy}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );

    const renderModelStep = () => (
        <motion.div
            key="model"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
        >
            <div className="flex items-center justify-between mb-6">
                <button onClick={handleBack} className="text-[#4a4a4a] hover:text-[#d4d4d4] text-xs font-mono flex items-center gap-1 transition-colors">
                    <span className="text-lg">‹</span> VOLTAR
                </button>
                <h2 className="text-[#d4d4d4] font-bold font-mono">SELECIONAR_MODELO</h2>
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
                            className={`p-4 bg-[#0a0a0a] border rounded-[3px] cursor-pointer transition-all hover:bg-[#111111] flex flex-col items-center text-center gap-3 ${isSelected ? 'border-[#8a00c4] shadow-[0_0_10px_rgba(138,0,196,0.15)] ring-1 ring-[#8a00c4]' : 'border-white/10'}`}
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
                <span>Continuar Configuração</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </motion.div>
    );

    const renderFinalizeStep = () => (
        <motion.div
            key="finalize"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
        >
            <div className="flex items-center justify-between mb-6">
                <button onClick={handleBack} className="text-[#4a4a4a] hover:text-[#d4d4d4] text-xs font-mono flex items-center gap-1 transition-colors">
                    <span className="text-lg">‹</span> VOLTAR
                </button>
                <h2 className="text-[#d4d4d4] font-bold font-mono">FINALIZAR</h2>
                <div className="w-12" />
            </div>

            <div className="space-y-4 mb-8">
                <div
                    onClick={() => setIsProductMode(!isProductMode)}
                    className={`p-4 border rounded-[3px] cursor-pointer transition-all flex items-center gap-4 ${isProductMode ? 'bg-[#8a00c4]/10 border-[#8a00c4]' : 'bg-[#0a0a0a] border-white/10 hover:border-[#2a2a2a]'}`}
                >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${isProductMode ? 'bg-[#8a00c4] border-[#8a00c4]' : 'bg-[#161616] border-[#2a2a2a]'}`}>
                        {isProductMode && <Sparkles size={12} className="text-white bg-transparent" />}
                    </div>
                    <div>
                        <h4 className="text-[#d4d4d4] font-bold text-sm">Modo Promoção de Produto</h4>
                        <p className="text-[#808080] text-xs">Injeta detalhes específicos do produto na narrativa</p>
                    </div>
                </div>

                <AnimatePresence>
                    {isProductMode && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden pt-2"
                        >
                            <OfferSelector
                                offers={userProfile?.offers ?? []}
                                selectedIndex={selectedOfferIndex}
                                onSelect={setSelectedOfferIndex}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Cost Summary */}
            <div className="mt-auto bg-[#0a0a0a] border border-white/10 p-4 rounded-[3px] mb-4">
                <div className="flex justify-between items-center text-xs font-mono mb-2">
                    <span className="text-[#808080]">CUSTO ESTIMADO</span>
                    <span className="text-[#d4d4d4]">{tokenCost} TOKENS</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-[#808080]">SALDO</span>
                    <span className={balance >= tokenCost ? 'text-[#8a00c4]' : 'text-red-500'}>{balance} TOKENS</span>
                </div>
            </div>

            <button
                onClick={handleGenerate}
                disabled={loading || balance < tokenCost}
                className={`w-full py-4 rounded-[3px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${loading || balance < tokenCost ? 'bg-[#1e1e1e] text-[#4a4a4a] cursor-not-allowed' : 'bg-[#8a00c4] text-white hover:bg-[#9d00de] shadow-[0_0_20px_rgba(138,0,196,0.3)]'}`}
            >
                {loading ? (
                    <span className="animate-pulse">PROCESSANDO...</span>
                ) : balance < tokenCost ? (
                    <span>TOKENS INSUFICIENTES</span>
                ) : (
                    <>
                        <Zap size={16} />
                        <span>GERAR POST</span>
                    </>
                )}
            </button>
        </motion.div>
    );

    return (
        <main className="flex-1 max-w-5xl p-8 relative min-h-screen flex flex-col items-center justify-center">
            {/* Background decorations */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#8a00c4]/30 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#8a00c4]/20 rounded-full blur-[120px]" />
            </div>

            {/* Back to Home Button */}
            <div className="fixed top-8 left-8 z-50 hidden md:block">
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 text-[#808080] hover:text-[#d4d4d4] transition-colors group"
                >
                    <div className="w-8 h-8 rounded-full border border-[#2a2a2a] bg-[#0a0a0a] flex items-center justify-center group-hover:border-[#8a00c4] group-hover:bg-[#8a00c4]/10 transition-all">
                        <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    </div>
                    <span className="text-xs font-mono uppercase tracking-wider">Voltar ao Início</span>
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
                            <span>criar_post.exe</span>
                        </div>
                        <div className="w-16" />
                    </div>

                    {/* Terminal Content */}
                    <div className="p-8 min-h-[500px] flex flex-col">
                        {/* Progress Bar */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[#808080] text-xs font-mono uppercase tracking-wider">Progresso</span>
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
                            {renderStep()}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </main>
    );
}
