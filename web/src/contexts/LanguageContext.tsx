'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { translations } from '../i18n/translations';

type Language = 'en' | 'pt';
type Currency = 'usd' | 'brl';

interface LanguageContextType {
    language: Language;
    currency: Currency;
    setLanguage: (lang: Language) => void;
    t: (path: string) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({
    children,
    initialLanguage = 'en'
}: {
    children: ReactNode,
    initialLanguage?: Language
}) {
    const [language, setLanguageState] = useState<Language>(initialLanguage);

    // Derive currency from language: PT -> BRL, EN -> USD
    const currency: Currency = language === 'pt' ? 'brl' : 'usd';

    // Sync state if initialLanguage changes (e.g. from server/cookie)
    useEffect(() => {
        setLanguageState(initialLanguage);
    }, [initialLanguage]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        Cookies.set('NEXT_LOCALE', lang, { expires: 365 }); // Persist for 1 year
    };

    const t = (path: string): any => {
        const keys = path.split('.');
        let current: any = translations[language];

        for (const key of keys) {
            if (current === undefined) return path;
            current = current[key];
        }

        return current || path;
    };

    return (
        <LanguageContext.Provider value={{ language, currency, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
