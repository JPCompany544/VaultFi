"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChainType, shortenAddress } from "@/utils/wallets";

export type WalletInfo = {
  address: string | null;
  chainType: ChainType;
  label: string | null;
  network?: string | null;
};

export type WalletContextValue = {
  wallet: WalletInfo;
  openModal: () => void;
  closeModal: () => void;
  setWalletAddress: (addr: string | null, chain: ChainType, label: string | null) => void;
  connectPhantom: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  isModalOpen: boolean;
  network: string | null;
  connectionStatus: "disconnected" | "connecting" | "connected" | "error";
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);
const queryClient = new QueryClient();

export function WalletProviders({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<WalletInfo>({ address: null, chainType: null, label: null });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [network, setNetwork] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected");

  const setWalletAddress = useCallback((addr: string | null, chain: ChainType, label: string | null) => {
    setWallet({ address: addr, chainType: chain, label });
  }, []);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  // Solana connect via Phantom
  const connectPhantom = useCallback(async () => {
    try {
      const anyWindow = window as any;
      const provider = anyWindow?.solana;
      if (!provider?.isPhantom) {
        window.open("https://phantom.app/", "_blank");
        return;
      }
      if (wallet?.address && wallet.chainType !== "solana") {
        const proceed = window.confirm("Replace current wallet with Phantom (Solana)?");
        if (!proceed) return;
      }
      setConnectionStatus("connecting");
      const resp = await provider.connect();
      const address: string = resp?.publicKey?.toString();
      if (address) {
        setWalletAddress(address, "solana", "Phantom");
        setNetwork("solana-mainnet");
        setConnectionStatus("connected");
        try {
          localStorage.setItem("vaultfi_wallet_connected", "true");
          localStorage.setItem("vaultfi_wallet_address", address);
          localStorage.setItem("vaultfi_wallet_chain", "solana");
          localStorage.setItem("vaultfi_wallet_label", "Phantom");
          localStorage.setItem("vaultfi_wallet_network", "solana-mainnet");
        } catch {}
        setIsModalOpen(false);
      } else {
        setConnectionStatus("error");
      }
    } catch {
      setConnectionStatus("error");
    }
  }, [setWalletAddress, wallet?.address]);

  // Phantom events and auto-reconnect
  useEffect(() => {
    const anyWindow = window as any;
    const provider = anyWindow?.solana;
    const onDisconnect = () => {
      try {
        localStorage.removeItem("vaultfi_wallet_connected");
        localStorage.removeItem("vaultfi_wallet_address");
        localStorage.removeItem("vaultfi_wallet_chain");
        localStorage.removeItem("vaultfi_wallet_label");
        localStorage.removeItem("vaultfi_wallet_network");
      } catch {}
      setConnectionStatus("disconnected");
      setNetwork(null);
      setWalletAddress(null, null, null);
    };
    const onAccountChanged = (pubkey: any) => {
      if (pubkey) {
        const addr = typeof pubkey?.toString === "function" ? pubkey.toString() : String(pubkey);
        setWalletAddress(addr, "solana", "Phantom");
        setNetwork("solana-mainnet");
        try { localStorage.setItem("vaultfi_wallet_address", addr); } catch {}
      } else {
        onDisconnect();
      }
    };
    const onConnect = () => setConnectionStatus("connected");
    try {
      provider?.on?.("disconnect", onDisconnect);
      provider?.on?.("accountChanged", onAccountChanged);
      provider?.on?.("connect", onConnect);
    } catch {}

    // Auto reconnect using Phantom trusted connection
    try {
      const persistedChain = typeof window !== 'undefined' ? localStorage.getItem("vaultfi_wallet_chain") : null;
      if (provider?.isPhantom && persistedChain === "solana") {
        setConnectionStatus("connecting");
        provider.connect({ onlyIfTrusted: true } as any)
          .then((resp: any) => {
            const addr = resp?.publicKey?.toString();
            if (addr) {
              setWalletAddress(addr, "solana", "Phantom");
              setNetwork("solana-mainnet");
              setConnectionStatus("connected");
            } else {
              setConnectionStatus("disconnected");
            }
          })
          .catch(() => setConnectionStatus("disconnected"));
      }
    } catch {}

    return () => {
      try {
        provider?.removeListener?.("disconnect", onDisconnect);
        provider?.removeListener?.("accountChanged", onAccountChanged);
        provider?.removeListener?.("connect", onConnect);
      } catch {}
    };
  }, [setWalletAddress]);

  // Unified disconnect across chains
  const disconnectWallet = useCallback(async () => {
    try { await phantomDisconnectSafe(); } catch {}
    try {
      localStorage.removeItem("vaultfi_wallet_connected");
      localStorage.removeItem("vaultfi_wallet_address");
      localStorage.removeItem("vaultfi_wallet_chain");
      localStorage.removeItem("vaultfi_wallet_label");
      localStorage.removeItem("vaultfi_wallet_network");
    } catch {}
    setNetwork(null);
    setConnectionStatus("disconnected");
    setWalletAddress(null, null, null);
  }, [setWalletAddress]);

  const ctx: WalletContextValue = useMemo(
    () => ({ wallet: { ...wallet, network }, openModal, closeModal, setWalletAddress, connectPhantom, disconnectWallet, isModalOpen, network, connectionStatus }),
    [wallet, network, openModal, closeModal, setWalletAddress, connectPhantom, disconnectWallet, isModalOpen, connectionStatus]
  );

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint="https://mainnet.helius-rpc.com/?api-key=8bc606d5-f7bf-4ec7-bb68-2e4411d7ca33">
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <QueryClientProvider client={queryClient}>
          <WalletContext.Provider value={ctx}>
            {children}
          </WalletContext.Provider>
        </QueryClientProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}

export function useWalletContext() {
  const v = useContext(WalletContext);
  if (!v) throw new Error("WalletContext not ready");
  return v;
}

export function useShortAddress() {
  const { wallet } = useWalletContext();
  return shortenAddress(wallet.address || undefined);
}

// Unified disconnect implementation
async function phantomDisconnectSafe() {
  try {
    const anyWindow = window as any;
    const provider = anyWindow?.solana;
    if (provider?.isPhantom && provider.disconnect) {
      await provider.disconnect();
    }
  } catch {}
}

// removed dummy placeholder; implemented within WalletProviders
