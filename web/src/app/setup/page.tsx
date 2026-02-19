'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { FocusedLayout } from '../../components/FocusedLayout'; // Added
import { SetupOnlyGuard, useSetupGuard } from '../../components/SetupOnlyGuard';
import { motion, AnimatePresence } from 'framer-motion';
// Removed Typewriter
import { AwarenessSelector, type AwarenessLevel } from '../../components/setup/AwarenessSelector';
import { OfferCard, type Offer } from '../../components/setup/OfferCard';
import { NICHE_OPTIONS, PILLAR_SUGGESTIONS } from '../../lib/constants/pillar-suggestions';

// ─── Types ────────────────────────────────────────────────────────────────────

type VoiceTone = 'professional' | 'friendly' | 'provocative' | 'inspirational' | 'humorous';
type ContentDepth = 'shallow' | 'balanced' | 'dense';
type PrimaryGoal = 'grow_audience' | 'generate_leads' | 'direct_sales' | 'build_authority' | 'balanced';
type PostingFrequency = 'daily' | '2-3_week' | 'weekly' | 'occasional';

interface SetupData {
    // Step 1 — Business Identity
    niche: string;
    niche_other: string;
    expertise_statement: string;
    transformation_before: string;
    transformation_after: string;

    // Step 2 — Audience Avatar
    target_audience: string;
    audience_frustration: string;
    audience_desire: string;
    audience_objection: string;
    awareness_level: AwarenessLevel;

    // Step 3 — Content Pillars
    content_pillars: string[];
    primary_goal: PrimaryGoal;
    posting_frequency: PostingFrequency;

    // Step 4 — Offer
    has_offer: boolean;
    offers: Offer[];

