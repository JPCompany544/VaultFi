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
 * Uses the universal link format which works reliably across platforms
 * 
 * @param url - Optional URL to open. Defaults to current window location
 */
export function openInPhantomBrowser(url?: string): void {
    if (typeof window === 'undefined') return;

    // Use provided URL or current page URL
    const targetUrl = url || window.location.href;

    // For Phantom's in-app browser, we need to use the universal link format
    // The universal link MUST be opened as a direct navigation (not iframe, not custom scheme)
    // Format: https://phantom.app/ul/browse/<url>?ref=<ref>

    // IMPORTANT: The URL should NOT be double-encoded
    // Just encode once for the URL path
    const encodedUrl = encodeURIComponent(targetUrl);

    // Use universal link format - this is the ONLY format that reliably opens the in-app browser
    const phantomBrowserLink = `https://phantom.app/ul/browse/${encodedUrl}?ref=${encodedUrl}`;

    // Direct navigation to the universal link
    // This will:
    // 1. Open Phantom app if installed
    // 2. Open the in-app browser inside Phantom
    // 3. Load the specified URL in that browser
    window.location.href = phantomBrowserLink;
}

/**
 * Check if mobile user should be redirected to Phantom browser
 * Returns true if on mobile AND not already in Phantom browser
 */
export function shouldRedirectToPhantom(): boolean {
    return isMobileDevice() && !isPhantomBrowser();
}
