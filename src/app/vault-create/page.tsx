"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function VaultCreatePage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-[#0B0E11] text-white p-4 overflow-hidden relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="z-10 flex flex-col items-center text-center max-w-lg w-full"
            >
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white drop-shadow-sm">
                    Your Vault Is Ready
                </h1>

                <p className="text-gray-400 text-sm md:text-base font-light mb-12">
                    To begin mirroring the extracted earning behaviour, load your vault balance.
                </p>

                <Link href="/vault-deposit" className="w-full max-w-sm group">
                    <motion.div
                        whileHover={{ y: -2 }}
                        className="relative w-full overflow-hidden rounded-lg bg-white text-black font-semibold py-4 px-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        <span>Load Vault Balance</span>
                        <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </motion.div>
                </Link>

                <p className="mt-4 text-xs text-gray-600 font-medium">
                    Minimum: $0 — You control your vault’s behaviour strength.
                </p>
            </motion.div>
        </main>
    );
}
