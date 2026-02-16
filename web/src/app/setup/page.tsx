'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { SetupOnlyGuard, useSetupGuard } from '../../components/SetupOnlyGuard';
import { motion, AnimatePresence } from 'framer-motion';

import { Typewriter } from '../../components/ui/typewriter';
import { SlideFrame } from '../../components/renderer/primitives/SlideFrame';
import { TweetCardLayout } from '../../components/renderer/layouts/TweetCardLayout';
import type { SlideData, ProfileData } from '@/types/renderer/slide.types';

type VoiceTone = 'professional' | 'friendly' | 'provocative' | 'inspirational' | 'humorous';

interface SetupData {
    instagramHandle: string;
    instagramUsername: string;
    targetAudience: string;
    mainPainPoint: string;
    voiceTone: VoiceTone;
    userPrompt: string;
    highlightColor: string;
}

const highlightColors = [
    { value: '#8a00c4', label: 'Purple' },
    { value: '#0066FF', label: 'Blue' },
    { value: '#00CC66', label: 'Green' },
    { value: '#FF9900', label: 'Orange' },
    { value: '#FF3366', label: 'Pink' },
    { value: '#00FFFF', label: 'Cyan' },
];

const voiceToneOptions: { value: VoiceTone; label: string; icon: string }[] = [
    { value: 'professional', label: 'Professional', icon: '💼' },
    { value: 'friendly', label: 'Friendly', icon: '🤝' },
    { value: 'provocative', label: 'Provocative', icon: '🔥' },
    { value: 'inspirational', label: 'Inspirational', icon: '✨' },
    { value: 'humorous', label: 'Humorous', icon: '😄' },
];

export default function SetupPage() {
    return (
        <SetupOnlyGuard>
            <SetupPageContent />
        </SetupOnlyGuard>
    );
}

