"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useWalletContext } from "@/context/WalletContext";

// Augment Window with BTC wallet providers
declare global {
  interface Window {
    BitcoinProvider?: {
      requestAccounts: () => Promise<string[]>;
      getNetwork?: () => Promise<string | { name?: string; [k: string]: unknown }>;
      network?: string | { name?: string };
    };
    xverseProviders?: {
      bitcoin?: {
        requestAccounts: () => Promise<string[]>;
        getNetwork?: () => Promise<string | { name?: string }>;
        network?: string | { name?: string };
      };
    };
    xverse?: {
      bitcoin?: {
        requestAccounts: () => Promise<string[]>;
        getNetwork?: () => Promise<string | { name?: string }>;
        network?: string | { name?: string };
      };
    };
    unisat?: {
      requestAccounts: () => Promise<string[]>;
      getNetwork?: () => Promise<string>;
      network?: string;
      request?: (args: { method: string; params?: unknown[] }) => Promise<any>;
      on?: (event: "accountsChanged" | "networkChanged", handler: (data: any) => void) => void;
      removeListener?: (event: "accountsChanged" | "networkChanged", handler: (data: any) => void) => void;
    };
    btc?: {
      request: (method: string, params?: unknown) => Promise<any>;
      getNetwork?: () => Promise<string>;
      network?: string;
    };
  }
}

type WalletKey = "xverse" | "unisat" | "leather";

