/** Parse hex color to RGB components (0-255) */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const c = hex.replace('#', '');
    if (c.length !== 6) return null;
    return {
        r: parseInt(c.substring(0, 2), 16),
        g: parseInt(c.substring(2, 4), 16),
        b: parseInt(c.substring(4, 6), 16),
    };
}

/** Returns true if the hex color is considered "light" (luminance > 0.5) */
export function isLightColor(hex: string): boolean {
    const rgb = hexToRgb(hex);
    if (!rgb) return false;
    return (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) / 255 > 0.5;
}

/**
 * Blend a color towards white or black by a certain amount.
 * amount is 0-255, positive goes lighter, negative goes darker.
 */
export function adjustColor(hex: string, amount: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    const clamp = (v: number) => Math.max(0, Math.min(255, v));
    const r = clamp(rgb.r + amount);
    const g = clamp(rgb.g + amount);
    const b = clamp(rgb.b + amount);
    return `rgb(${r}, ${g}, ${b})`;
}
