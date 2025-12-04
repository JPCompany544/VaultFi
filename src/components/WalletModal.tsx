"use client";

import { useWalletContext } from "@/context/WalletContext";
import { X } from "lucide-react";

// --- Phantom Deep-Link Helper ---
function openInPhantomBrowser() {
  if (typeof window === "undefined") return;

  // Explicit target page to open inside Phantom's in-app browser
  const targetUrl = "https://vault-fi-3y63.vercel.app/app/vaults/solis-yield-vault";
  const encodedUrl = encodeURIComponent(targetUrl); // single encode
  const encodedRef = encodeURIComponent(targetUrl);

  // Native scheme (preferred): open Phantom app + in-app browser on targetUrl
  const nativeLink = `phantom://ul/browse/${encodedUrl}?ref=${encodedRef}`;

  // HTTPS fallback: Phantom's documented browse deep link
  const httpsFallback = `https://phantom.app/ul/browse/${encodedUrl}?ref=${encodedRef}`;

  // Try native first
  window.location.href = nativeLink;

  // If native scheme is not handled (Phantom not installed / blocked),
  // stay in browser and fall back to HTTPS link.
  setTimeout(() => {
    if (document.visibilityState === "visible") {
      window.location.href = httpsFallback;
    }
  }, 800);
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isPhantomBrowser(): boolean {
  if (typeof window === "undefined") return false;
  return (window as any)?.phantom?.solana?.isPhantom === true;
}

export default function WalletModal() {
  const { isModalOpen, closeModal, connectPhantom } = useWalletContext();
  const anyWindow = typeof window !== 'undefined' ? (window as any) : undefined;

  if (!isModalOpen) return null;

  const phantomInstalled = !!anyWindow?.solana?.isPhantom;

  const handlePhantomConnect = () => {
    const insidePhantom = isPhantomBrowser();
    const onIOS = isIOS();

    // Step 1: On iOS & not in Phantom → open current page in Phantom in-app browser
    if (onIOS && !insidePhantom) {
      openInPhantomBrowser();
      return; // stop normal connect
    }

    // Step 2: Already inside Phantom → normal wallet adapter connect
    connectPhantom()
      .then(closeModal)
      // eslint-disable-next-line no-console
      .catch((e) => console.error("Phantom connect failed:", e));
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
          </div>
        </div>
      </div>
    </div>
  );
}
