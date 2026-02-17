import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function getContrastColor(hexColor: string): string {
    // Remove hash if present
    const hex = hexColor.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Calculate relative luminance (per W3C spec)
    // L = 0.2126 * R + 0.7152 * G + 0.0722 * B
    // But for simple contrast, YIQ or simple brightness often suffices for UI
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    // Returns black for light backgrounds, white for dark backgrounds
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
}
