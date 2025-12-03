"use client";

import { useWalletContext } from "@/context/WalletContext";
import { X } from "lucide-react";

// Phantom deep-link utilities for iOS mobile
function isPhantomBrowser(): boolean {
  return typeof window !== 'undefined' && (window as any).solana?.isPhantom === true;
}

function isIOS(): boolean {
  return typeof window !== 'undefined' && 
    (/iPad|iPhone|iPod/.test(navigator.userAgent) || 
     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
}

function connectWithPhantomDeepLink(): void {
  if (isPhantomBrowser()) {
    // Already in Phantom browser, proceed with normal connect
    return;
  }
  
  if (isIOS()) {
    // iOS + Non-Phantom browser: deep-link to Phantom
    const currentUrl = window.location.href;
    const phantomDeepLink = `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}`;
    
    // Show opening message
    const toastMsg = document.createElement('div');
    toastMsg.textContent = "Opening inside Phantom…";
    toastMsg.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(124, 92, 252, 0.9);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 999999;
      font-family: system-ui, -apple-system, sans-serif;
    `;
    document.body.appendChild(toastMsg);
    
    // Redirect to Phantom deep-link
    window.location.href = phantomDeepLink;
    
    // Clean up message after delay
    setTimeout(() => {
      if (document.body.contains(toastMsg)) {
        document.body.removeChild(toastMsg);
      }
    }, 3000);
  }
}

export default function WalletModal() {
  const { isModalOpen, closeModal, connectPhantom } = useWalletContext();
  const anyWindow = typeof window !== 'undefined' ? (window as any) : undefined;

  if (!isModalOpen) return null;

  const phantomInstalled = !!anyWindow?.solana?.isPhantom;

  const handlePhantomConnect = async () => {
    if (isPhantomBrowser()) {
      // Already in Phantom browser - use normal connect
      await connectPhantom();
    } else if (isIOS()) {
      // iOS + Non-Phantom browser - use deep-link
      connectWithPhantomDeepLink();
      closeModal(); // Close modal after initiating deep-link
    } else {
      // Desktop/Android - use normal connect or show install
      await connectPhantom();
    }
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
