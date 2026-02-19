'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

interface PublicOnlyGuardProps {
    children: React.ReactNode;
}

/**
 * Guard para rotas que devem ser acessadas APENAS por usuários NÃO logados
 * Exemplos: /reception, /login
 *
 * Se o usuário estiver logado:
 * - E não completou setup -> redireciona para /setup
 * - E completou setup -> redireciona para /
 */
export function PublicOnlyGuard({ children }: PublicOnlyGuardProps) {
    const { user, loading, userProfile } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            // Usuário está logado, não deveria estar aqui
            if (userProfile && !userProfile.setup_completed) {
                // Precisa completar setup primeiro
                router.push('/setup');
            } else {
                // Já fez setup, vai para home
                router.push('/');
            }
        }
    }, [user, loading, userProfile, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative z-[1]">
                <div className="w-8 h-8 border-2 border-[#8a00c4] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Se usuário está logado, não mostra nada (vai redirecionar)
    if (user) {
        return null;
    }

    // Usuário não está logado, pode acessar
    return <div className="relative z-[1]">{children}</div>;
}
