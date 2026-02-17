'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';

export function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { signIn, signUp, refreshUserProfile } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSignUp, setIsSignUp] = useState(false);

    // Check if coming from signup link
    useEffect(() => {
        const signup = searchParams.get('signup');
        if (signup === 'true') {
            setIsSignUp(true);
        }
    }, [searchParams]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const result = isSignUp
            ? await signUp(email, password)
            : await signIn(email, password);

        if (result.error) {
            setError(result.error.message || 'Erro ao processar autenticação');
            setLoading(false);
            return;
        }

        // For new signups, ensure setup_completed is false in the database
        // This prevents the SetupOnlyGuard from redirecting to home if the default database value is true
        if (isSignUp) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase
                    .from('users')
                    .update({ setup_completed: false })
                    .eq('id', user.id);
            }
        }

        setLoading(false);

        // After signup or login, refresh user profile and redirect
        await refreshUserProfile();

        // For new signups, redirect to /setup
        if (isSignUp) {
            router.push('/setup');
        } else {
            // For existing users, redirect to home
            router.push('/');
        }
    }

    const { t } = useLanguage();

    const handleToggleMode = () => {
        setIsSignUp(!isSignUp);
        setError(null);
    };

    return (
        <div className="w-full bg-white/5 backdrop-blur-[10px] rounded-[3px] p-8 border border-white/10 shadow-2xl">
            {/* Logo */}
            <div className="text-center mb-8">
                <div className="w-12 h-12 mx-auto mb-4 rounded-[3px] overflow-hidden relative">
                    <Image
                        src="/logo.png"
                        alt="Shadowfeed Logo"
                        fill
                        className="object-cover"
                    />
                </div>
                <h1 className="font-['Sora'] font-bold text-white text-2xl mb-2">
                    {isSignUp ? t('auth.createAccount') : t('auth.welcomeBack')}
                </h1>
                <p className="font-['DM_Sans'] text-white/[0.5]">
                    <span className="font-rubik-glitch font-thin lowercase">shadowfeed</span>
                    {isSignUp ? ` • ${t('auth.startJourney')}` : ` • ${t('auth.enterDetails')}`}
                </p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-[3px] text-red-400 text-sm font-['DM_Sans']">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block font-['DM_Sans'] font-medium text-white mb-2">
                        {t('account.profile.email')}
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder={t('auth.emailPlaceholder')}
                        className="w-full px-4 py-3 rounded-[3px] bg-[#0a0a0a] text-white border border-white/[0.12] focus:border-[#8a00c4] focus:ring-2 focus:ring-[#8a00c4]/20 outline-none transition font-['DM_Sans'] placeholder:text-white/[0.4]"
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="block font-['DM_Sans'] font-medium text-white mb-2">
                        {t('auth.passwordPlaceholder')}
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        minLength={6}
                        className="w-full px-4 py-3 rounded-[3px] bg-[#0a0a0a] text-white border border-white/[0.12] focus:border-[#8a00c4] focus:ring-2 focus:ring-[#8a00c4]/20 outline-none transition font-['DM_Sans'] placeholder:text-white/[0.4]"
                        disabled={loading}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 rounded-[3px] font-['DM_Sans'] font-semibold text-sm transition uppercase tracking-wide border border-transparent ${loading
                        ? 'bg-white/[0.1] text-white/[0.3] cursor-not-allowed'
                        : '!bg-[#8a00c4] text-white hover:!bg-[#b44cff] hover:translate-y-[-2px] shadow-[0_8px_20px_rgba(138,0,196,0.3)]'
                        }`}
                >
                    {loading ? t('common.loading') : isSignUp ? t('auth.createAccount') : t('auth.signIn')}
                </button>
            </form>

            <div className="mt-6 text-center">
                <span className="font-['DM_Sans'] text-white/[0.5] text-sm">
                    {isSignUp ? t('auth.alreadyHaveAccount') + ' ' : t('auth.noAccount') + ' '}
                </span>
                <button
                    type="button"
                    onClick={handleToggleMode}
                    className="font-['DM_Sans'] text-[#8a00c4] hover:text-[#b44cff] font-medium text-sm ml-1 transition"
                >
                    {isSignUp ? t('auth.signIn') : t('auth.createAccount')}
                </button>
            </div>

            <div className="mt-6 pt-6 border-t border-white/[0.06] text-center">
                <Link
                    href="/reception"
                    className="font-['DM_Sans'] text-white/[0.4] hover:text-white/[0.7] text-sm transition"
                >
                    {t('auth.startJourney')}
                </Link>
            </div>
        </div>
    );
}
