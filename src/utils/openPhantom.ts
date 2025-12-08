/**
 * Phantom Deep-Link Launcher with Custom Scheme + Universal Link Fallback
 * 
 * Strategy:
 * 1. Try custom deep-link first: phantom://app/vault-deposit?url=<encoded_url>
 * 2. If that fails (Phantom not installed), fallback to Universal Link
 * 3. If Universal Link fails, redirect to install page after 2.5s
 * 
 * This implementation includes:
 * - Intent tracking via localStorage
 * - Dual fallback strategy (custom scheme → universal link → install page)
 * - Automatic cleanup on successful app launch
 */

// Intent flag key for tracking connection attempts
const INTENT_KEY = 'vaultfi_phantom_connect_pending';

// Time to wait before trying Universal Link fallback (500ms)
const CUSTOM_SCHEME_TIMEOUT_MS = 500;

// Time to wait before assuming Phantom didn't open at all (2.5 seconds total)
const FALLBACK_DELAY_MS = 2500;

// Fallback URL if Phantom is not installed
const PHANTOM_INSTALL_URL = 'https://phantom.app/download';

/**
 * Open the current page in Phantom's in-app browser
 * 
 * Strategy:
 * 1. Custom Scheme: phantom://app/vault-deposit?url=<encoded_url>
 *    - Fastest, opens directly if Phantom is installed
 *    - If fails (500ms timeout) → try Universal Link
 * 
 * 2. Universal Link: https://phantom.app/ul/browse?url=<encoded_url>
 *    - More reliable fallback
 *    - Works even if custom scheme blocked
 * 
 * 3. Install Page: https://phantom.app/download
 *    - Last resort if neither worked (2.5s timeout)
 * 
 * Flow:
 * 1. Sets intent flag in localStorage (vaultfi_phantom_connect_pending = "1")
 * 2. Tries custom deep-link first
 * 3. Waits 500ms, if page still visible → tries Universal Link
 * 4. Waits 2.5s total, if page still visible → redirects to install page
 * 
 * @param url - Optional URL to open in Phantom. Defaults to current window.location.href
 */
export function openPhantom(url?: string): void {
    if (typeof window === 'undefined') return;

    // Use provided URL or current page URL
    // This ensures the user returns to the exact same page after Phantom opens
    const targetUrl = url || window.location.href;

    // STEP 1: Store intent flag BEFORE any navigation
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

    // STEP 3a: Build custom deep-link (primary method)
    // Format: phantom://app/vault-deposit?url=<encoded_url>
    // This is faster and more direct if Phantom is installed
    const customDeepLink = `phantom://app/vault-deposit?url=${encodedUrl}`;

    // STEP 3b: Build Universal Link (fallback method)
    // Format: https://phantom.app/ul/browse?url=<encoded_url>
    // This works even if custom scheme is blocked or fails
    const universalLink = `https://phantom.app/ul/browse?url=${encodedUrl}`;

    console.log('[Phantom Deep-Link] Starting deep-link flow', {
        targetUrl,
        customDeepLink,
        universalLink,
        intentSet: true
    });

    // Track if app has opened
    let appOpened = false;

    // STEP 4: Set ultimate fallback timer (2.5s total)
    // If Phantom doesn't open at all within 2.5s, redirect to install page
    const ultimateFallbackTimer = setTimeout(() => {
        if (!appOpened) {
            console.log('[Phantom Deep-Link] Ultimate fallback - redirecting to install page');

            // Clear intent flag since nothing worked
            try {
                localStorage.removeItem(INTENT_KEY);
            } catch (e) {
                // Ignore errors when clearing
            }

            // Redirect to Phantom install page
            window.location.href = PHANTOM_INSTALL_URL;
        }
    }, FALLBACK_DELAY_MS);

    // STEP 5: Listen for visibility change to detect if app opened
    // If Phantom opens successfully, the page will be hidden (user switched to Phantom app)
    const handleVisibilityChange = () => {
        if (document.hidden) {
            console.log('[Phantom Deep-Link] Page hidden - Phantom opened successfully');
            appOpened = true;
            clearTimeout(ultimateFallbackTimer);
            clearTimeout(universalLinkFallbackTimer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // STEP 6: Try custom deep-link FIRST
    // This is the fastest method if Phantom is installed
    console.log('[Phantom Deep-Link] Attempting custom scheme:', customDeepLink);
    window.location.href = customDeepLink;

    // STEP 7: Set Universal Link fallback timer (500ms)
    // If custom scheme didn't work (page still visible after 500ms), try Universal Link
    const universalLinkFallbackTimer = setTimeout(() => {
        if (!appOpened && !document.hidden) {
            console.log('[Phantom Deep-Link] Custom scheme timeout - trying Universal Link:', universalLink);
            window.location.href = universalLink;
        }
    }, CUSTOM_SCHEME_TIMEOUT_MS);
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