function SetupPageContent() {
    const { user } = useAuth();
    const { markSubmitting } = useSetupGuard();
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [showContent, setShowContent] = useState(false);
    const [backgroundOpacity, setBackgroundOpacity] = useState(1);
    const colorInputRef = useRef<HTMLInputElement>(null);

    const handleAnimationComplete = () => {
        // Wait a bit after "the new era" is typed, then fade out
        setTimeout(() => {
            setBackgroundOpacity(0);
            setTimeout(() => {
                setShowContent(true);
            }, 500);
        }, 1000);
    };

    const [data, setData] = useState<SetupData>({
        instagramHandle: '',
        instagramUsername: '',
        targetAudience: '',
        mainPainPoint: '',
        voiceTone: 'professional',
        userPrompt: '',
        highlightColor: '#8a00c4',
    });

    const steps = [
        { title: 'Instagram Name', description: 'What is your profile called?' },
        { title: 'Username', description: 'Your Instagram @' },
        { title: 'Target Audience', description: 'Who do you create content for?' },
        { title: 'Main Pain Point', description: 'What problem do you solve?' },
        { title: 'Voice Tone', description: 'How does your brand communicate?' },
        { title: 'About Your Business', description: 'Describe your business to the AI' },
        { title: 'Visual Style', description: 'Choose your highlight color' },
    ];

    const handleSubmit = async () => {
        if (!user) return;

        markSubmitting();
        setLoading(true);

        try {
            // 1. Get fresh session token
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;
            console.log('[SETUP] token exists:', !!token);

            if (!token) {
                alert('Sessão expirada. Faça login novamente.');
                window.location.href = '/login';
                return;
            }

            // 2. Direct fetch to Supabase REST API (bypasses JS client issues)
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

            const body = JSON.stringify({
                full_name: data.instagramHandle,
                instagram_handle: data.instagramHandle,
                instagram_username: data.instagramUsername,
                target_audience: data.targetAudience,
                main_pain_point: data.mainPainPoint,
                voice_tone: data.voiceTone,
                user_prompt: data.userPrompt,
                highlight_color: data.highlightColor,
                setup_completed: true,
            });

            console.log('[SETUP] Sending PATCH to Supabase...');

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);

            const res = await fetch(
                `${supabaseUrl}/rest/v1/users?id=eq.${user.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${token}`,
                        'Prefer': 'return=minimal',
                    },
                    body,
                    signal: controller.signal,
                }
            );

            clearTimeout(timeout);

            console.log('[SETUP] Response status:', res.status);

            if (!res.ok) {
                const errText = await res.text();
                console.error('[SETUP] Error body:', errText);
                alert(`Erro ao salvar (${res.status}): ${errText}`);
                setLoading(false);
                return;
            }

            console.log('[SETUP] Success! Redirecting...');
            window.location.href = '/';
        } catch (err: any) {
            console.error('[SETUP] Exception:', err);
            if (err.name === 'AbortError') {
                alert('Timeout: o servidor demorou demais. Tente novamente.');
            } else {
                alert(`Erro: ${err.message}`);
            }
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleSubmit();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const isStepValid = () => {
        switch (currentStep) {
            case 0: return data.instagramHandle.trim().length > 0;
            case 1: return data.instagramUsername.trim().length > 0;
            case 2: return data.targetAudience.trim().length > 0;
            case 3: return data.mainPainPoint.trim().length > 0;
            case 4: return true; // voice_tone always has default
            case 5: return data.userPrompt.trim().length > 0;
            case 6: return true; // color always has default
            default: return false;
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="fade-up">
                        <label className="font-['Sora'] font-semibold text-white mb-3 block">
                            Instagram Name
                        </label>
                        <input
                            type="text"
                            value={data.instagramHandle}
                            onChange={(e) => setData({ ...data, instagramHandle: e.target.value })}
                            placeholder="Ex: Shadowfeed AI"
                            className="w-full px-4 py-3 rounded-[3px] bg-[#161616] text-white border border-white/[0.12] focus:border-[#8a00c4] focus:ring-2 focus:ring-[#8a00c4]/20 outline-none transition font-['DM_Sans'] placeholder:text-white/[0.4]"
                            autoFocus
                        />
                    </div>
                );

            case 1:
                return (
                    <div className="fade-up">
                        <label className="font-['Sora'] font-semibold text-white mb-3 block">
                            Instagram Username
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/[0.4]">@</span>
                            <input
                                type="text"
                                value={data.instagramUsername}
                                onChange={(e) => setData({ ...data, instagramUsername: e.target.value })}
                                placeholder="shadowfeed"
                                className="w-full pl-8 pr-4 py-3 rounded-[3px] bg-[#161616] text-white border border-white/[0.12] focus:border-[#8a00c4] focus:ring-2 focus:ring-[#8a00c4]/20 outline-none transition font-['DM_Sans'] placeholder:text-white/[0.4]"
                                autoFocus
                            />
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="fade-up">
                        <label className="font-['Sora'] font-semibold text-white mb-3 block">
                            Target Audience
                        </label>
                        <textarea
                            value={data.targetAudience}
                            onChange={(e) => setData({ ...data, targetAudience: e.target.value.slice(0, 500) })}
                            placeholder="Ex: Entrepreneurs who want to boost sales using Instagram, between 25-40 years old, interested in digital marketing and automation..."
                            rows={4}
                            maxLength={500}
                            className="w-full px-4 py-3 rounded-[3px] bg-[#161616] text-white border border-white/[0.12] focus:border-[#8a00c4] focus:ring-2 focus:ring-[#8a00c4]/20 outline-none transition font-['DM_Sans'] placeholder:text-white/[0.4] resize-none"
                            autoFocus
                        />
                        <div className="flex justify-between mt-2">
                            <span className="font-['DM_Sans'] text-white/[0.4] text-xs">
                                Max 500 characters
                            </span>
                            <span className={`font-['DM_Sans'] text-xs ${data.targetAudience.length >= 500 ? 'text-red-400' : 'text-white/[0.5]'
                                }`}>
                                {data.targetAudience.length}/500
                            </span>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="fade-up">
                        <label className="font-['Sora'] font-semibold text-white mb-3 block">
                            Main Pain Point
                        </label>
                        <textarea
                            value={data.mainPainPoint}
                            onChange={(e) => setData({ ...data, mainPainPoint: e.target.value.slice(0, 500) })}
                            placeholder="Ex: My clients don't know how to create consistent content for Instagram and lose sales by not having a strong digital presence..."
                            rows={4}
                            maxLength={500}
                            className="w-full px-4 py-3 rounded-[3px] bg-[#161616] text-white border border-white/[0.12] focus:border-[#8a00c4] focus:ring-2 focus:ring-[#8a00c4]/20 outline-none transition font-['DM_Sans'] placeholder:text-white/[0.4] resize-none"
                            autoFocus
                        />
                        <div className="flex justify-between mt-2">
                            <span className="font-['DM_Sans'] text-white/[0.4] text-xs">
                                Max 500 characters
                            </span>
                            <span className={`font-['DM_Sans'] text-xs ${data.mainPainPoint.length >= 500 ? 'text-red-400' : 'text-white/[0.5]'
                                }`}>
                                {data.mainPainPoint.length}/500
                            </span>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="fade-up">
                        <label className="font-['Sora'] font-semibold text-white mb-3 block">
                            Voice Tone
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {voiceToneOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setData({ ...data, voiceTone: option.value })}
                                    className={`p-4 rounded-[3px] border-2 transition-all ${data.voiceTone === option.value
                                        ? 'border-[#8a00c4] !bg-[#8a00c4]'
                                        : 'border-white/[0.12] bg-[#161616] hover:border-white/[0.25]'
                                        }`}
                                >
                                    <div className="text-2xl mb-2">{option.icon}</div>
                                    <div className="font-['DM_Sans'] font-medium text-white text-sm">
                                        {option.label}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className="fade-up">
                        <label className="font-['Sora'] font-semibold text-white mb-3 block">
                            Describe your business
                        </label>
                        <p className="font-['DM_Sans'] text-white/[0.5] text-sm mb-3">
                            This will help AI create personalized content for your business
                        </p>
                        <textarea
                            value={data.userPrompt}
                            onChange={(e) => setData({ ...data, userPrompt: e.target.value.slice(0, 500) })}
                            placeholder="Ex: Digital marketing agency specialized in e-commerce. We create Instagram strategies for online stores to increase sales. Our differential is focusing on content that converts, not just likes..."
                            rows={5}
                            maxLength={500}
                            className="w-full px-4 py-3 rounded-[3px] bg-[#161616] text-white border border-white/[0.12] focus:border-[#8a00c4] focus:ring-2 focus:ring-[#8a00c4]/20 outline-none transition font-['DM_Sans'] placeholder:text-white/[0.4] resize-none"
                            autoFocus
                        />
                        <div className="flex justify-between mt-2">
                            <span className="font-['DM_Sans'] text-white/[0.4] text-xs">
                                Max 500 characters
                            </span>
                            <span className={`font-['DM_Sans'] text-xs ${data.userPrompt.length >= 500 ? 'text-red-400' : 'text-white/[0.5]'
                                }`}>
                                {data.userPrompt.length}/500
                            </span>
                        </div>
                    </div>
                );


            case 6:
                const mockSlide: SlideData = {
                    slide: 1,
                    role: 'content',
                    layout: 'tweet-card',
                    headline: '3 Pillars of **Viral Content**',
                    subtitle: null,
                    body: 'You don\'t need *luck*. You need **Strategy**, **Consistency** and **Authenticity**. The rest is consequence.',
                    bg_color: '#ffffff',
                    bg_gradient: null,
                    accent_color: data.highlightColor,
                    text_color: '#0F1419',
                    font_headline: 'Inter',
                    font_body: 'Inter',
                    font_size_headline: '40px',
                    font_size_body: '24px',
                    font_weight_headline: '800',
                    text_align: 'left',
                    decorative_elements: ['top-line-accent', 'bottom-gradient-fade'],
                    image: null,
                    icon: null,
                    number_label: null
                };

                const mockProfile: ProfileData = {
                    display_name: data.instagramHandle || 'Your Name',
                    username: data.instagramUsername ? `@${data.instagramUsername}` : '@your_user',
                    avatar_url: '',
                    verified: false
                };

                return (
                    <div className="fade-up w-full" >
                        <label className="font-['Sora'] font-semibold text-white mb-6 block text-center lg:text-left">
                            Highlight Color
                        </label>

                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            {/* Left Column: Controls */}
                            <div className="w-full lg:w-1/2 flex flex-col gap-8">
                                {/* Highlight Color Selection */}
                                <div>
                                    <p className="font-['DM_Sans'] text-white/[0.5] text-sm mb-4">
                                        Highlight Color
                                    </p>
                                    <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                                        {highlightColors.map((color) => (
                                            <button
                                                key={color.value}
                                                type="button"
                                                onClick={() => setData({ ...data, highlightColor: color.value })}
                                                className={`w-10 h-10 rounded-full transition-all border-2 ${data.highlightColor === color.value
                                                    ? 'border-white scale-110 shadow-[0_0_15px_' + color.value + ']'
                                                    : 'border-transparent hover:scale-105'
                                                    }`}
                                                style={{ backgroundColor: color.value }}
                                                title={color.label}
                                            />
                                        ))}

                                        {/* Custom Color Button */}
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => colorInputRef.current?.click()}
                                                className={`w-10 h-10 rounded-full transition-all border-2 flex items-center justify-center ${!highlightColors.some(c => c.value === data.highlightColor)
                                                    ? 'border-white scale-110 shadow-[0_0_15px_' + data.highlightColor + ']'
                                                    : 'border-white/[0.2] hover:border-white/[0.5] bg-[#161616]'
                                                    }`}
                                                style={{
                                                    backgroundColor: !highlightColors.some(c => c.value === data.highlightColor) ? data.highlightColor : undefined
                                                }}
                                                title="Custom Color"
                                            >
                                                {!highlightColors.some(c => c.value === data.highlightColor) ? null : (
                                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                )}
                                            </button>
                                            <input
                                                ref={colorInputRef}
                                                type="color"
                                                value={data.highlightColor}
                                                onChange={(e) => setData({ ...data, highlightColor: e.target.value })}
                                                className="absolute opacity-0 pointer-events-none"
                                            />
                                        </div>
                                    </div>

                                    {/* HEX Input */}
                                    <div className="w-full mt-4 flex items-center justify-center lg:justify-start gap-3">
                                        <span className="text-white/[0.5] font-['DM_Sans'] text-sm">HEX</span>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/[0.4] text-sm font-['DM_Sans']">#</span>
                                            <input
                                                type="text"
                                                value={data.highlightColor.replace('#', '')}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (/^[0-9A-Fa-f]{0,6}$/.test(val)) {
                                                        setData({ ...data, highlightColor: '#' + val });
                                                    }
                                                }}
                                                className="w-28 pl-7 pr-3 py-2 rounded-[8px] bg-[#161616] text-white border border-white/[0.12] focus:border-[#8a00c4] outline-none font-['DM_Sans'] text-sm uppercase transition focus:bg-[#1a1a1a]"
                                                placeholder="000000"
                                                maxLength={6}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Live Preview */}
                            <div className="w-full lg:w-1/2 flex justify-center items-center">
                                <div className="relative w-[324px] h-[405px] sm:w-[378px] sm:h-[472px] lg:w-[432px] lg:h-[540px] flex-shrink-0">
                                    <div className="absolute inset-0 origin-top-left transform scale-[0.3] sm:scale-[0.35] lg:scale-[0.4]">
                                        <div className="rounded-[20px] overflow-hidden shadow-2xl ring-4 ring-white/10" style={{ width: 1080, height: 1350 }}>
                                            <SlideFrame
                                                bgColor={mockSlide.bg_color}
                                                bgGradient={mockSlide.bg_gradient}
                                                branding={null}
                                                accentColor={mockSlide.accent_color}
                                                textColor={mockSlide.text_color}
                                                fontBody={mockSlide.font_body}
                                            >
                                                <TweetCardLayout slide={mockSlide} profile={mockProfile} />
                                            </SlideFrame>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div >
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#020202] text-white relative overflow-hidden flex items-center justify-center">
            {/* Background Text Animation */}
            <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: backgroundOpacity }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
            >
                <div className="opacity-20 text-center">
                    <Typewriter
                        texts={["shadowfeed", "the new era"]}
                        typingSpeed={100}
                        deletingSpeed={50}
                        pauseDuration={1500}
                        className="font-rubik-glitch text-[8vw] leading-none text-white whitespace-nowrap"
                        onLoopDone={handleAnimationComplete}
                    />
                </div>
            </motion.div>

            {/* Main Content */}
            <AnimatePresence>
                {showContent && (
                    <>
                        {/* Background Logo - Synchronized with content */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.2 }}
                            transition={{ duration: 1.5 }}
                            className="fixed inset-0 flex items-center justify-center pointer-events-none select-none z-0"
                        >
                            <div className="relative h-[70vh] w-[70vh]">
                                <Image
                                    src="/logo.png"
                                    alt="Shadowfeed Logo"
                                    fill
                                    className="object-contain"
                                    priority
                                    draggable={false}
                                />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`relative z-10 w-full ${currentStep === 6 ? 'max-w-5xl' : 'max-w-xl'} flex flex-col items-center gap-8 transition-all duration-500`}
                        >
                            {/* Logo removed to match reception design */}

                            <div className="w-full p-8 rounded-[3px] bg-white/5 backdrop-blur-[10px] border border-white/10 shadow-2xl">
                                {/* Step Title */}
                                <div className="text-center mb-8">
                                    <h2 className="font-['Sora'] font-bold text-white text-2xl md:text-3xl mb-2">
                                        {steps[currentStep].title}
                                    </h2>
                                    <p className="font-['DM_Sans'] text-white/[0.5]">
                                        {steps[currentStep].description}
                                    </p>
                                </div>

                                {/* Step Content */}
                                <div className="mb-8">
                                    {renderStepContent()}
                                </div>

                                {/* Navigation Buttons */}
                                <div className="flex justify-between gap-4">
                                    <button
                                        type="button"
                                        onClick={handlePrevious}
                                        disabled={currentStep === 0 || loading}
                                        className={`font-['DM_Sans'] font-semibold px-6 py-3 rounded-[3px] transition ${currentStep === 0 || loading
                                            ? 'text-white/[0.3] cursor-not-allowed'
                                            : 'text-white hover:text-white/[0.8]'
                                            }`}
                                    >
                                        Back
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        disabled={!isStepValid() || loading}
                                        className={`font-['DM_Sans'] font-semibold px-8 py-3 rounded-[3px] transition flex items-center gap-2 border border-transparent ${!isStepValid() || loading
                                            ? 'bg-white/[0.1] text-white/[0.3] cursor-not-allowed'
                                            : '!bg-[#8a00c4] text-white hover:!bg-[#b44cff] hover:translate-y-[-2px] shadow-[0_8px_20px_rgba(138,0,196,0.3)]'
                                            }`}
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Processing...
                                            </>
                                        ) : currentStep === steps.length - 1 ? (
                                            'Finish'
                                        ) : (
                                            'Continue'
                                        )}
                                    </button>
                                </div>

                                {/* Step Indicators */}
                                <div className="flex justify-center gap-2 mt-8">
                                    {steps.map((_, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => index < currentStep && setCurrentStep(index)}
                                            className={`w-2 h-2 rounded-full transition-all ${index === currentStep
                                                ? 'bg-[#8a00c4] w-8'
                                                : index < currentStep
                                                    ? 'bg-[#8a00c4]/40'
                                                    : 'bg-white/[0.2]'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
