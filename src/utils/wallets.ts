export type ChainType = "solana" | null;

export const shortenAddress = (addr?: string | null) => {
  if (!addr) return "";
  if (addr.length > 10) return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  return addr;
};

export const WALLET_GROUPS = {
  solana: ["Phantom"],
};
