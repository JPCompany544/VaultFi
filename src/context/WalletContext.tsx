"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { http, createConfig, WagmiProvider, useAccount, useDisconnect } from "wagmi";
import { mainnet, bsc, polygon, arbitrum, avalanche, base, optimism } from "viem/chains";
import { EVM_WALLETCONNECT_PROJECT_ID, ChainType, shortenAddress } from "@/utils/wallets";
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { coinbaseWallet, injected, walletConnect } from "@wagmi/connectors";

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
  connectBraavos: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  registerWagmiDisconnect: (fn: (() => void) | null) => void;
  isModalOpen: boolean;
  network: string | null;
  connectionStatus: "disconnected" | "connecting" | "connected" | "error";
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

const wagmiConfig = createConfig({
  chains: [mainnet, bsc, polygon, arbitrum, avalanche, base, optimism],
  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [avalanche.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
  },
  connectors: [
    coinbaseWallet({ appName: "VaultFi" }),
    injected({ shimDisconnect: true }),
    walletConnect({ projectId: EVM_WALLETCONNECT_PROJECT_ID })
  ],
  ssr: true,
  autoConnect: true,
});

const queryClient = new QueryClient();

export function WalletProviders({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<WalletInfo>({ address: null, chainType: null, label: null });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wagmiDisconnectRef, setWagmiDisconnectRef] = useState<null | (() => void)>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected");

  const setWalletAddress = useCallback((addr: string | null, chain: ChainType, label: string | null) => {
    setWallet({ address: addr, chainType: chain, label });
  }, []);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const registerWagmiDisconnect = useCallback((fn: (() => void) | null) => {
    setWagmiDisconnectRef(() => fn || null);
  }, []);

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
    try { wagmiDisconnectRef?.(); } catch {}
    try { await phantomDisconnectSafe(); } catch {}
    try {
      const anyWindow = window as any;
      const braavos = anyWindow?.starknet_braavos || anyWindow?.braavos;
      if (braavos?.disconnect) await braavos.disconnect();
    } catch {}
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
  }, [wagmiDisconnectRef, setWalletAddress]);

  // StarkNet connect via Braavos
  const connectBraavos = useCallback(async () => {
    try {
      const anyWindow = window as any;
      const braavos = anyWindow?.starknet_braavos || anyWindow?.braavos;
      if (braavos) {
        await braavos.enable({ starknetVersion: "v4" });
        const accounts: string[] = braavos.selectedAddress ? [braavos.selectedAddress] : braavos.accounts || [];
        const address = accounts[0] || null;
        if (address) {
          setWalletAddress(address, "starknet", "Braavos");
          setIsModalOpen(false);
        }
      } else {
        window.open("https://braavos.app/", "_blank");
      }
    } catch {}
  }, [setWalletAddress]);

  const ctx: WalletContextValue = useMemo(
    () => ({ wallet: { ...wallet, network }, openModal, closeModal, setWalletAddress, connectPhantom, connectBraavos, disconnectWallet, registerWagmiDisconnect, isModalOpen, network, connectionStatus }),
    [wallet, network, openModal, closeModal, setWalletAddress, connectPhantom, connectBraavos, disconnectWallet, registerWagmiDisconnect, isModalOpen, connectionStatus]
  );

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint="https://rpc.ankr.com/solana">
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <QueryClientProvider client={queryClient}>
          <WalletContext.Provider value={ctx}>
            <WagmiProvider config={wagmiConfig}>
              <WagmiAccountSync onRegisterDisconnect={registerWagmiDisconnect} />
              {children}
            </WagmiProvider>
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

function WagmiAccountSync({ onRegisterDisconnect }: { onRegisterDisconnect: (fn: (() => void) | null) => void }) {
  const { address, status } = useAccount();
  const { /* setWalletAddress, closeModal */ } = useWalletContext();
  const { disconnect } = useDisconnect();
  useEffect(() => {
    onRegisterDisconnect(disconnect);
    return () => onRegisterDisconnect(null);
  }, [disconnect, onRegisterDisconnect]);
  // EVM syncing disabled to enforce Solana-only connection
  return null;
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
