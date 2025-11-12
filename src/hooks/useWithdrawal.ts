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
    try {
      const payload: any = {
        wallet,
        vault_name: vaultName,
        amount: usdAmount,
        status: "pending_withdrawal",
        created_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("withdrawals").insert(payload).select().single();
      if (error) throw error;
      return { ok: true } as const;
    } catch (e: any) {
      setError(e?.message || "Failed to submit withdrawal");
      return { ok: false, error: e?.message || "Failed to submit withdrawal" } as const;
    } finally {
      setLoading(false);
    }
  }, []);

  return { submit, loading, error };
}
