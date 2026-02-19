'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

interface SetupRequiredGuardProps {
    children: React.ReactNode;
}

const EXEMPT_ROUTES = ['/setup', '/reception', '/login', '/shadowfeedadmin'];
const AUTH_ONLY_ROUTES: string[] = [];

export function SetupRequiredGuard({ children }: SetupRequiredGuardProps) {
    const { user, userProfile, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const isExempt = EXEMPT_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
    const isAuthOnly = AUTH_ONLY_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));

    useEffect(() => {
        if (isExempt || loading) return;

        // Sem user → /reception
        if (!user) {
            router.replace('/reception');
            return;
        }

        // User logado sem setup completo → /setup
        if ((!userProfile || !userProfile.setup_completed) && !isAuthOnly) {
            router.replace('/setup');
        }
    }, [user, userProfile, loading, pathname, router, isExempt, isAuthOnly]);

    // Rotas isentas: sempre renderiza
    if (isExempt) return <>{children}</>;

    // Loading / redirecting: show spinner instead of blank screen
    if (loading || !user || ((!userProfile || !userProfile.setup_completed) && !isAuthOnly)) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#8a00c4] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return <>{children}</>;
}