    // Step 5 — Tone & Style
    voice_tone: VoiceTone;
    content_depth: ContentDepth;
    avoid_topics: string;
    brand_personality: string[];
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const VOICE_TONE_OPTIONS: { value: VoiceTone; label: string; icon: string }[] = [
    { value: 'professional', label: 'Profissional', icon: '💼' },
    { value: 'friendly', label: 'Amigável', icon: '🤝' },
    { value: 'provocative', label: 'Provocador', icon: '🔥' },
    { value: 'inspirational', label: 'Inspiracional', icon: '✨' },
    { value: 'humorous', label: 'Humorístico', icon: '😄' },
];

const CONTENT_DEPTH_OPTIONS: { value: ContentDepth; label: string; icon: string; desc: string }[] = [
    {
        value: 'shallow',
        icon: '🚀',
        label: 'Rápido e Direto',
        desc: 'Posts curtos, concisos e de impacto imediato.',
    },
    {
        value: 'balanced',
        icon: '⚖️',
        label: 'Equilibrado',
        desc: 'Mistura de posts curtos e aprofundados.',
    },
    {
        value: 'dense',
        icon: '📚',
        label: 'Denso e Educativo',
        desc: 'Carrosséis longos cheios de valor e detalhes.',
    },
];

const PRIMARY_GOAL_OPTIONS: { value: PrimaryGoal; label: string; icon: string }[] = [
    { value: 'grow_audience', label: 'Crescer audiência', icon: '📈' },
    { value: 'generate_leads', label: 'Gerar leads', icon: '🎯' },
    { value: 'direct_sales', label: 'Vender diretamente', icon: '💰' },
    { value: 'build_authority', label: 'Construir autoridade', icon: '🏆' },
    { value: 'balanced', label: 'Balanceado', icon: '⚖️' },
];

const POSTING_FREQUENCY_OPTIONS: { value: PostingFrequency; label: string }[] = [
    { value: 'daily', label: 'Todo dia' },
    { value: '2-3_week', label: '2–3x por semana' },
    { value: 'weekly', label: '1x por semana' },
    { value: 'occasional', label: 'Ocasionalmente' },
];

const BRAND_PERSONALITY_OPTIONS = [
    'Autêntico', 'Criativo', 'Confiável', 'Ousado', 'Empático',
    'Inovador', 'Divertido', 'Sério', 'Apaixonado', 'Direto',
    'Sofisticado', 'Acessível', 'Provocador', 'Inspirador', 'Técnico',
];

const STEP_TITLES = [
    'Identidade do Negócio',
    'Avatar do Público',
    'Pilares de Conteúdo',
    'Oferta (Opcional)',
    'Tom & Estilo',
];

const STEP_DESCRIPTIONS = [
    'Me conta sobre você e a transformação que você oferece',
    'Quem é o seu público e o que eles sentem?',
    'Sobre o que você vai falar e com qual frequência?',
    'Você tem algo para vender? Me conta os detalhes.',
    'Como você quer se comunicar com seu público?',
];

// ─── Shared Input Styles ───────────────────────────────────────────────────────

const inputClass =
    "w-full px-4 py-3 rounded-[3px] bg-[#1c1c1c] text-[#d4d4d4] border border-[#2a2a2a] focus:border-[#8a00c4] focus:bg-[#120026] outline-none transition font-['DM_Sans'] placeholder-[#4a4a4a] text-sm";

const labelClass = "sf-label sf-label--prompt mb-2 block";

const helperClass = "font-['DM_Sans'] text-[#808080] text-xs mt-1.5";

// ─── Empty Offer ───────────────────────────────────────────────────────────────

const emptyOffer = (isPrimary: boolean): Offer => ({
    name: '',
    type: '',
    main_benefit: '',
    price_range: '',
    purchase_method: '',
    cta_keyword: '',
    is_primary: isPrimary,
});

// ─── Default State ─────────────────────────────────────────────────────────────

const defaultData: SetupData = {
    niche: '',
    niche_other: '',
    expertise_statement: '',
    transformation_before: '',
    transformation_after: '',
    target_audience: '',
    audience_frustration: '',
    audience_desire: '',
    audience_objection: '',
    awareness_level: 'solution_aware',
    content_pillars: [],
    primary_goal: 'balanced',
    posting_frequency: '2-3_week',
    has_offer: false,
    offers: [emptyOffer(true)],
    voice_tone: 'professional',
    content_depth: 'balanced',
    avoid_topics: '',
    brand_personality: [],
};

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function SetupPage() {
    return (
        <SetupOnlyGuard>
            <SetupPageContent />
        </SetupOnlyGuard>
    );
}

// ─── Main Content ─────────────────────────────────────────────────────────────

function SetupPageContent() {
    const { user, refreshUserProfile } = useAuth();
    const { markSubmitting } = useSetupGuard();
    const router = useRouter();

    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isGlitching, setIsGlitching] = useState(false); // Added
    const [showContent, setShowContent] = useState(true); // Default true, no intro anim
    // Removed backgroundOpacity
    const [data, setData] = useState<SetupData>(defaultData);
    const [nicheSearch, setNicheSearch] = useState('');
    const [showNicheDropdown, setShowNicheDropdown] = useState(false);
    const nicheRef = useRef<HTMLDivElement>(null);
    const [direction, setDirection] = useState(1);

    // Removed handleAnimationComplete

    // ── Navigation ──────────────────────────────────────────────────────────────

    const isStepValid = useCallback((): boolean => {
        const effectiveNiche = data.niche === 'Outro' ? data.niche_other.trim() : data.niche;
        switch (currentStep) {
            case 0:
                return !!effectiveNiche && data.expertise_statement.trim().length >= 10;
            case 1:
                return data.target_audience.trim().length > 0 && !!data.awareness_level;
            case 2:
                return data.content_pillars.length >= 2 && !!data.primary_goal;
            case 3:
                return true; // optional step
            case 4:
                return !!data.voice_tone && !!data.content_depth;
            default:
                return false;
        }
    }, [currentStep, data]);

    const goNext = () => {
        if (!isStepValid()) {
            alert("Por favor, preencha todos os campos obrigatórios para continuar.");
            return;
        }
        if (loading) return;

        if (currentStep < 4) {
            setDirection(1);
            setCurrentStep((s) => s + 1);
        } else {
            handleSubmit();
        }
    };

    const goBack = () => {
        if (currentStep > 0 && !loading) {
            setDirection(-1);
            setCurrentStep((s) => s - 1);
        }
    };

    // ── Offer helpers ───────────────────────────────────────────────────────────

    const handleOfferChange = (idx: number, field: keyof Offer, value: string | boolean) => {
        const updated = [...data.offers];
        updated[idx] = { ...updated[idx], [field]: value };
        setData({ ...data, offers: updated });
    };

    const addOffer = () => {
        if (data.offers.length < 3) {
            setData({ ...data, offers: [...data.offers, emptyOffer(false)] });
        }
    };

