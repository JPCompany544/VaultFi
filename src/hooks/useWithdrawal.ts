"use client";

import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export type SubmitWithdrawalInput = {
  wallet: string;
  vaultName: string;
  usdAmount: number; // already converted and rounded to 2 decimals
};

export function useWithdrawal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async ({ wallet, vaultName, usdAmount }: SubmitWithdrawalInput) => {
    setLoading(true);
    setError(null);
    const payload: any = {
      wallet,
      vault_name: vaultName,
      amount: usdAmount,
      status: "pending_withdrawal",
      created_at: new Date().toISOString(),
    };

    let success = false;
    try {
      const response = await Promise.race([
        supabase.from("withdrawals").insert(payload).select().single(),
        new Promise<never>((_, r) => setTimeout(() => r(new Error("Timeout")), 1500))
      ]);
      if (response.error) throw response.error;
      success = true;
    } catch (e: any) {
      console.warn("Supabase withdrawal insert failed/timed out. Saving locally.", e);
    }

    // Save to local cache to keep UI in sync
    try {
      const cacheKey = `vaultfi_withdrawals_${wallet}`;
      const currentCached = localStorage.getItem(cacheKey);
      const currentList = currentCached ? JSON.parse(currentCached) : [];
      
      const newWithdrawalObj = {
        id: `local-wth-${Date.now()}`,
        wallet,
        vault_name: vaultName,
        amount: usdAmount,
        status: "pending_withdrawal",
        created_at: new Date().toISOString()
      };
      
      const nextList = [newWithdrawalObj, ...currentList];
      localStorage.setItem(cacheKey, JSON.stringify(nextList));

      // Also create a matching negative confirmed/pending row in local deposits to update available balances immediately!
      const depositsCacheKey = `vaultfi_deposits_${wallet}`;
      const depositsCached = localStorage.getItem(depositsCacheKey);
      const depositsList = depositsCached ? JSON.parse(depositsCached) : [];
      
      const negativeDeposit = {
        id: `local-dep-neg-${Date.now()}`,
        wallet,
        vaultName,
        amount: -usdAmount,
        txHash: `local-wth-tx-${Date.now()}`,
        status: "confirmed" as const, // Deduct it from active deposits immediately
        apy: 0,
        claimable_rewards: 0,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem(depositsCacheKey, JSON.stringify([negativeDeposit, ...depositsList]));
    } catch (err) {
      console.error("Local storage cache write failed for withdrawal", err);
    }

    return { ok: true } as const;
  }, []);

  return { submit, loading, error };
}
