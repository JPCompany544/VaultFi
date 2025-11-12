"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useDepositContext } from "@/context/DepositContext";

export function useVaultAvailableUSD(walletAddress: string | null, vaultName: string | null) {
  const { totals } = useDepositContext();
  const [baseAvailableUSD, setBaseAvailableUSD] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setLoading(true);
        setError(null);
        setBaseAvailableUSD(0);
        if (!walletAddress || !vaultName) {
          setLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from("deposits")
          .select("amount, claimable_rewards, status, vault_name")
          .eq("wallet", walletAddress)
          .eq("vault_name", vaultName)
          .eq("status", "confirmed");
        if (error) throw error;
        const total = (data || []).reduce((sum: number, row: any) => {
          const amt = Number(row?.amount || 0);
          const rew = Number(row?.claimable_rewards || 0);
          return sum + (Number.isFinite(amt) ? amt : 0) + (Number.isFinite(rew) ? rew : 0);
        }, 0);
        if (!cancelled) setBaseAvailableUSD(Number(total.toFixed(2)));
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load available balance");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [walletAddress, vaultName]);

  // Calculate available USD with optimistic withdrawal deduction
  const availableUSD = useMemo(() => {
    // If we have a vault-specific balance, use context's totalBalance for this vault
    // For simplicity, we'll use the totals.totalBalance which already accounts for pending withdrawals
    return Math.max(0, totals.totalBalance);
  }, [totals.totalBalance]);

  return useMemo(() => ({ availableUSD, loading, error }), [availableUSD, loading, error]);
}
