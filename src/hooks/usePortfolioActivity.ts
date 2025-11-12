"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

export type ActivityRecord = {
  id: string;
  wallet: string;
  vault_name: string | null;
  amount: number;
  status: string;
  created_at: string;
};

export function usePortfolioActivity(walletAddress: string | null) {
  const [activeDeposits, setActiveDeposits] = useState<ActivityRecord[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setActiveDeposits([]);
      setPendingWithdrawals([]);
      if (!walletAddress) {
        setLoading(false);
        return;
      }
      const [depositsRes, withdrawalsRes] = await Promise.all([
        supabase
          .from("deposits")
          .select("id,wallet,vault_name,amount,status,created_at")
          .eq("wallet", walletAddress)
          .eq("status", "confirmed")
          .order("created_at", { ascending: false }),
        supabase
          .from("withdrawals")
          .select("id,wallet,vault_name,amount,status,created_at")
          .eq("wallet", walletAddress)
          .order("created_at", { ascending: false }),
      ]);

      if (depositsRes.error) throw depositsRes.error;
      if (withdrawalsRes.error) throw withdrawalsRes.error;

      setActiveDeposits((depositsRes.data as ActivityRecord[]) || []);
      setPendingWithdrawals((withdrawalsRes.data as ActivityRecord[]) || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load portfolio activity");
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return useMemo(
    () => ({ activeDeposits, pendingWithdrawals, loading, error, refetch: fetchData }),
    [activeDeposits, pendingWithdrawals, loading, error, fetchData]
  );
}
