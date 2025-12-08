/**
 * Auto-Connect Hook for Phantom In-App Browser
 * 
 * Automatically connects wallet when page loads inside Phantom's in-app browser
 * after a deep-link redirect
 */

"use client";

import { useEffect, useRef } from 'react';
import { isPhantomInApp } from '@/utils/mobile';
import { hasPendingPhantomIntent, clearPhantomIntent } from '@/utils/openPhantom';

export interface UseAutoConnectInPhantomOptions {
    /**
     * Callback function to connect the wallet
     * Should return a Promise that resolves when connection succeeds
     */
    onConnect: () => Promise<void>;

    /**
     * Whether auto-connect is enabled
     * @default true
     */
    enabled?: boolean;
}

/**
 * Hook to auto-connect wallet when page loads inside Phantom
 * 
 * Usage:
 * ```tsx
 * useAutoConnectInPhantom({
 *   onConnect: async () => {
 *     await connectPhantom();
 *   }
 * });
 * ```
 */
export function useAutoConnectInPhantom(options: UseAutoConnectInPhantomOptions): void {
    const { onConnect, enabled = true } = options;
    const hasAttemptedRef = useRef(false);

    useEffect(() => {
        // Only run once
        if (hasAttemptedRef.current) return;

        // Only run if enabled
        if (!enabled) return;

        // Only run in browser
        if (typeof window === 'undefined') return;

        // Check if we're in Phantom's in-app browser
        const inPhantom = isPhantomInApp();
        if (!inPhantom) return;

        // Check if there's a pending connect intent
        const hasPendingIntent = hasPendingPhantomIntent();
        if (!hasPendingIntent) return;

        // Mark as attempted
        hasAttemptedRef.current = true;

        console.log('[Auto-Connect] Detected Phantom in-app browser with pending intent');

        // Clear intent flag immediately
        clearPhantomIntent();

        // Auto-connect with a small delay to ensure DOM is ready
        const timer = setTimeout(async () => {
            try {
                console.log('[Auto-Connect] Starting wallet connection...');
                await onConnect();
                console.log('[Auto-Connect] Wallet connected successfully');
            } catch (error) {
                console.error('[Auto-Connect] Failed to connect wallet:', error);
            }
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [onConnect, enabled]);
}
