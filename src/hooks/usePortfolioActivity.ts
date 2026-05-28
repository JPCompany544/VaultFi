"use client";

import { useMemo } from "react";
import { useDepositContext } from "@/context/DepositContext";

export type ActivityRecord = {
  id: string;
  wallet: string;
  vault_name: string | null;
  amount: number;
  usdAmount?: number;
  status: string;
  created_at: string;
};

export function usePortfolioActivity(walletAddress: string | null) {
  const { confirmedDeposits, withdrawals, loading, error, refreshDeposits } = useDepositContext();

  const activeDeposits = useMemo<ActivityRecord[]>(() => {
    if (!walletAddress) return [];
    return confirmedDeposits
      .filter((d) => d.wallet === walletAddress)
      .map((d) => ({
        id: d.id,
        wallet: d.wallet,
        vault_name: d.vaultName,
        amount: d.usdAmount ?? d.amount,
        usdAmount: d.usdAmount,
        status: d.status,
        created_at: d.createdAt,
      }));
  }, [confirmedDeposits, walletAddress]);

  const pendingWithdrawals = useMemo<ActivityRecord[]>(() => {
    if (!walletAddress) return [];
    return withdrawals
      .filter((w) => w.walletAddress === walletAddress && w.status === "pending")
      .map((w) => ({
        id: w.id,
        wallet: w.walletAddress,
        vault_name: w.vaultName,
        amount: w.amountUsd,
        usdAmount: w.amountUsd,
        status: "pending_withdrawal",
        created_at: w.createdAt,
      }));
  }, [withdrawals, walletAddress]);

  return useMemo(
    () => ({ activeDeposits, pendingWithdrawals, loading, error, refetch: refreshDeposits }),
    [activeDeposits, pendingWithdrawals, loading, error, refreshDeposits]
  );
}