    const removeOffer = (idx: number) => {
        const updated = data.offers.filter((_, i) => i !== idx);
        if (updated.length > 0) updated[0].is_primary = true;
        setData({ ...data, offers: updated });
    };

    // ── Pillar helpers ──────────────────────────────────────────────────────────

    const togglePillar = (pillar: string) => {
        if (data.content_pillars.includes(pillar)) {
            setData({ ...data, content_pillars: data.content_pillars.filter((p) => p !== pillar) });
        } else if (data.content_pillars.length < 4) {
            setData({ ...data, content_pillars: [...data.content_pillars, pillar] });
        }
    };

    const currentNiche = data.niche === 'Outro' ? 'Outro' : data.niche;
    const suggestedPillars = currentNiche ? PILLAR_SUGGESTIONS[currentNiche] ?? [] : [];

    // ── Brand personality helpers ───────────────────────────────────────────────

    const togglePersonality = (trait: string) => {
        if (data.brand_personality.includes(trait)) {
            setData({ ...data, brand_personality: data.brand_personality.filter((p) => p !== trait) });
        } else if (data.brand_personality.length < 3) {
            setData({ ...data, brand_personality: [...data.brand_personality, trait] });
        }
    };

    // ── Submit ──────────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!user) return;

        markSubmitting();
        setLoading(true);

        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;

            if (!token) {
                alert('Sessão expirada. Faça login novamente.');
                window.location.href = '/login';
                return;
            }

            // Trigger glitch
            setIsGlitching(true);

            const effectiveNiche = data.niche === 'Outro' ? data.niche_other : data.niche;

