
export type TypographyContext = 'default' | 'split' | 'hero';

export function getAdaptiveHeadlineSize(text: string, context: TypographyContext = 'default'): string {
    const length = text.length;

    if (context === 'hero') {
        if (length < 30) return '90px';
        if (length < 60) return '72px';
        return '56px';
    }

    // Default / Content slides
    if (length < 20) return '80px';
    if (length < 40) return '64px';
    if (length < 80) return '56px';
    if (length < 120) return '48px';
    return '40px';
}

export function getAdaptiveBodySize(text: string, context: TypographyContext = 'default'): string {
    if (!text) return '24px';
    const length = text.length;

    if (context === 'split') {
        // Split layout has less width, so text wraps more.
        if (length < 100) return '36px';
        if (length < 200) return '28px';
        if (length < 350) return '24px';
        return '20px';
    }

    // Full width content
    if (length < 100) return '48px';
    if (length < 250) return '40px'; // Increased from 32px based on user request for "larger"
    if (length < 400) return '32px';
    if (length < 600) return '28px';
    return '24px';
}
