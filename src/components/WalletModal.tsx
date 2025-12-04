"use client";

import { useWalletContext } from "@/context/WalletContext";
import { X } from "lucide-react";
import toast from "react-hot-toast";

// Utility functions for Phantom deep-link
const openInPhantom = () => {
  if (typeof window === "undefined") return;

  const currentUrl = window.location.href;

  // Double-encode
  const encodedOnce = encodeURIComponent(currentUrl);
  const encodedTwice = encodeURIComponent(encodedOnce);

  // Phantom deep-link
  const phantomUrl = `https://phantom.app/ul/browse/${encodedTwice}`;

  // Redirect
  window.location.href = phantomUrl;
};

const isPhantomInAppBrowser = () => {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes("phantom");
};

const isIOS = () => {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
};

export default function WalletModal() {
  const { isModalOpen, closeModal, connectPhantom } = useWalletContext();
  const anyWindow = typeof window !== 'undefined' ? (window as any) : undefined;

  if (!isModalOpen) return null;

  const phantomInstalled = !!anyWindow?.solana?.isPhantom;

  const handlePhantomConnect = async () => {
  // If already inside Phantom browser → normal connect flow
  if (isPhantomInAppBrowser()) {
    return connectPhantom(); // your existing connect function
  }

  // If on iOS Safari or Chrome → force phantom deep-link
  if (isIOS()) {
    toast("Opening in Phantom…");
    return openInPhantom();
  }

  // Android or Desktop → normal connect
  return connectPhantom();
};

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
                onClick={handlePhantomConnect}
                className={`w-full rounded-xl border border-neutral-800 text-white px-4 py-3 text-sm ${phantomInstalled ? 'bg-neutral-900 hover:bg-neutral-800' : 'bg-neutral-950 hover:bg-neutral-900'}`}
              >
                Phantom (Solana){phantomInstalled ? '' : ' — Install'}
              </button>
            </div>
            
            {!isPhantomInAppBrowser() && (
              <button
                onClick={openInPhantom}
                className="w-full mt-3 bg-purple-600 text-white rounded-xl py-3 font-medium"
              >
                Open in Phantom Browser
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
