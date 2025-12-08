/**
 * Phantom Deep-Link Launcher using Universal Links
 * 
 * Opens the current page inside Phantom's in-app browser using Phantom Universal Links
 * Format: https://phantom.app/ul/browse?url=<encoded_url>
 * 
 * This implementation includes:
 * - Intent tracking via localStorage
 * - Fallback timer for app-not-installed scenarios
 * - Automatic cleanup on successful app launch
 */

// Intent flag key for tracking connection attempts
const INTENT_KEY = 'vaultfi_phantom_connect_pending';

// Time to wait before assuming Phantom didn't open (2.5 seconds)
const FALLBACK_DELAY_MS = 2500;

// Fallback URL if Phantom is not installed
const PHANTOM_INSTALL_URL = 'https://phantom.app/download';

/**
 * Open the current page in Phantom's in-app browser using Universal Links
 * 
 * Universal Link Format: https://phantom.app/ul/browse?url=<encoded_url>
 * 
 * Flow:
 * 1. Sets intent flag in localStorage (vaultfi_phantom_connect_pending = "1")
 * 2. Navigates to Phantom Universal Link
 * 3. If Phantom opens → page loads in in-app browser with window.solana available
 * 4. If Phantom doesn't open within 2.5s → redirects to install page
 * 
 * @param url - Optional URL to open in Phantom. Defaults to current window.location.href
 */
export function openPhantom(url?: string): void {
    if (typeof window === 'undefined') return;

    // Use provided URL or current page URL
    // This ensures the user returns to the exact same page after Phantom opens
    const targetUrl = url || window.location.href;

    // STEP 1: Store intent flag BEFORE navigating
    // This flag will be checked when the page loads inside Phantom's in-app browser
    // to automatically trigger wallet connection
    try {
        localStorage.setItem(INTENT_KEY, '1');
        console.log('[Phantom Deep-Link] Intent flag set');
    } catch (e) {
        console.error('[Phantom Deep-Link] Failed to set intent flag:', e);
    }

    // STEP 2: Encode the URL exactly once
    // IMPORTANT: Single encoding only - double encoding will break the deep-link
    const encodedUrl = encodeURIComponent(targetUrl);

    // STEP 3: Build Phantom Universal Link
    // Format: https://phantom.app/ul/browse?url=<encoded_url>
    // This is the OFFICIAL format for Phantom Universal Links that works on iOS & Android
    const phantomUniversalLink = `https://phantom.app/ul/browse?url=${encodedUrl}`;

    console.log('[Phantom Deep-Link] Opening Phantom', {
        targetUrl,
        universalLink: phantomUniversalLink,
        intentSet: true
    });

    // STEP 4: Set fallback timer
    // If Phantom doesn't open within 2.5s, assume it's not installed
    // and redirect to install page
    const fallbackTimer = setTimeout(() => {
        console.log('[Phantom Deep-Link] Fallback timer triggered - redirecting to install page');

        // Clear intent flag since redirect failed
        try {
            localStorage.removeItem(INTENT_KEY);
        } catch (e) {
            // Ignore errors when clearing
        }

        // Redirect to Phantom install page
        window.location.href = PHANTOM_INSTALL_URL;
    }, FALLBACK_DELAY_MS);

    // STEP 5: Listen for visibility change
    // If Phantom opens successfully, the page will be hidden (user switched to Phantom app)
    // This allows us to cancel the fallback timer
    const handleVisibilityChange = () => {
        if (document.hidden) {
            console.log('[Phantom Deep-Link] Page hidden - Phantom likely opened');
            clearTimeout(fallbackTimer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // STEP 6: Trigger Universal Link navigation
    // CRITICAL: This must be called synchronously within a user gesture (button click)
    // Async operations before this line will break the deep-link on iOS
    window.location.href = phantomUniversalLink;
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
