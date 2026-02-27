'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface UserProfile {
    setup_completed: boolean;
    highlight_color?: string;
    full_name?: string;
    handle?: string;
    avatar_url?: string;
    instagram_handle?: string;
    instagram_username?: string;
    offers?: { name: string; type: string; main_benefit: string; price_range: string; purchase_method: string; cta_keyword: string; is_primary: boolean }[];
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    userProfile: UserProfile | null;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signUp: (email: string, password: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    const fetchUserProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('setup_completed, highlight_color, full_name, avatar_url, instagram_handle, instagram_username, offers')
                .eq('id', userId)
                .single();

            if (data && !error) {
                setUserProfile({
                    setup_completed: (data as any).setup_completed ?? false,
                    highlight_color: (data as any).highlight_color,
                    full_name: (data as any).full_name,
                    handle: (data as any).instagram_username,
                    avatar_url: (data as any).avatar_url,
                    instagram_handle: (data as any).instagram_handle,
                    instagram_username: (data as any).instagram_username,
                    offers: (data as any).offers ?? [],
                });
            } else {
                // No row in users table (PGRST116) or other error — treat as incomplete setup
                setUserProfile({ setup_completed: false });
            }
        } catch (err) {
            console.error('[AUTH] fetchUserProfile error:', err);
            setUserProfile({ setup_completed: false });
        }
    }, []);

    // 1. Synchronous onAuthStateChange — avoids deadlock with Supabase auth lock.
    //    In v2.95+, the callback holds an internal lock; calling supabase.from()
    //    inside it triggers getSession() which tries to acquire the same lock → deadlock.
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                if (!session?.user) {
                    setUserProfile(null);
                    setLoading(false);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // 2. Profile fetch — runs AFTER auth lock is released, then sets loading=false.
    useEffect(() => {
        if (user) {
            fetchUserProfile(user.id).finally(() => setLoading(false));
        }
    }, [user, fetchUserProfile]);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
    };

    const signUp = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({ email, password });
        return { error };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUserProfile(null);
        window.location.href = '/';
    };

    const refreshUserProfile = async () => {
        if (user) {
            await fetchUserProfile(user.id);
        }
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, userProfile, signIn, signUp, signOut, refreshUserProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
