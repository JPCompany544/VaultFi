"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Circle, Activity, RefreshCw, Repeat, Zap, Layers, Timer } from "lucide-react";

const TIMELINE_NODES = [
    {
        title: "Profit Timing",
        description: "Mirroring the wallet’s entry/exit rhythm based on historical profit cycles.",
        icon: Timer,
    },
    {
        title: "Accumulation Pattern",
        description: "Gradual position buildup mirrored from the source wallet’s timing window.",
        icon: Layers,
    },
    {
        title: "Liquidity Route",
        description: "Chain rotation behaviour across Solana → Base → Solana.",
        icon: RefreshCw,
    },
    {
        title: "Signature Move",
        description: "Repeating liquidity-timing action observed every 9–11 days.",
        icon: Zap,
    },
    {
        title: "Vault Cycle",
        description: "Profit harvest behaviour mirrored every ~30 days.",
        icon: Repeat,
    },
    {
        title: "Behaviour Loop",
        description: "High-value reinvestment loop executed after volatility resets.",
        icon: Activity,
    },
];

export default function BehaviourRoutePage() {
    return (
        <main className="flex min-h-screen flex-col items-center bg-[#0B0E11] text-white p-4 md:p-8 overflow-hidden relative">
            {/* Background ambient glow - Blue-ish for intelligence feel */}
            <div className="absolute top-0 center w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="z-10 w-full max-w-[900px] flex flex-col items-center"
            >
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-white">
                        Behaviour Route
                    </h1>
                    <p className="text-gray-400 text-sm md:text-base font-light">
                        This is the earning behaviour your vault is currently mirroring.
                    </p>
                </div>

                {/* Timeline Container */}
                <div className="relative w-full max-w-2xl pl-8 md:pl-0">

                    {/* Vertical Gradient Line */}
                    <div className="absolute left-0 md:left-1/2 top-4 bottom-12 w-[2px] bg-gradient-to-b from-[#06D6A0] to-[#0EA5E9] md:-translate-x-1/2 opacity-30 md:opacity-50">
                        {/* Animated flowing light along the line */}
                        <motion.div
                            className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-transparent via-white to-transparent opacity-50"
                            animate={{ top: ["10%", "90%"] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />
                    </div>

                    <div className="space-y-12">
                        {TIMELINE_NODES.map((node, index) => (
                            <motion.div
                                key={node.title}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.15 + 0.3 }}
                                className={`relative flex flex-col md:flex-row items-start md:items-center gap-6 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
                            >
                                {/* Desktop Spacer for alternating layout */}
                                <div className="hidden md:block flex-1" />

                                {/* Timeline Orb */}
                                <div className="absolute left-[-5px] md:left-1/2 md:-translate-x-1/2 w-4 h-4 rounded-full bg-[#0B0E11] border-2 border-[#06D6A0] shadow-[0_0_10px_rgba(6,214,160,0.5)] z-20">
                                    <div className="absolute inset-0 bg-[#06D6A0] rounded-full opacity-20 animate-ping" />
                                </div>

                                {/* Content Card */}
                                <div className={`flex-1 md:w-1/2 ${index % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                                    <h3 className="text-lg font-bold text-white mb-1 flex items-center md:items-start gap-2 justify-start md:justify-[inherit]">
                                        <span className="md:hidden">
                                            <node.icon className="w-4 h-4 text-[#06D6A0]" />
                                        </span>
                                        {node.title}
                                    </h3>
                                    <p className="text-gray-400 text-sm leading-relaxed font-light">
                                        {node.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Status Block */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.6 }}
                    className="mt-16 w-full max-w-md rounded-xl border border-white/5 bg-white/[0.03] p-5 backdrop-blur-sm text-center"
                >
                    <div className="flex flex-col items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">Route Sync Status</h3>
                        <p className="text-xs text-gray-500">
                            Your vault is following the extracted behaviour pattern.
                        </p>
                        <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-green-900/20 rounded-full border border-green-500/10">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Live</span>
                        </div>
                    </div>
                </motion.div>

                {/* CTA Button */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                    className="mt-8 mb-12 w-full flex justify-center"
                >
                    <Link href="/cycle-monitor" className="w-full max-w-sm group">
                        <motion.div
                            whileHover={{ scale: 1.01, boxShadow: "0 0 20px rgba(6, 214, 160, 0.2)" }}
                            className="w-full rounded-xl bg-[#06D6A0] py-4 text-black font-bold text-center transition-all flex items-center justify-center gap-2"
                        >
                            <span>Open Vault Dashboard</span>
                            <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                        </motion.div>
                    </Link>
                </motion.div>

            </motion.div>
        </main>
    );
}
