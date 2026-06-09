import { isSafari } from "./mobile";

// Intent flag key for tracking connection attempts
const INTENT_KEY = 'vaultfi_phantom_connect_pending';

// Time to wait before assuming Phantom didn't open at all (2.0 seconds total)
const FALLBACK_DELAY_MS = 2000;

// Fallback URL if Phantom is not installed
const PHANTOM_INSTALL_URL = 'https://phantom.app/download';

/**
 * Helper to dynamically inject and display a premium overlay modal for Telegram In-App Browser users,
 * instructing them to open the dApp in Safari/default browser to complete the wallet connection.
 */
function showTelegramOverlay(url: string): void {
    if (typeof document === 'undefined') return;

    // Prevent duplicate overlays
    if (document.getElementById('tg-phantom-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'tg-phantom-overlay';
    
    Object.assign(overlay.style, {
        position: 'fixed',
        inset: '0',
        backgroundColor: 'rgba(7, 10, 13, 0.85)',
        backdropFilter: 'blur(10px)',
        webkitBackdropFilter: 'blur(10px)',
        zIndex: '999999',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'tgFadeIn 0.3s ease-out'
    });

    const styleTag = document.createElement('style');
    styleTag.textContent = `
        @keyframes tgFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes tgSlideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(styleTag);

    const card = document.createElement('div');
    Object.assign(card.style, {
        background: '#131A22',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '32px 24px',
        width: '100%',
        maxWidth: '360px',
        textAlign: 'center',
        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)',
        position: 'relative',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        color: '#FFFFFF',
        animation: 'tgSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    });

    // Close Button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    Object.assign(closeBtn.style, {
        position: 'absolute',
        right: '20px',
        top: '20px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: 'none',
        borderRadius: '50%',
        width: '32px',
        height: '32px',
        color: '#A0AEC0',
        fontSize: '14px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.2s',
        outline: 'none'
    });
    closeBtn.onclick = () => {
        document.body.removeChild(overlay);
    };

    // Header Link/Safari Icon
    const iconContainer = document.createElement('div');
    Object.assign(iconContainer.style, {
        width: '60px',
        height: '60px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #2A85FF 0%, #0055D6 100%)',
        margin: '0 auto 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 16px rgba(42, 133, 255, 0.2)'
    });
    iconContainer.innerHTML = `
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M15 3H21V9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 14L21 3" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;

    // Title
    const title = document.createElement('h3');
    title.textContent = 'Open in External Browser';
    Object.assign(title.style, {
        margin: '0 0 12px',
        fontSize: '20px',
        fontWeight: '700',
        letterSpacing: '-0.5px'
    });

    // Subtitle
    const subtitle = document.createElement('p');
    subtitle.textContent = "Telegram's in-app browser does not support direct wallet integrations. Please open this page in Safari/Chrome.";
    Object.assign(subtitle.style, {
        margin: '0 0 24px',
        fontSize: '14px',
        color: '#A0AEC0',
        lineHeight: '1.5'
    });

    // Steps list
    const steps = document.createElement('div');
    Object.assign(steps.style, {
        textAlign: 'left',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '24px',
        border: '1px solid rgba(255, 255, 255, 0.04)'
    });

    const stepItems = [
        'Tap the <b>•••</b> (three dots) menu icon in the top corner.',
        'Select <b>"Open in Safari"</b> or <b>"Open in Browser"</b>.',
        'Once loaded in Safari, tap <b>Connect Wallet</b> again.'
    ];

    stepItems.forEach((text, index) => {
        const step = document.createElement('div');
        Object.assign(step.style, {
            display: 'flex',
            alignItems: 'flex-start',
            fontSize: '13px',
            lineHeight: '1.5',
            color: '#E2E8F0',
            marginBottom: index === stepItems.length - 1 ? '0' : '12px'
        });

        const num = document.createElement('span');
        num.textContent = String(index + 1);
        Object.assign(num.style, {
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: '600',
            marginRight: '10px',
            flexShrink: '0',
            color: '#2A85FF'
        });

        const txt = document.createElement('span');
        txt.innerHTML = text;

        step.appendChild(num);
        step.appendChild(txt);
        steps.appendChild(step);
    });

    // Copy Button
    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy Link to Clipboard';
    Object.assign(copyBtn.style, {
        width: '100%',
        padding: '14px',
        background: '#2A85FF',
        border: 'none',
        borderRadius: '14px',
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'background 0.2s',
        outline: 'none'
    });
    copyBtn.onclick = () => {
        navigator.clipboard.writeText(url).then(() => {
            copyBtn.textContent = 'Link Copied!';
            copyBtn.style.background = '#10B981';
            setTimeout(() => {
                copyBtn.textContent = 'Copy Link to Clipboard';
                copyBtn.style.background = '#2A85FF';
            }, 2000);
        }).catch(() => {
            copyBtn.textContent = 'Failed to copy';
            copyBtn.style.background = '#EF4444';
        });
    };

    card.appendChild(closeBtn);
    card.appendChild(iconContainer);
    card.appendChild(title);
    card.appendChild(subtitle);
    card.appendChild(steps);
    card.appendChild(copyBtn);

    overlay.appendChild(card);
    document.body.appendChild(overlay);
}

/**
 * Open the current page in Phantom's in-app browser
 * 
 * Strategy:
 * 1. Telegram WebApp: Opens the Universal Link using Telegram's native openLink API.
 * 2. Telegram In-App Browser (WebView): Displays a step-by-step instruction overlay
 *    guiding users to open the page in Safari/Chrome.
 * 3. iOS Safari: Redirects directly to the Universal Link. Safari natively handles
 *    Universal Links correctly—opening the app if installed, or loading the webpage/App Store fallback.
 * 4. Third-party iOS browsers (Chrome, Brave):
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
        console.log('[Phantom Deep-Link] Telegram WebApp detected, using native openLink with intermediate redirector');
        const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const intermediateRedirectUrl = `${originUrl}/redirect-phantom?url=${encodeURIComponent(targetUrl)}`;
        tg.openLink(intermediateRedirectUrl);
        return;
    }

    // 2. Check if running inside Telegram In-App Browser (standard Webview)
    const isTelegramBrowser = /telegram/i.test(navigator.userAgent);
    if (isTelegramBrowser) {
        console.log('[Phantom Deep-Link] Telegram In-App Browser detected. Showing instructions overlay.');
        showTelegramOverlay(targetUrl);
        // Try to trigger custom scheme as a backup, but do not trigger universal link fallback timer
        window.location.href = customDeepLink;
        return;
    }

    // 3. iOS Safari native Universal Link handling
    if (isSafari()) {
        console.log('[Phantom Deep-Link] Native Safari iOS detected. Redirecting directly to Universal Link.');
        window.location.href = universalLink;
        return;
    }

    // 4. Third-party browsers (Chrome iOS, Brave)
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
