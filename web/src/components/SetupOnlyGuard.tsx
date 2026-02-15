'use client';

import { useEffect, createContext, useContext, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

interface SetupOnlyGuardProps {
    children: React.ReactNode;
}

// Context to let child components signal that a submit is in progress
const SetupGuardContext = createContext<{
    markSubmitting: () => void;
}>({ markSubmitting: () => {} });

export function useSetupGuard() {
    return useContext(SetupGuardContext);
}

/**
 * Guard para a rota /setup - APENAS usuários logados SEM setup completado
 *
 * Fluxo de redirecionamento:
 * - Não logado -> /login
 * - Logado mas JÁ fez setup -> / (home)
 * - Logado e não fez setup -> permite acesso
 *
 * IMPORTANTE: Não redireciona se um submit está em andamento (evita race condition)
 */
export function SetupOnlyGuard({ children }: SetupOnlyGuardProps) {
    const { user, loading, userProfile } = useAuth();
    const router = useRouter();
    const submittingRef = useRef(false);

    const markSubmitting = useCallback(() => {
        submittingRef.current = true;
    }, []);

    useEffect(() => {
        if (!loading && !submittingRef.current) {
            if (!user) {
                router.push('/login');
            } else if (userProfile && userProfile.setup_completed) {
                router.push('/');
            }
        }
    }, [user, loading, userProfile, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020202] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#8a00c4] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Se submitting, sempre renderiza children (não desmonta)
    if (submittingRef.current) {
        return (
            <SetupGuardContext.Provider value={{ markSubmitting }}>
                {children}
            </SetupGuardContext.Provider>
        );
    }

    // Se não está logado ou já fez setup, não mostra nada (vai redirecionar)
    if (!user || (userProfile && userProfile.setup_completed)) {
        return null;
    }

    // Usuário logado e ainda não completou setup
    return (
        <SetupGuardContext.Provider value={{ markSubmitting }}>
            {children}
        </SetupGuardContext.Provider>
    );
}
