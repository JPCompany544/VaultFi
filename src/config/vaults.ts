export interface VaultConfig {
  name: string;
  slug: string;
  provider: string;
  tvl: string;
  apy: string;
  apyNumeric: number;
  guardian: string;
  depositAssets: number;
  onAssets: number;
  depositLogos: string[];
  onLogos: string[];
  providedByLogo: string;
  mainLogo: string;
}

export const VAULTS: VaultConfig[] = [
  {
    name: "VaultFi Prime Vault",
    slug: "vaultfi-prime-vault",
    provider: "Veda",
    tvl: "$102,749,385",
    apy: "3.1%",
    apyNumeric: 3.1,
    guardian: "Solv Guard",
    depositAssets: 5,
    onAssets: 3,
    depositLogos: ["/vault-list-logos/USDT.png", "/vault-list-logos/USDC.png", "/vault-list-logos/ETH.png", "/vault-list-logos/SOL.svg", "/vault-list-logos/BNB.png"],
    onLogos: ["/vault-list-logos/ETH.png", "/vault-list-logos/SOL.svg", "/vault-list-logos/BNB.png"],
    providedByLogo: "/vault-list-logos/veda.svg",
    mainLogo: "/vault-list-logos/ETH.svg",
  },
  {
    name: "Bitcoin Apex Vault",
    slug: "bitcoin-apex-vault",
    provider: "Compound",
    tvl: "$89,234,567",
    apy: "4.2%",
    apyNumeric: 4.2,
    guardian: "OpenZeppelin",
    depositAssets: 4,
    onAssets: 2,
    depositLogos: ["/vault-list-logos/BTC.png"],
    onLogos: ["/vault-list-logos/BTC.png"],
    providedByLogo: "/vault-list-logos/Concrete.png",
    mainLogo: "/vault-list-logos/BTC.png",
  },
  {
    name: "BNB Orbit Vault",
    slug: "bnb-orbit-vault",
    provider: "Marinade",
    tvl: "$156,789,123",
    apy: "6.8%",
    apyNumeric: 6.8,
    guardian: "Solana Labs",
    depositAssets: 3,
    onAssets: 1,
    depositLogos: ["/vault-list-logos/BNB.png", "/vault-list-logos/USDT.png", "/vault-list-logos/ETH.png"],
    onLogos: ["/vault-list-logos/BNB.png"],
    providedByLogo: "/vault-list-logos/veda.svg",
    mainLogo: "/vault-list-logos/Binance.svg",
  },
  {
    name: "Bitcoin Bera Vault",
    slug: "bitcoin-bera-vault",
    provider: "Aave",
    tvl: "$67,891,234",
    apy: "5.5%",
    apyNumeric: 5.5,
    guardian: "Polygon Guard",
    depositAssets: 5,
    onAssets: 3,
    depositLogos: ["/vault-list-logos/wBTC.png", "/vault-list-logos/BERA.png", "/vault-list-logos/USDC.png"],
    onLogos: ["/vault-list-logos/BERA.png"],
    providedByLogo: "/vault-list-logos/Concrete.png",
    mainLogo: "/vault-list-logos/BERA.png",
  },
  {
    name: "Sentora DeFi Vault",
    slug: "sentora-defi-vault",
    provider: "Uniswap",
    tvl: "$234,567,890",
    apy: "7.2%",
    apyNumeric: 7.2,
    guardian: "Arbitrum DAO",
    depositAssets: 4,
    onAssets: 2,
    depositLogos: ["/vault-list-logos/USDT.png", "/vault-list-logos/USDC.png", "/vault-list-logos/DAI.png", "/vault-list-logos/ETH.png"],
    onLogos: ["/vault-list-logos/ETH.png", "/vault-list-logos/Arbitrum.png"],
    providedByLogo: "/vault-list-logos/veda.svg",
    mainLogo: "/vault-list-logos/DAI.svg",
  },
  {
    name: "Solis Yield Vault",
    slug: "solis-yield-vault",
    provider: "Trader Joe",
    tvl: "$123,456,789",
    apy: "8.1%",
    apyNumeric: 8.1,
    guardian: "Avalanche Foundation",
    depositAssets: 3,
    onAssets: 1,
    depositLogos: ["/vault-list-logos/SOL.svg", "/vault-list-logos/USDC.png", "/vault-list-logos/BONK.png", "/vault-list-logos/JUP.png"],
    onLogos: ["/vault-list-logos/SOL.svg"],
    providedByLogo: "/vault-list-logos/Concrete.png",
    mainLogo: "/vault-list-logos/SOL.svg",
  },
  {
    name: "Obsidian Reserve Vault",
    slug: "obsidian-reserve-vault",
    provider: "Coinbase",
    tvl: "$345,678,901",
    apy: "9.3%",
    apyNumeric: 9.3,
    guardian: "Base Security",
    depositAssets: 5,
    onAssets: 4,
    depositLogos: ["/vault-list-logos/ETH.png", "/vault-list-logos/wBTC.png", "/vault-list-logos/USDC.png", "/vault-list-logos/BNB.png", "/vault-list-logos/MATIC.png"],
    onLogos: ["/vault-list-logos/ETH.png", "/vault-list-logos/Polygon.png", "/vault-list-logos/BNB.png"],
    providedByLogo: "/vault-list-logos/veda.svg",
    mainLogo: "/vault-list-logos/wBTC.svg",
  },
];

export function getVaultBySlug(slug: string): VaultConfig | undefined {
  return VAULTS.find((vault) => vault.slug === slug);
}
