/**
 * Phantom Deep-Link Launcher
 * 
 * Opens the current page inside Phantom's in-app browser using the phantom:// scheme
 * Includes intent tracking and fallback handling
 */

const INTENT_KEY = 'vaultfi_phantom_connect_pending';
const FALLBACK_DELAY_MS = 2500;
const PHANTOM_INSTALL_URL = 'https://phantom.app/download';

/**
 * Open the current page in Phantom's in-app browser
 * 
 * This function:
 * 1. Sets an intent flag in localStorage
 * 2. Navigates to phantom://browse?url=<current_url>
 * 3. Sets a fallback timer to Phantom install page if app doesn't open
 * 
 * @param url - Optional URL to open. Defaults to current window location
 */
export function openPhantom(url?: string): void {
    if (typeof window === 'undefined') return;

    // Use provided URL or current page URL
    const targetUrl = url || window.location.href;

    // Store intent flag BEFORE navigating
    // This will be checked when the page loads inside Phantom
    try {
        localStorage.setItem(INTENT_KEY, '1');
    } catch (e) {
        console.error('Failed to set Phantom intent flag:', e);
    }

    // Encode the URL exactly once
    const encodedUrl = encodeURIComponent(targetUrl);

    // Use phantom:// custom scheme for in-app browser
    // This is the CORRECT format for opening Phantom's in-app browser
    const phantomDeepLink = `phantom://browse?url=${encodedUrl}`;

    console.log('[Phantom Deep-Link]', {
        targetUrl,
        deepLink: phantomDeepLink,
        intentSet: true
    });

    // Set fallback timer in case Phantom doesn't open
    // This handles the case where Phantom is not installed
    const fallbackTimer = setTimeout(() => {
        // Clear intent flag since redirect failed
        try {
            localStorage.removeItem(INTENT_KEY);
        } catch (e) {
            // Ignore
        }

        // Redirect to Phantom install page
        window.location.href = PHANTOM_INSTALL_URL;
    }, FALLBACK_DELAY_MS);

    // Listen for visibility change to clear fallback timer
    // If Phantom opens, the page will be hidden and timer should be cleared
    const handleVisibilityChange = () => {
        if (document.hidden) {
            clearTimeout(fallbackTimer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Trigger deep link immediately (must be in user gesture context)
    window.location.href = phantomDeepLink;
}

/**
 * Check if there's a pending Phantom connect intent
 * Returns true if the intent flag is set
 */
export function hasPendingPhantomIntent(): boolean {
    if (typeof window === 'undefined') return false;

    try {
        return localStorage.getItem(INTENT_KEY) === '1';
    } catch (e) {
        return false;
    }
}

/**
 * Clear the pending Phantom connect intent
 * Should be called after successfully connecting
 */
export function clearPhantomIntent(): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.removeItem(INTENT_KEY);
    } catch (e) {
        console.error('Failed to clear Phantom intent flag:', e);
    }
}