            const payload = {
                // Step 1
                niche: effectiveNiche,
                expertise_statement: data.expertise_statement,
                transformation_before: data.transformation_before,
                transformation_after: data.transformation_after,
                // Step 2
                target_audience: data.target_audience,
                audience_frustration: data.audience_frustration,
                audience_desire: data.audience_desire,
                audience_objection: data.audience_objection,
                audience_awareness: data.awareness_level,
                // Step 3
                content_pillars: data.content_pillars,
                primary_goal: data.primary_goal,
                posting_frequency: data.posting_frequency,
                // Step 4
                offers: data.has_offer ? data.offers : [],
                // Step 5
                voice_tone: data.voice_tone,
                content_depth: data.content_depth,
                avoid_topics: data.avoid_topics,
                brand_personality: data.brand_personality,
                // Meta
                setup_version: 2,
                setup_completed: true,
            };

            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);

            const res = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    apikey: supabaseKey,
                    Authorization: `Bearer ${token}`,
                    Prefer: 'return=minimal',
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            clearTimeout(timeout);

            if (!res.ok) {
                const errText = await res.text();
                console.error('[SETUP v2] Error:', errText);
                alert(`Erro ao salvar (${res.status}): ${errText}`);
                setLoading(false);
                return;
            }

            // Refresh profile to update setup_completed in context
            await refreshUserProfile();

            router.push('/create');
        } catch (err: any) {
            console.error('[SETUP v2] Exception:', err);
            if (err.name === 'AbortError') {
                alert('Timeout: o servidor demorou demais. Tente novamente.');
            } else {
                alert(`Erro: ${err.message}`);
            }
            setLoading(false);
        }
    };

    // ─── Step Renderers ───────────────────────────────────────────────────────────

    const filteredNiches = NICHE_OPTIONS.filter((n) =>
        n.toLowerCase().includes(nicheSearch.toLowerCase())
    );

    const renderStep = () => {
        switch (currentStep) {
            // ── Step 0: Business Identity ──────────────────────────────────────────
            case 0:
                return (
                    <div className="flex flex-col gap-5">
                        {/* Niche */}
                        <div ref={nicheRef} className="relative">
                            <label className={labelClass}>Seu nicho *</label>
                            <div
                                onClick={() => setShowNicheDropdown((v) => !v)}
                                className={`${inputClass} flex items-center justify-between cursor-pointer`}
                            >
                                <span className={data.niche ? 'text-white' : 'text-white/40'}>
                                    {data.niche || 'Selecione ou busque seu nicho'}
                                </span>
                                <svg
                                    className={`w-4 h-4 text-white/40 transition-transform ${showNicheDropdown ? 'rotate-180' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                            {showNicheDropdown && (
                                <div className="absolute z-20 w-full mt-1 rounded-[3px] bg-[#1a1a1a] border border-white/[0.15] shadow-2xl overflow-hidden">
                                    <div className="p-2 border-b border-white/[0.08]">
                                        <input
                                            type="text"
                                            value={nicheSearch}
                                            onChange={(e) => setNicheSearch(e.target.value)}
                                            placeholder="Buscar nicho..."
                                            className="w-full px-3 py-2 rounded-[3px] bg-[#0f0f0f] text-white text-sm border border-white/[0.1] outline-none font-['DM_Sans'] placeholder:text-white/30 focus:border-[#8a00c4]"
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                        {filteredNiches.map((niche) => (
                                            <button
                                                key={niche}
                                                type="button"
                                                onClick={() => {
                                                    setData({ ...data, niche, niche_other: '' });
                                                    setShowNicheDropdown(false);
                                                    setNicheSearch('');
                                                }}
                                                className={`w-full text-left px-4 py-2.5 text-sm font-['DM_Sans'] transition hover:bg-[#8a00c4]/20 ${data.niche === niche ? 'text-[#b44cff] bg-[#8a00c4]/10' : 'text-white/80'
                                                    }`}
                                            >
                                                {niche}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Niche Other free text */}
                        {data.niche === 'Outro' && (
                            <div>
                                <label className={labelClass}>Descreva seu nicho *</label>
                                <input
                                    type="text"
                                    value={data.niche_other}
                                    onChange={(e) => setData({ ...data, niche_other: e.target.value.slice(0, 80) })}
                                    placeholder="Ex: Design de interiores sustentável"
                                    className={inputClass}
                                    autoFocus
                                />
                            </div>
                        )}

                        {/* Expertise Statement */}
                        <div>
                            <label className={labelClass}>Seu statement de especialidade *</label>
                            <p className={helperClass}>
                                Seja específico — &quot;Sou coach de vida&quot; é fraco. Diga qual transformação você entrega.
                            </p>
                            <textarea
                                value={data.expertise_statement}
                                onChange={(e) => setData({ ...data, expertise_statement: e.target.value.slice(0, 200) })}
                                placeholder="Ajudo designers freelancers a cobrar 4x mais sem trabalhar mais horas"
                                rows={3}
                                className={`${inputClass} resize-none mt-2`}
                            />
                            <div className="flex justify-end mt-1">
                                <span className={`text-xs font-['DM_Sans'] ${data.expertise_statement.length >= 200 ? 'text-red-400' : 'text-white/30'}`}>
                                    {data.expertise_statement.length}/200
                                </span>
                            </div>
                        </div>

                        {/* Transformation */}
                        <div>
                            <label className={labelClass}>A transformação que você oferece</label>
                            <p className={helperClass}>Descreva a situação ANTES e DEPOIS (máx. 80 caracteres cada)</p>
                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <div>
                                    <div className="text-xs font-['DM_Sans'] text-white/40 mb-1.5 flex items-center gap-1.5">
                                        <span className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">✕</span>
                                        ANTES
                                    </div>
                                    <input
                                        type="text"
                                        value={data.transformation_before}
                                        onChange={(e) => setData({ ...data, transformation_before: e.target.value.slice(0, 80) })}
                                        placeholder="Sem clientes, sem renda certa"
                                        className={inputClass}
                                        maxLength={80}
                                    />
                                </div>
                                <div>
                                    <div className="text-xs font-['DM_Sans'] text-white/40 mb-1.5 flex items-center gap-1.5">
                                        <span className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">✓</span>
                                        DEPOIS
                                    </div>
                                    <input
                                        type="text"
                                        value={data.transformation_after}
                                        onChange={(e) => setData({ ...data, transformation_after: e.target.value.slice(0, 80) })}
                                        placeholder="Agenda cheia, liberdade financeira"
                                        className={inputClass}
                                        maxLength={80}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            // ── Step 1: Audience Avatar ────────────────────────────────────────────
            case 1:
                return (
                    <div className="flex flex-col gap-5">
                        <div>
                            <label className={labelClass}>Descreva seu público-alvo *</label>
                            <textarea
                                value={data.target_audience}
                                onChange={(e) => setData({ ...data, target_audience: e.target.value.slice(0, 300) })}
                                placeholder="Ex: Mulheres de 28–45 anos, empreendedoras ou profissionais liberais..."
                                rows={3}
                                className={`${inputClass} resize-none`}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>O que mais frustra seu público?</label>
                            <textarea
                                value={data.audience_frustration}
                                onChange={(e) => setData({ ...data, audience_frustration: e.target.value.slice(0, 200) })}
                                placeholder="Ex: Trabalhar muito e ganhar pouco, sem reconhecimento..."
                                rows={2}
                                className={`${inputClass} resize-none`}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>O que eles mais querem alcançar?</label>
                            <textarea
                                value={data.audience_desire}
                                onChange={(e) => setData({ ...data, audience_desire: e.target.value.slice(0, 200) })}
                                placeholder="Ex: Liberdade financeira e reconhecimento como especialista..."
                                rows={2}
                                className={`${inputClass} resize-none`}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Por que ainda não compraram de você?</label>
                            <textarea
                                value={data.audience_objection}
                                onChange={(e) => setData({ ...data, audience_objection: e.target.value.slice(0, 200) })}
                                placeholder="Ex: Acham que é caro, que não tem tempo, que não funciona para eles..."
                                rows={2}
                                className={`${inputClass} resize-none`}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Nível de consciência do público *</label>
                            <p className={helperClass}>
                                Qual o estágio de consciência do seu público ideal hoje?
                            </p>
                            <div className="mt-2">
                                <AwarenessSelector
                                    value={data.awareness_level}
                                    onChange={(v) => setData({ ...data, awareness_level: v })}
                                />
                            </div>
                        </div>
                    </div>
                );

            // ── Step 2: Content Pillars ────────────────────────────────────────────
            case 2:
                return (
                    <div className="flex flex-col gap-6">
                        {/* Pillars */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className={labelClass}>Pilares de conteúdo * (min. 2, máx. 4)</label>
                                <span className={`text-xs font-['DM_Sans'] ${data.content_pillars.length >= 4 ? 'text-[#b44cff]' : 'text-white/40'}`}>
                                    {data.content_pillars.length}/4
                                </span>
                            </div>
                            {!data.niche && (
                                <p className="text-white/40 text-xs font-['DM_Sans'] mb-3">
                                    💡 Selecione seu nicho no Step 1 para ver sugestões personalizadas.
                                </p>
                            )}
                            <div className="grid grid-cols-2 gap-2">
                                {suggestedPillars.map((pillar) => {
                                    const selected = data.content_pillars.includes(pillar);
                                    const disabled = !selected && data.content_pillars.length >= 4;
                                    return (
                                        <button
                                            key={pillar}
                                            type="button"
                                            onClick={() => togglePillar(pillar)}
                                            disabled={disabled}
                                            className={`px-3 py-2.5 rounded-[3px] text-xs font-['DM_Sans'] font-medium border text-left transition ${selected
                                                ? 'border-[#8a00c4] bg-[#8a00c4]/15 text-[#b44cff]'
                                                : disabled
                                                    ? 'border-white/[0.05] bg-transparent text-white/20 cursor-not-allowed'
                                                    : 'border-white/[0.12] bg-[#161616] text-white/70 hover:border-white/30 hover:text-white'
                                                }`}
                                        >
                                            {selected && <span className="mr-1">✓</span>}
                                            {pillar}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Primary Goal */}
                        <div>
                            <label className={labelClass}>Objetivo principal do conteúdo *</label>
                            <div className="grid grid-cols-1 gap-2">
                                {PRIMARY_GOAL_OPTIONS.map((goal) => (
                                    <button
                                        key={goal.value}
                                        type="button"
                                        onClick={() => setData({ ...data, primary_goal: goal.value })}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-[3px] border text-left transition ${data.primary_goal === goal.value
                                            ? 'border-[#8a00c4] bg-[#8a00c4]/10 text-white'
                                            : 'border-white/[0.1] bg-[#161616] text-white/70 hover:border-white/25'
                                            }`}
                                    >
                                        <span className="text-lg">{goal.icon}</span>
                                        <span className="font-['DM_Sans'] text-sm">{goal.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Posting Frequency */}
                        <div>
                            <label className={labelClass}>Frequência de postagem</label>
                            <div className="flex flex-wrap gap-2">
                                {POSTING_FREQUENCY_OPTIONS.map((freq) => (
                                    <button
                                        key={freq.value}
                                        type="button"
                                        onClick={() => setData({ ...data, posting_frequency: freq.value })}
                                        className={`px-4 py-2 rounded-[3px] text-sm font-['DM_Sans'] font-medium border transition ${data.posting_frequency === freq.value
                                            ? 'border-[#8a00c4] bg-[#8a00c4]/15 text-[#b44cff]'
                                            : 'border-white/[0.12] bg-[#161616] text-white/60 hover:border-white/30'
                                            }`}
                                    >
                                        {freq.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            // ── Step 3: Offer (Optional) ───────────────────────────────────────────
            case 3:
                return (
                    <div className="flex flex-col gap-5">
                        {/* Toggle */}
                        <div className="flex items-center justify-between p-4 rounded-[3px] border border-white/[0.12] bg-[#161616]">
                            <div>
                                <div className="font-['Sora'] font-semibold text-white text-sm">
                                    Tenho uma oferta para divulgar
                                </div>
                                <div className="font-['DM_Sans'] text-white/40 text-xs mt-0.5">
                                    Produto, serviço, mentoria, curso...
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setData({ ...data, has_offer: !data.has_offer })}
                                className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${data.has_offer ? 'bg-[#8a00c4]' : 'bg-white/20'
                                    }`}
                            >
                                <span
                                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${data.has_offer ? 'translate-x-6' : ''
                                        }`}
                                />
                            </button>
                        </div>

                        {!data.has_offer && (
                            <p className="font-['DM_Sans'] text-white/40 text-sm text-center py-4">
                                Sem problemas! Você pode completar isso depois. Clique em <strong className="text-white/60">Próximo</strong> para continuar.
                            </p>
                        )}

                        {data.has_offer && (
                            <>
                                <div className="flex flex-col gap-4">
                                    {data.offers.map((offer, idx) => (
                                        <OfferCard
                                            key={idx}
                                            offer={offer}
                                            index={idx}
                                            onChange={handleOfferChange}
                                            onRemove={removeOffer}
                                            canRemove={data.offers.length > 1}
                                        />
                                    ))}
                                </div>

                                {data.offers.length < 3 && (
                                    <button
                                        type="button"
                                        onClick={addOffer}
                                        className="flex items-center justify-center gap-2 w-full py-3 rounded-[3px] border border-dashed border-white/[0.2] text-white/50 hover:border-[#8a00c4] hover:text-[#b44cff] transition font-['DM_Sans'] text-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                        </svg>
                                        Adicionar outra oferta ({data.offers.length}/3)
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                );

            // ── Step 4: Tone & Style ───────────────────────────────────────────────
            case 4:
                return (
                    <div className="flex flex-col gap-6">
                        {/* Voice Tone */}
                        <div>
                            <label className={labelClass}>Tom de voz *</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {VOICE_TONE_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setData({ ...data, voice_tone: opt.value })}
                                        className={`p-3 rounded-[3px] border-2 transition-all text-center ${data.voice_tone === opt.value
                                            ? 'border-[#8a00c4] bg-[#8a00c4]'
                                            : 'border-white/[0.12] bg-[#161616] hover:border-white/[0.25]'
                                            }`}
                                    >
                                        <div className="text-xl mb-1">{opt.icon}</div>
                                        <div className="font-['DM_Sans'] font-medium text-white text-xs">{opt.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content Depth */}
                        <div>
                            <label className={labelClass}>Profundidade do conteúdo *</label>
                            <p className={helperClass}>A IA sempre decide o número final de slides.</p>
                            <div className="flex flex-col gap-2 mt-2">
                                {CONTENT_DEPTH_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setData({ ...data, content_depth: opt.value })}
                                        className={`flex items-start gap-4 p-4 rounded-[3px] border-2 text-left transition-all ${data.content_depth === opt.value
                                            ? 'border-[#8a00c4] bg-[#8a00c4]/10'
                                            : 'border-white/[0.1] bg-[#161616] hover:border-white/25'
                                            }`}
                                    >
                                        <span className="text-2xl flex-shrink-0 mt-0.5">{opt.icon}</span>
                                        <div>
                                            <div className={`font-['DM_Sans'] font-semibold text-sm ${data.content_depth === opt.value ? 'text-[#b44cff]' : 'text-white'}`}>
                                                {opt.label}
                                            </div>
                                            <div className="font-['DM_Sans'] text-white/40 text-xs mt-0.5">{opt.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Brand Personality */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className={labelClass}>Personalidade da marca (máx. 3)</label>
                                <span className={`text-xs font-['DM_Sans'] ${data.brand_personality.length >= 3 ? 'text-[#b44cff]' : 'text-white/40'}`}>
                                    {data.brand_personality.length}/3
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {BRAND_PERSONALITY_OPTIONS.map((trait) => {
                                    const selected = data.brand_personality.includes(trait);
                                    const disabled = !selected && data.brand_personality.length >= 3;
                                    return (
                                        <button
                                            key={trait}
                                            type="button"
                                            onClick={() => togglePersonality(trait)}
                                            disabled={disabled}
                                            className={`px-3 py-1.5 rounded-full text-xs font-['DM_Sans'] font-medium border transition ${selected
                                                ? 'border-[#8a00c4] bg-[#8a00c4]/20 text-[#b44cff]'
                                                : disabled
                                                    ? 'border-white/[0.05] text-white/20 cursor-not-allowed'
                                                    : 'border-white/[0.15] text-white/60 hover:border-white/30 hover:text-white'
                                                }`}
                                        >
                                            {trait}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Avoid Topics */}
                        <div>
                            <label className={labelClass}>Tópicos a evitar (opcional)</label>
                            <textarea
                                value={data.avoid_topics}
                                onChange={(e) => setData({ ...data, avoid_topics: e.target.value.slice(0, 300) })}
                                placeholder="Ex: Política, religião, concorrentes específicos..."
                                rows={2}
                                className={`${inputClass} resize-none`}
                            />
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    // ─── JSX ──────────────────────────────────────────────────────────────────────

    // ─── JSX ──────────────────────────────────────────────────────────────────────

    return (
        <FocusedLayout
            currentStep={currentStep + 1}
            totalSteps={STEP_TITLES.length}
            isGlitching={isGlitching}
            className="flex items-center justify-center min-h-[calc(100vh-80px)]"
        >
            <AnimatePresence>
                {showContent && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="w-full max-w-3xl"
                    >
                        {/* Card */}
                        <div className="w-full rounded-[3px] bg-[#111111] border border-[#1e1e1e] shadow-2xl overflow-hidden relative z-10">
                            {/* Step Header */}
                            <div className="px-8 pt-8 pb-4 text-center border-b border-white/[0.06] bg-[#0d0d0d]">
                                <h2 className="font-['Sora'] font-bold text-[#d4d4d4] text-2xl mb-1">
                                    {STEP_TITLES[currentStep]}
                                </h2>
                                <p className="font-['DM_Sans'] text-[#808080] text-sm">
                                    {STEP_DESCRIPTIONS[currentStep]}
                                </p>
                            </div>

                            {/* Step Content — with AnimatePresence slide transition */}
                            <div className="px-8 py-6 bg-[#111111]">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentStep}
                                        initial={{ opacity: 0, x: direction > 0 ? 40 : -40 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: direction > 0 ? -40 : 40 }}
                                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                                    >
                                        {renderStep()}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Navigation */}
                            <div className="px-8 pb-8 flex justify-between gap-4 bg-[#111111]">
                                <button
                                    type="button"
                                    onClick={goBack}
                                    disabled={currentStep === 0 || loading}
                                    className={`font-['DM_Sans'] font-semibold px-6 py-3 rounded-[3px] transition ${currentStep === 0 || loading
                                        ? 'text-[#4a4a4a] cursor-not-allowed'
                                        : 'text-[#808080] hover:text-[#d4d4d4]'
                                        }`}
                                >
                                    ← Voltar
                                </button>

                                <button
                                    type="button"
                                    onClick={goNext}
                                    disabled={loading}
                                    className={`font-['DM_Sans'] font-semibold px-8 py-3 rounded-[3px] transition-all flex items-center gap-2 border border-transparent ${!isStepValid() || loading
                                        ? 'bg-[#1c1c1c] text-[#4a4a4a]'
                                        : '!bg-[#8a00c4] text-white hover:!bg-[#9d00de] hover:translate-y-[-1px] shadow-[0_0_20px_rgba(138,0,196,0.3)]'
                                        }`}
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Salvando...
                                        </>
                                    ) : currentStep === 4 ? (
                                        '🚀 Completar'
                                    ) : (
                                        'Próximo →'
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </FocusedLayout>
    );
}