export default function BitcoinWalletConnect() {
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<WalletKey | null>(null);
  const { setWalletAddress, closeModal } = useWalletContext();

  const showToast = useCallback((msg: string) => {
    setError(msg);
    // auto clear after short delay
    setTimeout(() => setError(null), 2500);
  }, []);

  const isSecureContext = () => {
    if (typeof window === "undefined") return false;
    const loc = window.location;
    return loc.protocol === "https:" || loc.hostname === "localhost" || loc.hostname === "127.0.0.1";
  };

  async function waitFor<T>(fn: () => T | undefined, tries = 10, delayMs = 100): Promise<T | undefined> {
    for (let i = 0; i < tries; i++) {
      const val = fn();
      if (val) return val;
      await new Promise((r) => setTimeout(r, delayMs));
    }
    return undefined;
  }

  const handleConnect = useCallback(async (wallet: WalletKey) => {
    try {
      setLoading(wallet);
      setError(null);
      let accounts: string[] | undefined;
      let detectedNetwork: string | null = null;

      if (wallet === "xverse") {
        const provider = typeof window !== "undefined"
          ? (window.BitcoinProvider || window.xverseProviders?.bitcoin || window.xverse?.bitcoin)
          : undefined;
        const resolved = provider || (await waitFor(() => (window as any)?.BitcoinProvider || (window as any)?.xverseProviders?.bitcoin || (window as any)?.xverse?.bitcoin));
        if (!isSecureContext()) {
          return showToast("Bitcoin extensions require https or localhost.");
        }
        if (!resolved) return showToast("Please open your Xverse extension.");
        accounts = await resolved.requestAccounts();
        if (resolved.getNetwork) {
          const n = await resolved.getNetwork();
          detectedNetwork = typeof n === "string" ? n : (n?.name ?? null);
        } else if (resolved.network) {
          detectedNetwork = typeof resolved.network === "string" ? resolved.network : (resolved.network.name ?? null);
        }
      }

      if (wallet === "unisat") {
        const provider = typeof window !== "undefined" ? window.unisat : undefined;
        const resolved = provider || (await waitFor(() => (window as any)?.unisat));
        if (!isSecureContext()) {
          return showToast("Bitcoin extensions require https or localhost.");
        }
        if (!resolved) return showToast("Please open your Unisat extension.");
        try {
          accounts = await resolved.requestAccounts();
        } catch (e) {
          // Some builds expose a generic request API
          if (resolved.request) {
            const resp = await resolved.request({ method: "requestAccounts" });
            accounts = Array.isArray(resp) ? resp : resp?.result;
          } else throw e;
        }
        if (resolved.getNetwork) {
          try { detectedNetwork = await resolved.getNetwork(); } catch { /* ignore */ }
        } else if (resolved.network) {
          detectedNetwork = resolved.network;
        }

        // Subscribe to account/network changes to keep global state in sync
        const onAccountsChanged = (accs: string[] | { addresses?: string[] }) => {
          const next = Array.isArray(accs) ? accs[0] : accs?.addresses?.[0];
          setAddress(next || null);
          setWalletAddress(next || null, "bitcoin", "Unisat");
        };
        const onNetworkChanged = (n: any) => {
          setNetwork(typeof n === "string" ? n : n?.name ?? String(n ?? ""));
        };
        resolved.on?.("accountsChanged", onAccountsChanged);
        resolved.on?.("networkChanged", onNetworkChanged);
      }

      if (wallet === "leather") {
        const provider = typeof window !== "undefined" ? window.btc : undefined;
        const resolved = provider || (await waitFor(() => (window as any)?.btc));
        if (!isSecureContext()) {
          return showToast("Bitcoin extensions require https or localhost.");
        }
        if (!resolved) return showToast("Please open your Leather extension.");
        const resp = await resolved.request("getAccounts");
        if (Array.isArray(resp)) {
          accounts = resp as string[];
        } else if (resp && Array.isArray(resp?.result)) {
          accounts = resp.result as string[];
        } else if (resp && resp?.addresses && Array.isArray(resp.addresses)) {
          accounts = resp.addresses as string[];
        }
        try {
          const net = resolved.getNetwork ? await resolved.getNetwork() : resolved.network;
          detectedNetwork = typeof net === "string" ? net : (net ?? null);
        } catch { /* ignore */ }
      }

      const addr = accounts?.[0] ?? null;
      if (!addr) throw new Error("No account returned");

      setAddress(addr);
      setNetwork(detectedNetwork);
      // Update global context so header button shows the BTC address
      const label: Record<WalletKey, string> = { xverse: "Xverse", unisat: "Unisat", leather: "Leather" };
      setWalletAddress(addr, "bitcoin", label[wallet]);
      closeModal();
      // eslint-disable-next-line no-console
      console.log(`[BTC] Connected ${wallet}:`, addr, detectedNetwork ? `(${detectedNetwork})` : "");
    } catch (e: any) {
      showToast(e?.message ?? "Failed to connect");
    } finally {
      setLoading(null);
    }
  }, [showToast]);

  const items = useMemo(
    () => [
      { key: "xverse" as WalletKey, label: "Xverse" },
      { key: "unisat" as WalletKey, label: "Unisat" },
      { key: "leather" as WalletKey, label: "Leather" },
    ],
    []
  );

  // Lightweight real-time sync on window focus for providers that don't emit events
  useEffect(() => {
    const onFocus = async () => {
      try {
        if (!isSecureContext()) return;
        // Unisat first (has the most consistent API)
        const uni = (window as any)?.unisat;
        if (uni?.requestAccounts) {
          try {
            const accs = await uni.requestAccounts();
            const next = Array.isArray(accs) ? accs[0] : undefined;
            if (next && next !== address) {
              setAddress(next);
              setWalletAddress(next, "bitcoin", "Unisat");
              return;
            }
          } catch {}
        }
        // Leather fallback
        const btc = (window as any)?.btc;
        if (btc?.request) {
          try {
            const resp = await btc.request("getAccounts");
            const next = Array.isArray(resp) ? resp[0] : (Array.isArray(resp?.result) ? resp.result[0] : resp?.addresses?.[0]);
            if (next && next !== address) {
              setAddress(next);
              setWalletAddress(next, "bitcoin", "Leather");
              return;
            }
          } catch {}
        }
        // Xverse fallback
        const xv = (window as any)?.BitcoinProvider || (window as any)?.xverseProviders?.bitcoin || (window as any)?.xverse?.bitcoin;
        if (xv?.requestAccounts) {
          try {
            const accs = await xv.requestAccounts();
            const next = Array.isArray(accs) ? accs[0] : undefined;
            if (next && next !== address) {
              setAddress(next);
              setWalletAddress(next, "bitcoin", "Xverse");
              return;
            }
          } catch {}
        }
      } catch {}
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [address, setWalletAddress]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => handleConnect(item.key)}
            className={`w-full rounded-xl border border-neutral-800 px-4 py-3 text-sm text-white bg-neutral-900 hover:bg-neutral-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed`}
            disabled={loading !== null}
          >
            {loading === item.key ? "Connecting…" : item.label}
          </button>
        ))}
      </div>

      {address && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-sm text-white">
          <div className="font-medium">Connected BTC Address</div>
          <div className="mt-1 break-all text-neutral-200">{address}</div>
          {network && (
            <div className="mt-2 text-neutral-400">Network: {network}</div>
          )}
        </div>
      )}

      {/* Minimal self-contained toast */}
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-[#1f1f1f] text-white text-sm px-4 py-2 rounded-lg border border-neutral-800 shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}
