"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function RedirectHandler() {
    const searchParams = useSearchParams();
    const url = searchParams.get("url");

    useEffect(() => {
        if (!url) return;

        const encodedUrl = encodeURIComponent(url);
        const customScheme = `phantom://browse/${encodedUrl}?ref=${encodedUrl}`;
        const universalLink = `https://phantom.app/ul/browse/${encodedUrl}?ref=${encodedUrl}`;

        // Attempt custom scheme redirect first
        window.location.href = customScheme;

        // Fallback to Universal Link if custom scheme doesn't load the app (e.g. not installed)
        let appOpened = false;

        const fallbackTimer = setTimeout(() => {
            if (!appOpened) {
                console.log('[Redirector] App didn\'t open. Falling back to App Store download page.');
                window.location.href = universalLink;
            }
        }, 2500);

        const handleVisibilityChange = () => {
            if (document.hidden) {
                appOpened = true;
                clearTimeout(fallbackTimer);
            }
        };

        const handleBlur = () => {
            appOpened = true;
            clearTimeout(fallbackTimer);
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);

        return () => {
            clearTimeout(fallbackTimer);
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
        };
    }, [url]);

    return (
        <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-6" />
            <h2 className="text-2xl font-bold mb-3 tracking-tight">Connecting to Phantom</h2>
            <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
                Redirecting you to the Phantom mobile wallet app. Please wait...
            </p>
        </div>
    );
}

export default function RedirectPhantomPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-[#0B0E11] text-white p-4 font-sans text-center relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-6" />
                    <h2 className="text-2xl font-bold mb-3 tracking-tight">Preparing Connection...</h2>
                </div>
            }>
                <RedirectHandler />
            </Suspense>
        </main>
    );
}
