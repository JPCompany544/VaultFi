/**
 * Phantom Connect Button Component
 * 
 * Production-ready wallet connect button with proper mobile deep-linking
 */

"use client";

import { useState } from 'react';
import { isMobile, isPhantomInApp } from '@/utils/mobile';
import { openPhantom } from '@/utils/openPhantom';
import { Wallet, Loader2 } from 'lucide-react';

export interface PhantomConnectButtonProps {
    /**
     * Callback when wallet is successfully connected
     */
    onConnect?: (address: string) => void;

    /**
     * Callback when connection fails
     */
    onError?: (error: Error) => void;

    /**
     * Custom button text
     * @default "Connect Wallet"
     */
    buttonText?: string;

    /**
     * Custom CSS classes
     */
    className?: string;

    /**
     * Whether the button is disabled
     */
    disabled?: boolean;
}

/**
 * Complete Connect Wallet button with mobile deep-linking support
 * 
 * Flow:
 * - Desktop: Calls window.solana.connect() directly
 * - Mobile (not in Phantom): Opens Phantom app via deep-link
 * - Mobile (in Phantom): Calls window.solana.connect() directly
 */
export default function PhantomConnectButton({
    onConnect,
    onError,
    buttonText = "Connect Wallet",
    className,
    disabled = false
}: PhantomConnectButtonProps) {
    const [isConnecting, setIsConnecting] = useState(false);

    const handleConnect = async () => {
        // Prevent multiple simultaneous connection attempts
        if (isConnecting || disabled) return;

        try {
            setIsConnecting(true);

            // Check environment
            const onMobile = isMobile();
            const inPhantomApp = isPhantomInApp();

            console.log('[Connect Button]', {
                onMobile,
                inPhantomApp,
                hasProvider: !!(window as any).solana?.isPhantom
            });

            // Case 1: Mobile user NOT in Phantom app
            // → Open Phantom via deep-link
            if (onMobile && !inPhantomApp) {
                console.log('[Connect Button] Opening Phantom app...');
                openPhantom();
                // Function will redirect, no need to continue
                return;
            }

            // Case 2: Desktop OR already in Phantom app
            // → Connect directly using window.solana
            const provider = (window as any).solana;

            // Check if Phantom is available
            if (!provider?.isPhantom) {
                throw new Error('Phantom wallet not found. Please install Phantom.');
            }

            console.log('[Connect Button] Connecting to Phantom...');

            // Connect to Phantom
            const response = await provider.connect();
            const address = response?.publicKey?.toString();

            if (!address) {
                throw new Error('Failed to get wallet address');
            }

            console.log('[Connect Button] Connected:', address);

            // Call success callback
            onConnect?.(address);

        } catch (error) {
            console.error('[Connect Button] Connection failed:', error);

            const err = error instanceof Error
                ? error
                : new Error('Failed to connect wallet');

            onError?.(err);
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <button
            onClick={handleConnect}
            disabled={disabled || isConnecting}
            className={className || `w-full max-w-sm rounded-xl py-4 font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            {isConnecting ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Connecting...</span>
                </>
            ) : (
                <>
                    <Wallet className="w-5 h-5" />
                    <span>{buttonText}</span>
                </>
            )}
        </button>
    );
}
