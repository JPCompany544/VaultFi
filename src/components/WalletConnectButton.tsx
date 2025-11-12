"use client";

import { Button } from "@/components/ui/button";
import { useWalletContext, useShortAddress } from "@/context/WalletContext";
import { useMemo, useState } from "react";

export default function WalletConnectButton({ className = "" }: { className?: string }) {
  const { wallet, openModal, disconnectWallet } = useWalletContext();
  const [open, setOpen] = useState(false);
  const short = useShortAddress();

  const explorerUrl = useMemo(() => {
    if (!wallet.address) return "#";
    if (wallet.chainType === 'solana') {
      return `https://explorer.solana.com/address/${wallet.address}`;
    }
    return "#";
  }, [wallet.address, wallet.chainType]);

  if (wallet.address) {
    return (
      <div className={`relative ${className}`}>
        <Button
          className={`bg-white/5 border border-white/10 text-white font-medium px-4 py-2 rounded-xl hover:bg-white/10`}
          onClick={() => setOpen((v) => !v)}
        >
          {short}
          {wallet.chainType === 'solana' && (
            <span className="ml-2 text-xs text-cyan-400">(Solana)</span>
          )}
        </Button>

        {open && (
          <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#121212] border border-neutral-800 shadow-xl z-50">
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-2 text-sm text-white hover:bg-neutral-800 rounded-t-xl"
              onClick={() => setOpen(false)}
            >
              View on Explorer
            </a>
            <button
              className="w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-neutral-800 rounded-b-xl"
              onClick={() => {
                setOpen(false);
                void disconnectWallet();
              }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Button
      className={`bg-gradient-to-r from-[#00FFD1] to-[#00BFA5] text-black font-semibold px-6 py-2 rounded-xl hover:from-[#00FFD1]/90 hover:to-[#00BFA5]/90 transition-all duration-200 shadow-lg ${className}`}
      onClick={openModal}
    >
      Connect Wallet
    </Button>
  );
}
