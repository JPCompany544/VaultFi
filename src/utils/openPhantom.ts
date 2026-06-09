import { isSafari } from "./mobile";

// Intent flag key for tracking connection attempts
const INTENT_KEY = 'vaultfi_phantom_connect_pending';

// Time to wait before assuming Phantom didn't open at all (2.0 seconds total)
const FALLBACK_DELAY_MS = 2000;

// Fallback URL if Phantom is not installed
const PHANTOM_INSTALL_URL = 'https://phantom.app/download';

/**
 * Open the current page in Phantom's in-app browser
 * 
 * Strategy:
 * 1. Telegram WebApp: Opens the Universal Link using Telegram's native openLink API.
 * 2. iOS Safari: Redirects directly to the Universal Link. Safari natively handles
 *    Universal Links correctly—opening the app if installed, or loading the webpage/App Store fallback.
 * 3. Third-party iOS browsers (Chrome, Brave, Telegram in-app browser):
 *    Uses custom scheme 'phantom://browse/...' to force app opening. Sets a 2.0s fallback timer
 *    to redirect to the Universal Link if Phantom is not installed, protected by blur/pagehide
 *    event listeners to prevent double-redirects when the app successfully opens.
 * 
 * @param url - Optional URL to open in Phantom. Defaults to current window.location.href
 */
export function openPhantom(url?: string): void {
    if (typeof window === 'undefined') return;

    // Use provided URL or current page URL
    const targetUrl = url || window.location.href;

    // Store intent flag BEFORE any navigation
    try {
        localStorage.setItem(INTENT_KEY, '1');
        console.log('[Phantom Deep-Link] Intent flag set');
    } catch (e) {
        console.error('[Phantom Deep-Link] Failed to set intent flag:', e);
    }

    const encodedUrl = encodeURIComponent(targetUrl);
    const origin = typeof window !== 'undefined' ? window.location.origin : targetUrl;
    const encodedRef = encodeURIComponent(origin);

    // Correct deep link formats
    const customDeepLink = `phantom://browse/${encodedUrl}?ref=${encodedRef}`;
    const universalLink = `https://phantom.app/ul/browse/${encodedUrl}?ref=${encodedRef}`;

    console.log('[Phantom Deep-Link] Starting deep-link flow', {
        targetUrl,
        customDeepLink,
        universalLink,
        intentSet: true
    });

    // 1. Check if running inside Telegram WebApp (Mini App context)
    const anyWindow = window as any;
    const tg = anyWindow?.Telegram?.WebApp;
    if (tg && typeof tg.openLink === 'function') {
        console.log('[Phantom Deep-Link] Telegram WebApp detected, using native openLink');
        tg.openLink(universalLink);
        return;
    }

    // 2. iOS Safari native Universal Link handling
    if (isSafari()) {
        console.log('[Phantom Deep-Link] Native Safari iOS detected. Redirecting directly to Universal Link.');
        window.location.href = universalLink;
        return;
    }

    // 3. Third-party browsers (Chrome iOS, Brave, Telegram in-app browser)
    console.log('[Phantom Deep-Link] Third-party browser / client detected. Using Custom Scheme with fallback.');

    let appOpened = false;

    // Timer to redirect to download page if custom scheme doesn't open the app
    const fallbackTimer = setTimeout(() => {
        if (!appOpened && !document.hidden) {
            console.log('[Phantom Deep-Link] Fallback timer expired. Redirecting to Universal Link.');
            window.location.href = universalLink;
        }
    }, FALLBACK_DELAY_MS);

    // Cleanup helper for listeners and timer
    const cleanup = () => {
        appOpened = true;
        clearTimeout(fallbackTimer);
        window.removeEventListener('pagehide', handlePageHide);
        window.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleBlur);
    };

    const handlePageHide = () => {
        console.log('[Phantom Deep-Link] pagehide event fired - app opened');
        cleanup();
    };

    const handleVisibilityChange = () => {
        if (document.hidden) {
            console.log('[Phantom Deep-Link] visibilitychange (hidden) event fired - app opened');
            cleanup();
        }
    };

    const handleBlur = () => {
        console.log('[Phantom Deep-Link] window blur event fired - app prompt showing or app opened');
        cleanup();
    };

    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    // Trigger custom scheme redirect
    window.location.href = customDeepLink;
}


/**
 * Check if there's a pending Phantom connect intent
 * 
 * Returns true if the intent flag is set to "1"
 * This indicates the user initiated a connection and we're waiting for them to return from Phantom
 * 
 * @returns boolean - true if intent flag is set, false otherwise
 */
export function hasPendingPhantomIntent(): boolean {
    if (typeof window === 'undefined') return false;

    try {
        const intent = localStorage.getItem(INTENT_KEY);
        return intent === '1';
    } catch (e) {
        console.error('[Phantom Deep-Link] Failed to check intent flag:', e);
        return false;
    }
}

/**
 * Clear the pending Phantom connect intent
 * 
 * Should be called after:
 * - Successfully connecting the wallet
 * - Connection error occurs
 * - User cancels the connection
 * 
 * This prevents auto-connect from triggering on subsequent page loads
 */
export function clearPhantomIntent(): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.removeItem(INTENT_KEY);
        console.log('[Phantom Deep-Link] Intent flag cleared');
    } catch (e) {
        console.error('[Phantom Deep-Link] Failed to clear intent flag:', e);
    }
}
