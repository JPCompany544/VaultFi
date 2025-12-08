"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function VaultActivatedPage() {
    const router = useRouter();
    const [amount, setAmount] = useState<string | null>(null);
    const [chain, setChain] = useState<string | null>(null);

    useEffect(() => {
        // Fetch data
        const storedAmount = localStorage.getItem("vaultAmount");
        const storedChain = localStorage.getItem("vaultChain");

        if (!storedAmount) {
            router.push("/vault-deposit");
            return;
        }

        setAmount(storedAmount);
        setChain(storedChain);
    }, [router]);

    if (!amount) return null; // or a simple full-screen loader

    // Format amount with commas
    const formattedAmount = Number(amount).toLocaleString();

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-[#0B0E11] text-white p-4 overflow-hidden relative">
            {/* Background ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Main Container */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="z-10 flex flex-col items-center text-center max-w-lg w-full"
            >
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white drop-shadow-sm">
                    Vault Activated
                </h1>

                <p className="text-gray-400 text-sm md:text-base font-light mb-10 max-w-sm mx-auto">
                    Your vault is now syncing with the mirrored earning behaviour.
                </p>

                {/* Behaviour Sync Animation */}
                <div className="flex flex-col items-center justify-center w-full mb-10">
                    <div className="relative w-64 h-1">
                        <div className="absolute inset-0 bg-gray-800 rounded-full opacity-30" />
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-[#06D6A0] to-[#0EA5E9] rounded-full blur-[1px]"
                            animate={{ opacity: [0.4, 0.8, 0.4], scaleX: [0.95, 1.05, 0.95] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </div>
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-[10px] uppercase tracking-widest text-[#06D6A0] mt-3 font-medium"
                    >
                        Establishing behaviour route...
                    </motion.span>
                </div>

                {/* Vault Summary Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="w-full max-w-sm rounded-xl border border-white/5 bg-white/[0.03] p-6 mb-8 backdrop-blur-sm"
                >
                    <div className="grid grid-cols-2 gap-y-6 text-left">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Vault Balance</p>
                            <p className="text-xl font-medium text-white">${formattedAmount}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Chain</p>
                            <p className="text-xl font-medium text-white">{chain}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-xs text-gray-500 mb-1">Mirroring</p>
                            <p className="text-sm font-medium text-white/90">Selected Wallet Pattern</p>
                        </div>
                    </div>
                </motion.div>

                {/* CTA Button */}
                <Link href="/behaviour-route" className="w-full max-w-sm group">
                    <motion.div
                        whileHover={{ scale: 1.01, boxShadow: "0 0 20px rgba(6, 214, 160, 0.2)" }}
                        className="w-full rounded-xl bg-[#06D6A0] py-4 text-black font-bold text-center transition-all flex items-center justify-center gap-2"
                    >
                        <span>View Behaviour Route</span>
                        <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                    </motion.div>
                </Link>

                {/* Secondary Link */}
                <Link href="/cycle-monitor" className="mt-5 text-xs text-gray-500 hover:text-gray-300 transition-colors">
                    Return to Dashboard
                </Link>
            </motion.div>
        </main>
    );
}
