/**
 * Mobile Detection and Phantom Deep-Linking Utilities
 * 
 * Provides functions to detect mobile browsers and redirect users
 * to Phantom's in-app browser for seamless wallet connection.
 */

/**
 * Detect if the user is on a mobile device
 * Uses user agent detection for iOS, Android, and other mobile platforms
 */
export function isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;

    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

    // Check for common mobile user agents
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
}

/**
 * Detect if already running in Phantom's in-app browser
 * Phantom's browser adds specific properties to the window object
 * Checks multiple indicators for more reliable detection
 */
export function isPhantomBrowser(): boolean {
    if (typeof window === 'undefined') return false;

    const anyWindow = window as any;

    // Method 1: Check window.solana (most common)
    const solana = anyWindow.solana;
    if (solana?.isPhantom && solana?.isMobile) {
        return true;
    }

    // Method 2: Check window.phantom.solana (alternative property)
    const phantomSolana = anyWindow.phantom?.solana;
    if (phantomSolana?.isPhantom) {
        return true;
    }

    // Method 3: Check user agent for Phantom browser
    const userAgent = navigator.userAgent || '';
    if (/Phantom/i.test(userAgent)) {
        return true;
    }

    return false;
}

/**
 * Open the current page in Phantom's in-app browser using deep-linking
 * Uses Phantom's custom URL scheme for mobile app integration
 * 
 * @param url - Optional URL to open. Defaults to current window location
 */
export function openInPhantomBrowser(url?: string): void {
    if (typeof window === 'undefined') return;

    // Use provided URL or current page URL
    const targetUrl = url || window.location.href;

    // Encode the URL for the deep link
    const encodedUrl = encodeURIComponent(targetUrl);

    // Phantom's custom URL scheme for deep-linking
    // Format: phantom://browse?url=<encoded-url>
    const phantomDeepLink = `phantom://browse?url=${encodedUrl}`;

    // Redirect to Phantom via custom URL scheme
    window.location.href = phantomDeepLink;
}

/**
 * Check if mobile user should be redirected to Phantom browser
 * Returns true if on mobile AND not already in Phantom browser
 */
export function shouldRedirectToPhantom(): boolean {
    return isMobileDevice() && !isPhantomBrowser();
}
