"use client";

import { useEffect, useMemo, useState } from "react";
import { useDepositContext } from "@/context/DepositContext";

export function useVaultAvailableUSD(walletAddress: string | null, vaultName: string | null) {
  const { positions, withdrawals, loading: contextLoading } = useDepositContext();
  const [availableUSD, setAvailableUSD] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    function run() {
      try {
        setError(null);
        setLoading(true);
        if (!walletAddress || !vaultName) {
          if (!cancelled) {
            setAvailableUSD(0);
            setLoading(false);
          }
          return;
        }

        // Find position for this vault
        const position = positions.find(
          (p) => p.walletAddress === walletAddress && p.vaultName === vaultName
        );

        // Find pending withdrawals for this vault
        const pendingWithdrawals = withdrawals.filter(
          (w) => w.walletAddress === walletAddress && w.vaultName === vaultName && w.status === "pending"
        );

        // Compute using integer cents to prevent floating point trust
        const totalCents = position ? Math.round(position.totalValueUsd * 100) : 0;
        const pendingCents = pendingWithdrawals.reduce((sum, w) => sum + Math.round(w.amountUsd * 100), 0);
        
        const availableCents = Math.max(0, totalCents - pendingCents);
        const availableDollars = availableCents / 100;

        if (!cancelled) {
          setAvailableUSD(availableDollars);
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to load available balance");
          setLoading(false);
        }
      }
    }
    run();
    return () => { cancelled = true; };
  }, [walletAddress, vaultName, positions, withdrawals]);

  const isLoading = contextLoading || loading;

  return useMemo(() => ({ availableUSD, loading: isLoading, error }), [availableUSD, isLoading, error]);
}

