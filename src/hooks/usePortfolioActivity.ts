"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
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
  const { confirmedDeposits } = useDepositContext();
  const [activeDeposits, setActiveDeposits] = useState<ActivityRecord[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setPendingWithdrawals([]);
      if (!walletAddress) {
        setLoading(false);
        return;
      }
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from("withdrawals")
        .select("id,wallet,vault_name,amount,status,created_at")
        .eq("wallet", walletAddress)
        .order("created_at", { ascending: false });

      if (withdrawalsError) throw withdrawalsError;

      setPendingWithdrawals((withdrawalsData as ActivityRecord[]) || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load portfolio activity");
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    // Keep withdrawals in sync with backend
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // Map confirmed deposits from DepositContext into ActivityRecord[]
    // Only include positive-amount deposits so synthetic negative rows used for
    // withdrawal syncing do not appear in the Activity UI.
    const mapped: ActivityRecord[] = (confirmedDeposits || [])
      .filter((d) => d.amount > 0)
      .map((d) => {
        const isSolis = d.vaultName === "Solis Yield Vault";
        const amountBase = isSolis && typeof d.usdAmount === "number" ? d.usdAmount : d.amount;
        return {
          id: d.id,
          wallet: d.wallet,
          vault_name: d.vaultName,
          amount: amountBase,
          usdAmount: isSolis && typeof d.usdAmount === "number" ? d.usdAmount : undefined,
          status: d.status,
          created_at: d.createdAt,
        };
      });
    setActiveDeposits(mapped);
  }, [confirmedDeposits]);

  return useMemo(
    () => ({ activeDeposits, pendingWithdrawals, loading, error, refetch: fetchData }),
    [activeDeposits, pendingWithdrawals, loading, error, fetchData]
  );
}
