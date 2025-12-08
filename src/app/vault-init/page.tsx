"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

export default function VaultInitPage() {
    return (
        <React.Suspense fallback={<div className="min-h-screen bg-[#0B0E11]" />}>
            <VaultInitContent />
        </React.Suspense>
    );
}

function VaultInitContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Capture route param if exists
        const route = searchParams.get("route");
        if (route) {
            localStorage.setItem("vaultRoute", route);
        }

        // Redirect after 5 seconds
        const t = setTimeout(() => {
            router.push("/vault-create");
        }, 5000);

        return () => clearTimeout(t);
    }, [router, searchParams]);

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-[#0B0E11] text-white p-4 overflow-hidden relative">
            {/* Background ambient glow (optional for premium feel) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="z-10 flex flex-col items-center text-center max-w-lg w-full"
            >
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white drop-shadow-sm">
                    Your Vault Is Being Prepared
                </h1>

                <p className="text-gray-400 text-sm md:text-base font-light mb-12">
                    We’ve received your behaviour stream. Your personal vault is now being initialized.
                </p>

                {/* Micro-loading animation */}
                <div className="relative w-[200px] h-[2px]">
                    {/* Base line */}
                    <div className="absolute inset-0 bg-gray-800 rounded-full" />

                    {/* Animated pulse line */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-[#6EE7FF] to-[#A855F7] rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                        animate={{
                            opacity: [0.5, 1, 0.5],
                            scaleX: [0.8, 1, 0.8],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                </div>
            </motion.div>
        </main>
    );
}
