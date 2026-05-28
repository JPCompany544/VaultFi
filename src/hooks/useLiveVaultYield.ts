"use client";

import { useEffect, useMemo, useState } from "react";
import { useDepositContext } from "@/context/DepositContext";
import { getVaultBySlug } from "@/config/vaults";

export type LiveYieldItem = {
  id: string;
  wallet: string;
  vaultName: string | null;
  amount: number; // base USD amount
  createdAt: string;
  txHash: string | null;
  apy?: number;
  currentValue: number; // base * multiplier
  rewards: number; // currentValue - base
  multiplier: number;
};

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

export function useLiveVaultYield() {
  const { confirmedDeposits } = useDepositContext();
  const [live, setLive] = useState<LiveYieldItem[]>([]);

  const baseItems = useMemo(() => {
    return (confirmedDeposits || []).map((d) => {
      const isSolis = d.vaultName === "Solis Yield Vault";
      const base = isSolis && typeof d.usdAmount === "number" ? d.usdAmount : d.amount;
      
      // Look up APY from config based on vault name
      let apy = 8.1;
      if (d.vaultName) {
        const matchingVault = getVaultBySlug(d.vaultName.toLowerCase().replace(/\s+/g, "-"));
        if (matchingVault) {
          apy = matchingVault.apyNumeric;
        }
      }

      return {
        id: d.id,
        wallet: d.wallet,
        vaultName: d.vaultName ?? null,
        amount: Number(base || 0),
        createdAt: d.createdAt,
        txHash: d.txHash ?? null,
        apy,
      };
    });
  }, [confirmedDeposits]);

  // Compute continuous compounding values every second
  useEffect(() => {
    const compute = () => {
      const now = Date.now();
      const next = baseItems.map((b) => {
        const start = new Date(b.createdAt).getTime() || now;
        const elapsed = Math.max(0, now - start);
        
        // Continuous compounding formula: A = P * e^(r * t)
        const apyFraction = b.apy / 100;
        const multiplier = Math.exp((apyFraction * elapsed) / MS_PER_YEAR);
        const currentValue = b.amount * multiplier;
        const rewards = currentValue - b.amount;

        return {
          ...b,
          currentValue,
          rewards,
          multiplier,
        } as LiveYieldItem;
      });
      setLive(next);
    };

    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, [baseItems]);

  return live;
}

