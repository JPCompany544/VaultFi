"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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
  usdAmount?: number;
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
  pendingWithdrawalAmount: number;
};

const DepositContext = createContext<DepositContextValue | undefined>(undefined);

const toCents = (value: number): number => {
  const numeric = Number.isFinite(value) ? value : 0;
  return Math.round(numeric * 100);
};

const fromCents = (cents: number): number => cents / 100;

const normalizeDeposit = (row: any): Deposit | null => {
  if (!row) return null;
  const vaultName: string | null = row.vault_name ?? null;
  const baseAmount = Number(row.amount ?? 0);
  const amountUsd = row.amount_usd !== undefined && row.amount_usd !== null ? Number(row.amount_usd) : undefined;
  const useUsd = vaultName === "Solis Yield Vault" && Number.isFinite(amountUsd as number);

  return {
    id: row.id,
    wallet: row.wallet,
    vaultName,
    amount: baseAmount,
    usdAmount: useUsd ? (amountUsd as number) : undefined,
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
  const [pendingWithdrawalCents, setPendingWithdrawalCents] = useState(0);
  const toastedDeposits = useRef<Set<string>>(
    new Set(
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("toastedDeposits") || "[]")
        : []
    )
  );

  const saveToasted = () => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      "toastedDeposits",
      JSON.stringify(Array.from(toastedDeposits.current))
    );
  };

  const prevDepositsRef = useRef<Deposit[] | null>(null);

  const debugToastDecision = (reason: string, data?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[DepositToastDebug]", reason, data);
    }
  };

  async function handleConfirmedWithdrawal(next: any) {
    const isSolis = next.vault_name === "Solis Yield Vault";
    const baseAmount = Number(isSolis ? next.amount_usd ?? next.amount ?? 0 : next.amount ?? 0);
    if (!Number.isFinite(baseAmount) || baseAmount <= 0) return;

    const marker = `withdrawal:${next.id}`;

    // Idempotency check
    const { data: existing } = await supabase
      .from("deposits")
      .select("id")
      .eq("tx_hash", marker)
      .limit(1);

    if (existing && existing.length > 0) return;

    await supabase.from("deposits").insert({
      wallet: next.wallet,
      vault_name: next.vault_name,
      amount: -baseAmount,
      tx_hash: marker,
      status: "confirmed",
      created_at: new Date().toISOString(),
    });

    toast.success("Withdrawal confirmed — balance updated.");
  }

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
      .select("id, wallet, vault_name, amount, amount_usd, tx_hash, status, apy, claimable_rewards, created_at")
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
    const prev = prevDepositsRef.current || [];
    const prevByTx = new Map(prev.map((d) => [d.txHash || d.id, d]));

    const newlyConfirmed = deposits.filter((d) => {
      if (!d) return false;
      if (d.status !== "confirmed") return false;
      if (!(d.amount > 0)) return false;
      if (!d.txHash) return false;

      if (toastedDeposits.current.has(d.txHash)) {
        debugToastDecision("skip: already toasted", d.txHash);
        return false;
      }

      const existed = prevByTx.has(d.txHash) || prev.some((p) => p.id === d.id);
      if (existed) {
        debugToastDecision("skip: existed in prev state", d.txHash);
        return false;
      }

      return true;
    });

    for (const d of newlyConfirmed) {
      toastedDeposits.current.add(d.txHash!);
      saveToasted();
      toast.success("Deposit confirmed!");
      debugToastDecision("TOASTED", d.txHash);
    }

    prevDepositsRef.current = deposits.map((d) => ({ ...d }));
  }, [deposits]);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  useEffect(() => {
    if (!walletAddress) {
      return;
    }

    let channel: any = null;

    const setup = async () => {
      // Seed toastedDeposits with already-confirmed positive deposits so we
      // never re-play confirmation toasts on refresh or remount.
      const { data, error } = await supabase
        .from("deposits")
        .select("tx_hash, amount")
        .eq("wallet", walletAddress)
        .eq("status", "confirmed");

      if (error) {
        console.error("Failed to seed toasted deposits", error);
      } else {
        data?.forEach((d: any) => {
          const amount = Number(d.amount ?? 0);
          if (amount > 0 && d.tx_hash) {
            toastedDeposits.current.add(d.tx_hash);
          }
        });
      }

      channel = supabase
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

            setDeposits((current) => {
              // Handle deletes first and early-return
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
    };

    void setup();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase, walletAddress]);

  useEffect(() => {
    if (!walletAddress) {
      return;
    }

    console.log("DepositContext mounted — subscribing to withdrawals channel");

    const channel = supabase
      .channel("withdrawals")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "withdrawals",
        },
        async (payload) => {
          console.log("WITHDRAWAL EVENT FIRED", payload);

          const next = payload.new;
          const previous = payload.old;

          if (!next || !previous) return;

          // Only process events for this wallet
          if (next.wallet !== walletAddress) return;

          // Only run on first transition to confirmed
          if (previous.status !== "confirmed" && next.status === "confirmed") {
            await handleConfirmedWithdrawal(next);
          }
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
      const payload: any = {
        wallet,
        vault_name: vaultName,
        amount,
        tx_hash: txHash,
        status: "pending",
        apy,
        claimable_rewards,
      };

      const { data, error: insertError } = await supabase
        .from("deposits")
        .insert(payload)
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
    const totalAssetsCents = confirmedDeposits.reduce((sum, deposit) => {
      const isSolis = deposit.vaultName === "Solis Yield Vault";
      const amtBase = isSolis && typeof deposit.usdAmount === "number" ? deposit.usdAmount : deposit.amount;
      const amt = Number(amtBase || 0);
      return sum + toCents(amt);
    }, 0);

    const totalRewardsCents = confirmedDeposits.reduce((sum, deposit) => {
      const rew = Number(deposit.claimable_rewards || 0);
      return sum + toCents(rew);
    }, 0);

    const totalBalanceCents = Math.max(0, totalAssetsCents + totalRewardsCents - pendingWithdrawalCents);

    const uniqueVaults = Array.from(
      new Set(confirmedDeposits.map((deposit) => deposit.vaultName).filter(Boolean))
    ) as string[];

    return {
      totalAssets: fromCents(totalAssetsCents),
      totalBalance: fromCents(totalBalanceCents),
      vaultCount: uniqueVaults.length,
      uniqueVaults,
    };
  }, [confirmedDeposits, pendingWithdrawalCents]);

  const recordWithdrawal = useCallback((amount: number) => {
    const cents = toCents(amount);
    setPendingWithdrawalCents((prev) => prev + cents);
  }, []);

  const pendingWithdrawalAmount = useMemo(
    () => fromCents(pendingWithdrawalCents),
    [pendingWithdrawalCents]
  );

  const value: DepositContextValue = {
    deposits,
    confirmedDeposits,
    loading,
    error,
    totals,
    insertDeposit,
    refreshDeposits: fetchDeposits,
    recordWithdrawal,
    pendingWithdrawalAmount,
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
