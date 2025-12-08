"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Activity, Zap, Layers, Moon } from "lucide-react";

type Phase = "Accumulation" | "Pressure" | "Deployment" | "Dormant";

const PHASES: Phase[] = ["Accumulation", "Pressure", "Deployment", "Dormant"];

const PHASE_CONFIG = {
    Accumulation: { color: "#EAB308", icon: Layers, desc: "Building positions" },
    Pressure: { color: "#EF4444", icon: Zap, desc: "High volatility detect" },
    Deployment: { color: "#3B82F6", icon: Activity, desc: "Executing strategy" },
    Dormant: { color: "#6B7280", icon: Moon, desc: "Awaiting triggers" },
};

export default function CycleMonitorPage() {
    const router = useRouter();
    const [currentPhase, setCurrentPhase] = useState<Phase>("Accumulation");
    const [alignment, setAlignment] = useState(87);
    const [vaultData, setVaultData] = useState<{ amount: string; chain: string } | null>(null);
    const [yieldBalance, setYieldBalance] = useState<number>(0);
    const [accumulating, setAccumulating] = useState(false);

    useEffect(() => {
        // Data Fetch
        const amount = localStorage.getItem("vaultAmount");
        const chain = localStorage.getItem("vaultChain");

        if (!amount) {
            router.push("/vault-deposit");
            return;
        }
        setVaultData({ amount, chain: chain || "Solana" });
        setYieldBalance(parseFloat(amount));

        // Phase Cycling Logic
        const phaseInterval = setInterval(() => {
            setCurrentPhase((prev) => {
                const idx = PHASES.indexOf(prev);
                return PHASES[(idx + 1) % PHASES.length];
            });
        }, 5000);

        // Alignment Simulation
        const alignInterval = setInterval(() => {
            setAlignment((prev) => Math.min(100, Math.max(80, prev + (Math.random() > 0.5 ? 1 : -1))));
        }, 3000);

        // Yield Accumulation Logic
        const yieldInterval = setInterval(() => {
            // Only accumulate occasionally
            if (Math.random() > 0.3) {
                const increment = (Math.random() * 0.05) + 0.01; // Random small increment
                setYieldBalance(prev => prev + increment);
                setAccumulating(true);
                setTimeout(() => setAccumulating(false), 800);
            }
        }, 2500);

        return () => {
            clearInterval(phaseInterval);
            clearInterval(alignInterval);
            clearInterval(yieldInterval);
        };
    }, [router]);

    if (!vaultData) return null;

    const CurrentIcon = PHASE_CONFIG[currentPhase].icon;
    const currentColor = PHASE_CONFIG[currentPhase].color;

    return (
        <main className="flex min-h-screen flex-col items-center bg-[#0B0E11] text-white p-4 overflow-hidden relative">
            {/* Background ambient glow based on phase */}
            <motion.div
                animate={{ backgroundColor: currentColor }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px] opacity-10 pointer-events-none transition-colors duration-1000"
            />

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="z-10 w-full max-w-lg flex flex-col items-center text-center mt-8 md:mt-16"
            >
                {/* Header */}
                <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">Cycle Monitor</h1>
                <p className="text-gray-400 text-sm font-light mb-12">
                    Your vault is actively following the mirrored earning behaviour.
                </p>

                {/* Phase Ring */}
                <div className="relative w-64 h-64 mb-12 flex items-center justify-center">
                    {/* Ring Segments */}
                    <div className="absolute inset-0 rounded-full border border-gray-800" />

                    {/* Active Phase Pulse */}
                    <motion.div
                        key={currentPhase}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.2, opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 rounded-full border-4 border-t-transparent border-l-transparent"
                        style={{ borderColor: currentColor, opacity: 0.6 }}
                    />
                    <div className={`absolute inset-0 rounded-full border-2 border-transparent border-t-[${currentColor}] border-r-[${currentColor}] animate-spin-slow opacity-30`} />

                    {/* Center Content */}
                    <div className="flex flex-col items-center gap-2 z-10">
                        <motion.div
                            key={currentPhase + "icon"}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="p-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10"
                        >
                            <CurrentIcon className="w-8 h-8" style={{ color: currentColor }} />
                        </motion.div>
                        <div className="flex flex-col items-center">
                            <span className="text-xs uppercase tracking-widest text-gray-500 font-medium">Phase</span>
                            <motion.span
                                key={currentPhase + "text"}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xl font-bold"
                                style={{ color: currentColor }}
                            >
                                {currentPhase}
                            </motion.span>
                        </div>
                    </div>

                    {/* Rotating Glow Effect */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute w-full h-full rounded-full shadow-[0_0_40px_rgba(255,255,255,0.05)] pointer-events-none"
                    />
                </div>

                {/* Sync Status */}
                <div className="flex flex-col items-center gap-2 mb-10">
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-medium text-gray-300">Syncing to whale pattern...</span>
                    </div>
                    <p className="text-sm text-gray-400 font-mono">Alignment: <span className="text-[#06D6A0]">{alignment}%</span></p>
                </div>

                {/* Behaviour Stream Timeline (Sparkline) */}
                <div className="w-full mb-10 relative h-16 overflow-hidden rounded-lg bg-white/[0.02] border border-white/5 flex items-center px-4">
                    <div className="absolute inset-0 flex items-center justify-around opacity-30">
                        {/* Mock data points */}
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 10 + Math.random() * 20 }}
                                animate={{ height: [10, 30, 15, 40, 10] }}
                                transition={{ duration: 2 + Math.random(), repeat: Infinity }}
                                className="w-1 rounded-full relative"
                                style={{
                                    backgroundColor: i % 4 === 0 ? "#EAB308" : i % 3 === 0 ? "#EF4444" : "#3B82F6",
                                    height: `${Math.random() * 60}%`
                                }}
                            >
                                {/* Subtle yield indicators on sparks */}
                                {i % 5 === 0 && (
                                    <motion.div
                                        className="absolute -top-2 left-1/2 w-1 h-1 bg-green-400 rounded-full"
                                        animate={{ opacity: [0, 1, 0], y: -5 }}
                                        transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 2 }}
                                    />
                                )}
                            </motion.div>
                        ))}
                    </div>
                    <p className="absolute bottom-1 left-2 text-[10px] text-gray-600 font-mono">LIVE FEED - 24H</p>
                </div>

                {/* Vault Summary Card */}
                <div className="w-full rounded-xl border border-white/5 bg-white/[0.03] p-6 mb-8 backdrop-blur-sm relative overflow-hidden transition-colors duration-500 hover:bg-white/[0.05]">
                    <div className="grid grid-cols-2 gap-y-4 text-left relative z-10">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Vault Balance</p>
                            <div className="flex items-center gap-2">
                                <p className="text-lg font-medium text-white tracking-wide">
                                    ${yieldBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <AnimatePresence>
                                    {accumulating && (
                                        <motion.span
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="text-[10px] text-[#06D6A0] font-bold"
                                        >
                                            +
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1 font-light italic">
                                Yield accumulating based on mirrored behaviour...
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 mb-1">Chain</p>
                            <p className="text-lg font-medium text-white">{vaultData.chain}</p>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-white/5 mt-1">
                            <p className="text-xs text-gray-500 mb-1">Mirroring Strategy</p>
                            <p className="text-sm font-medium text-white/90 flex items-center gap-2">
                                Selected Wallet Pattern
                                <Activity className="w-3 h-3 text-[#06D6A0]" />
                            </p>
                        </div>
                    </div>

                    {/* Subtle background flash on yield update */}
                    <AnimatePresence>
                        {accumulating && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-[#06D6A0] pointer-events-none"
                            />
                        )}
                    </AnimatePresence>
                </div>

                {/* Main CTA - Placeholder for future details */}
                <button disabled className="w-full group opacity-50 cursor-not-allowed">
                    <motion.div
                        className="w-full rounded-xl bg-[#06D6A0] py-4 text-black font-bold text-center flex items-center justify-center gap-2"
                    >
                        <span>Detailed Vault Dashboard (Coming Soon)</span>
                    </motion.div>
                </button>
            </motion.div>
        </main>
    );
}
