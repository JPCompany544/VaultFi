export const EVM_WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

export type ChainType = "evm" | "solana" | "starknet" | "bitcoin" | null;

export const shortenAddress = (addr?: string | null) => {
  if (!addr) return "";
  if (addr.length > 10) return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  return addr;
};

export const WALLET_GROUPS = {
  evm: [
    "MetaMask",
    "Binance",
    "Coinbase",
    "OKX",
    "Bitget",
    "Trust",
    "Uniswap",
    "OneKey",
    "Tabby",
    "Gate",
    "Ready",
    "Bybit",
  ],
  solana: ["Phantom"],
  starknet: ["Braavos"],
};
