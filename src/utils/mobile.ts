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
 */
export function isPhantomBrowser(): boolean {
    if (typeof window === 'undefined') return false;

    const solana = (window as any).solana;

    // Check if Phantom is available and if we're in their mobile browser
    // Phantom's in-app browser has the provider immediately available
    return !!(solana?.isPhantom && solana?.isMobile);
}

/**
 * Open the current page in Phantom's in-app browser using deep-linking
 * Uses Phantom's browse deep-link feature
 * 
 * @param url - Optional URL to open. Defaults to current window location
 */
export function openInPhantomBrowser(url?: string): void {
    if (typeof window === 'undefined') return;

    // Use provided URL or current page URL
    const targetUrl = url || window.location.href;

    // Encode the URL for the deep link
    const encodedUrl = encodeURIComponent(targetUrl);

    // Phantom's browse deep-link format
    // https://phantom.app/ul/browse/<encoded-url>?ref=<encoded-url>
    const phantomDeepLink = `https://phantom.app/ul/browse/${encodedUrl}?ref=${encodedUrl}`;

    // Redirect to Phantom
    window.location.href = phantomDeepLink;
}

/**
 * Check if mobile user should be redirected to Phantom browser
 * Returns true if on mobile AND not already in Phantom browser
 */
export function shouldRedirectToPhantom(): boolean {
    return isMobileDevice() && !isPhantomBrowser();
}
