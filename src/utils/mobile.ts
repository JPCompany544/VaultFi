/**
 * Mobile Detection Utilities
 * 
 * Stable environment detection for Next.js App Router
 * Detects mobile devices, Phantom in-app browser, iOS, and Android
 */

/**
 * Detect if the user is on a mobile device
 * Works reliably in Next.js App Router with SSR
 */
export function isMobile(): boolean {
    if (typeof window === 'undefined') return false;

    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

    // Check for common mobile user agents
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
}

/**
 * Detect if running inside Phantom's in-app browser
 * Uses multiple detection methods for reliability
 */
export function isPhantomInApp(): boolean {
    if (typeof window === 'undefined') return false;

    const anyWindow = window as any;

    // Method 1: Check window.solana with both isPhantom and isMobile flags
    const solana = anyWindow.solana;
    if (solana?.isPhantom && solana?.isMobile) {
        return true;
    }

    // Method 2: Check window.phantom.solana
    const phantomSolana = anyWindow.phantom?.solana;
    if (phantomSolana?.isPhantom && phantomSolana?.isMobile) {
        return true;
    }

    // Method 3: Check user agent for Phantom browser signature
    const userAgent = navigator.userAgent || '';
    if (/Phantom/i.test(userAgent)) {
        return true;
    }

    // Method 4: Check if window.solana exists on mobile (strong indicator)
    if (isMobile() && solana?.isPhantom) {
        return true;
    }

    return false;
}

/**
 * Detect if the user is on iOS
 */
export function isIOS(): boolean {
    if (typeof window === 'undefined') return false;

    const userAgent = navigator.userAgent || navigator.vendor;

    // Check for iPhone, iPad, or iPod
    return /iphone|ipad|ipod/i.test(userAgent);
}

/**
 * Detect if the user is on Android
 */
export function isAndroid(): boolean {
    if (typeof window === 'undefined') return false;

    const userAgent = navigator.userAgent || navigator.vendor;

    // Check for Android
    return /android/i.test(userAgent);
}

/**
 * Check if mobile user needs to open Phantom
 * Returns true if on mobile AND NOT already in Phantom in-app browser
 */
export function shouldOpenPhantom(): boolean {
    return isMobile() && !isPhantomInApp();
}
