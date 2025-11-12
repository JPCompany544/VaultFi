"use client";

import { useWalletContext } from "@/context/WalletContext";
import { X } from "lucide-react";

export default function WalletModal() {
  const { isModalOpen, closeModal, connectPhantom } = useWalletContext();
  const anyWindow = typeof window !== 'undefined' ? (window as any) : undefined;

  if (!isModalOpen) return null;

  const phantomInstalled = !!anyWindow?.solana?.isPhantom;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={closeModal} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-[#121212] border border-neutral-800 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <h3 className="text-white font-semibold">Connect Wallet</h3>
          <button onClick={closeModal} className="text-neutral-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div>
            <p className="text-sm text-neutral-400 mb-3">Solana</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={async () => { await connectPhantom(); }}
                className={`w-full rounded-xl border border-neutral-800 text-white px-4 py-3 text-sm ${phantomInstalled ? 'bg-neutral-900 hover:bg-neutral-800' : 'bg-neutral-950 hover:bg-neutral-900'}`}
              >
                Phantom (Solana){phantomInstalled ? '' : ' — Install'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
