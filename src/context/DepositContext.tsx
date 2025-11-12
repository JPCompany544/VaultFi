"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { useWalletContext } from "@/context/WalletContext";

export type DepositStatus = "pending" | "confirmed" | "pending_withdrawal";

export type Deposit = {
  id: string;
  wallet: string;
  vaultName: string | null;
  amount: number;
  txHash: string | null;
  status: DepositStatus;
  apy?: number;
  claimable_rewards?: number;
  createdAt: string;
};

export type InsertDepositInput = {
  wallet: string;
  vaultName: string;
  amount: number;
  txHash: string;
  apy?: number;
  claimable_rewards?: number;
};

export type DepositContextValue = {
  deposits: Deposit[];
  confirmedDeposits: Deposit[];
  loading: boolean;
  error: string | null;
  totals: {
    totalAssets: number;
    totalBalance: number;
    vaultCount: number;
    uniqueVaults: string[];
  };
  insertDeposit: (input: InsertDepositInput) => Promise<{ data?: Deposit; error?: string }>;
  refreshDeposits: () => Promise<void>;
  recordWithdrawal: (amount: number) => void;
};

const DepositContext = createContext<DepositContextValue | undefined>(undefined);

const normalizeDeposit = (row: any): Deposit | null => {
  if (!row) return null;
  return {
    id: row.id,
    wallet: row.wallet,
    vaultName: row.vault_name ?? null,
    amount: Number(row.amount ?? 0),
    txHash: row.tx_hash ?? null,
    status: row.status as DepositStatus,
    apy: row.apy ? Number(row.apy) : undefined,
    claimable_rewards: row.claimable_rewards ? Number(row.claimable_rewards) : undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
};

export function DepositProviders({ children }: { children: React.ReactNode }) {
  const { wallet } = useWalletContext();
  const walletAddress = wallet.address;

  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingWithdrawalAmount, setPendingWithdrawalAmount] = useState(0);

  const fetchDeposits = useCallback(async () => {
    if (!walletAddress) {
      setDeposits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("deposits")
      .select("id, wallet, vault_name, amount, tx_hash, status, apy, claimable_rewards, created_at")
      .eq("wallet", walletAddress)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Failed to load deposits", fetchError);
      setError("Unable to load deposits");
      setDeposits([]);
      setLoading(false);
      return;
    }

    const normalized = (data || [])
      .map(normalizeDeposit)
      .filter((item): item is Deposit => item !== null);

    setDeposits(normalized);
    setLoading(false);
  }, [supabase, walletAddress]);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  useEffect(() => {
    if (!walletAddress) {
      return;
    }

    const channel = supabase
      .channel(`deposits-${walletAddress}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deposits",
          filter: `wallet=eq.${walletAddress}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          const next = normalizeDeposit(payload.new);
          const previous = normalizeDeposit(payload.old);

          if (next && next.status === "confirmed") {
            toast.success("✅ Deposit confirmed!");
          }

          setDeposits((current) => {
            if (payload.eventType === "DELETE" && previous) {
              return current.filter((item) => item.id !== previous.id);
            }

            if (!next) {
              return current;
            }

            const others = current.filter((item) => item.id !== next.id);
            return [next, ...others];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, walletAddress]);

  const insertDeposit = useCallback(
    async (input: InsertDepositInput) => {
      const { wallet, vaultName, amount, txHash, apy, claimable_rewards } = input;
      const { data, error: insertError } = await supabase
        .from("deposits")
        .insert({
          wallet,
          vault_name: vaultName,
          amount,
          tx_hash: txHash,
          status: "pending",
          apy,
          claimable_rewards,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Failed to insert deposit", insertError);
        return { error: insertError.message };
      }

      const normalized = normalizeDeposit(data);
      if (!normalized) {
        return { error: "Invalid deposit response" };
      }

      setDeposits((current) => {
        const others = current.filter((item) => item.id !== normalized.id);
        return [normalized, ...others];
      });

      return { data: normalized };
    },
    [supabase]
  );

  const confirmedDeposits = useMemo(
    () => deposits.filter((deposit) => deposit.status === "confirmed"),
    [deposits]
  );

  const totals = useMemo(() => {
    const totalAssets = confirmedDeposits.reduce((sum, deposit) => sum + deposit.amount, 0);
    const totalRewards = confirmedDeposits.reduce((sum, deposit) => sum + (deposit.claimable_rewards || 0), 0);
    const totalBalance = Math.max(0, totalAssets + totalRewards - pendingWithdrawalAmount);
    const uniqueVaults = Array.from(new Set(confirmedDeposits.map((deposit) => deposit.vaultName).filter(Boolean))) as string[];
    return {
      totalAssets,
      totalBalance,
      vaultCount: uniqueVaults.length,
      uniqueVaults,
    };
  }, [confirmedDeposits, pendingWithdrawalAmount]);

  const recordWithdrawal = useCallback((amount: number) => {
    setPendingWithdrawalAmount((prev) => prev + amount);
  }, []);

  const value: DepositContextValue = {
    deposits,
    confirmedDeposits,
    loading,
    error,
    totals,
    insertDeposit,
    refreshDeposits: fetchDeposits,
    recordWithdrawal,
  };

  return (
    <DepositContext.Provider value={value}>
      {children}
    </DepositContext.Provider>
  );
}

export function useDepositContext() {
  const value = useContext(DepositContext);
  if (!value) {
    throw new Error("DepositContext not available");
  }
  return value;
}
