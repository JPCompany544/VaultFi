"use client";

import { useEffect, useMemo, useState } from "react";
import { useDepositContext } from "@/context/DepositContext";

export function useVaultAvailableUSD(walletAddress: string | null, vaultName: string | null) {
  const { confirmedDeposits, pendingWithdrawalAmount } = useDepositContext();
  const [baseAvailableUSD, setBaseAvailableUSD] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    function run() {
      try {
        setError(null);
        if (!walletAddress || !vaultName) {
          if (!cancelled) {
            setBaseAvailableUSD(0);
            setLoading(false);
          }
          return;
        }

        const confirmedForVault = confirmedDeposits.filter(
          (d) => d.wallet === walletAddress && d.vaultName === vaultName
        );

        const totalCents = confirmedForVault.reduce((sum: number, row: any) => {
          const isSolis = row?.vaultName === "Solis Yield Vault";
          const base = isSolis && typeof row?.usdAmount === "number" ? row.usdAmount : row?.amount;
          const amt = Number(base || 0);
          const rew = Number(row?.claimable_rewards || 0);
          const amtCents = Math.round((Number.isFinite(amt) ? amt : 0) * 100);
          const rewCents = Math.round((Number.isFinite(rew) ? rew : 0) * 100);
          return sum + amtCents + rewCents;
        }, 0);

        const pendingCents = Math.round(
          (Number.isFinite(pendingWithdrawalAmount) ? pendingWithdrawalAmount : 0) * 100
        );
        const availableCents = Math.max(0, totalCents - pendingCents);
        const availableDollars = availableCents / 100;

        if (!cancelled) {
          setBaseAvailableUSD(availableDollars);
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
  }, [walletAddress, vaultName, confirmedDeposits, pendingWithdrawalAmount]);

  // Calculate available USD with optimistic withdrawal deduction
  const availableUSD = useMemo(() => {
    const value = Number.isFinite(baseAvailableUSD) ? baseAvailableUSD : 0;
    return Math.max(0, value);
  }, [baseAvailableUSD]);

  return useMemo(() => ({ availableUSD, loading, error }), [availableUSD, loading, error]);
}
