'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

interface AuthGuardProps {
    children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/reception');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative z-[1]">
                <div className="w-8 h-8 border-2 border-[#8a00c4] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect via useEffect
    }

    return <div className="relative z-[1]">{children}</div>;
}
