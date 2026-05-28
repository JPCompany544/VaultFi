"use client";

import { useCallback, useState } from "react";
import { useDepositContext } from "@/context/DepositContext";

export type SubmitWithdrawalInput = {
  wallet: string;
  vaultName: string;
  usdAmount: number; // already converted and rounded to 2 decimals
};

export function useWithdrawal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshDeposits } = useDepositContext();

  const submit = useCallback(async ({ wallet, vaultName, usdAmount }: SubmitWithdrawalInput) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_address: wallet,
          vault_name: vaultName,
          amount_usd: usdAmount,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to submit withdrawal request");
      }

      await refreshDeposits();
      return { ok: true } as const;
    } catch (e: any) {
      console.error("Withdrawal submission failed:", e);
      setError(e.message || "Failed to submit withdrawal request");
      return { ok: false } as const;
    } finally {
      setLoading(false);
    }
  }, [refreshDeposits]);

  return { submit, loading, error };
}

