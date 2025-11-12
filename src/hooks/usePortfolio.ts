"use client";

import { useEffect, useMemo, useState } from "react";
import { useWalletContext } from "@/context/WalletContext";

export type PortfolioData = {
  totalUsd: number;
  vaultCount: number;
};

export default function usePortfolio() {
  const { wallet } = useWalletContext();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PortfolioData | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      if (!wallet.address) {
        setData(null);
        return;
      }
      setLoading(true);
      // Mocked fetch: replace with API integration later
      await new Promise((r) => setTimeout(r, 400));
      if (mounted) {
        setData({ totalUsd: 25320, vaultCount: 6 });
        setLoading(false);
      }
    }
    fetchData();
    return () => {
      mounted = false;
    };
  }, [wallet.address]);

  return useMemo(() => ({ loading, data }), [loading, data]);
}
