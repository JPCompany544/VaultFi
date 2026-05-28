"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { useWalletContext } from "@/context/WalletContext";

export type DepositStatus = "pending" | "confirmed" | "failed";

export type Deposit = {
  id: string;
  wallet: string;
  vaultName: string | null;
  amount: number; // in SOL
  usdAmount?: number; // in USD
  txHash: string | null;
  status: DepositStatus;
  createdAt: string;
};

export type VaultPosition = {
  id: string;
  walletAddress: string;
  vaultName: string;
  principalUsd: number; // in USD
  rewardsUsd: number; // in USD
  totalValueUsd: number; // in USD
  updatedAt: string;
};

export type Withdrawal = {
  id: string;
  walletAddress: string;
  vaultName: string;
  amountUsd: number; // in USD
  destinationWallet: string;
  status: string;
  createdAt: string;
  processedAt?: string;
};

export type DepositContextValue = {
  deposits: Deposit[];
  confirmedDeposits: Deposit[];
  positions: VaultPosition[];
  withdrawals: Withdrawal[];
  loading: boolean;
  error: string | null;
  totals: {
    totalAssets: number;
    totalBalance: number;
    vaultCount: number;
    uniqueVaults: string[];
  };
  refreshDeposits: () => Promise<void>;
};

const DepositContext = createContext<DepositContextValue | undefined>(undefined);

const normalizeDeposit = (row: any): Deposit | null => {
  if (!row) return null;
  const vaultName = row.vaultName || row.vault_name || "";
  const rawAmountSol = row.amountSol || row.amount_sol;
  const amountSol = rawAmountSol ? Number(rawAmountSol) / 1e9 : 0;
  const rawAmountUsd = row.amountUsd || row.amount_usd;
  const amountUsd = rawAmountUsd ? Number(rawAmountUsd) / 100 : 0;

  return {
    id: row.id,
    wallet: row.walletAddress || row.wallet_address,
    vaultName,
    amount: amountSol,
    usdAmount: amountUsd,
    txHash: row.txHash || row.tx_hash || null,
    status: row.status as DepositStatus,
    createdAt: row.createdAt || row.created_at || new Date().toISOString(),
  };
};

const normalizePosition = (row: any): VaultPosition => {
  const pUsd = row.principalUsd || row.principal_usd;
  const rUsd = row.rewardsUsd || row.rewards_usd;
  const tUsd = row.totalValueUsd || row.total_value_usd;
  return {
    id: row.id,
    walletAddress: row.walletAddress || row.wallet_address,
    vaultName: row.vaultName || row.vault_name,
    principalUsd: pUsd ? Number(pUsd) / 100 : 0,
    rewardsUsd: rUsd ? Number(rUsd) / 100 : 0,
    totalValueUsd: tUsd ? Number(tUsd) / 100 : 0,
    updatedAt: row.updatedAt || row.updated_at || new Date().toISOString(),
  };
};

const normalizeWithdrawal = (row: any): Withdrawal => {
  const aUsd = row.amountUsd || row.amount_usd;
  return {
    id: row.id,
    walletAddress: row.walletAddress || row.wallet_address,
    vaultName: row.vaultName || row.vault_name,
    amountUsd: aUsd ? Number(aUsd) / 100 : 0,
    destinationWallet: row.destinationWallet || row.destination_wallet,
    status: row.status,
    createdAt: row.createdAt || row.created_at || new Date().toISOString(),
    processedAt: row.processedAt || row.processed_at || undefined,
  };
};

export function DepositProviders({ children }: { children: React.ReactNode }) {
  const { wallet } = useWalletContext();
  const walletAddress = wallet.address;

  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [positions, setPositions] = useState<VaultPosition[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prevDepositsRef = useRef<Deposit[] | null>(null);

  const fetchWithTimeout = useCallback(async <T>(promise: Promise<T>, timeoutMs: number = 2500): Promise<T> => {
    let timeoutId: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("Database request timed out"));
      }, timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => {
      clearTimeout(timeoutId);
    });
  }, []);

  const fetchData = useCallback(async () => {
    if (!walletAddress) {
      setDeposits([]);
      setPositions([]);
      setWithdrawals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch all user portfolio data via server-side Prisma route (with cache busting)
      const timestamp = Date.now();
      const response = await fetchWithTimeout(fetch(`/api/portfolio?walletAddress=${walletAddress}&t=${timestamp}`));
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch portfolio");
      }
      
      const data = await response.json();

      console.log("DepositContext received API response:", data);

      const normalizedDeps = (data.deposits || [])
        .map(normalizeDeposit)
        .filter((item): item is Deposit => item !== null);
      
      const normalizedPositions = (data.positions || []).map(normalizePosition);
      const normalizedWithdrawals = (data.withdrawals || []).map(normalizeWithdrawal);

      console.log("DepositContext mapped positions:", normalizedPositions);
      console.log("DepositContext mapped withdrawals:", normalizedWithdrawals);

      setDeposits(normalizedDeps);
      setPositions(normalizedPositions);
      setWithdrawals(normalizedWithdrawals);

    } catch (err: any) {
      console.error("Supabase fetch failed:", err);
      setError(err?.message || "Failed to load database state");
    } finally {
      setLoading(false);
    }
  }, [walletAddress, fetchWithTimeout]);

  // Monitor confirmed deposits to trigger toast notifications
  useEffect(() => {
    const prev = prevDepositsRef.current || [];
    const prevByTx = new Map(prev.map((d) => [d.txHash || d.id, d]));

    const newlyConfirmed = deposits.filter((d) => {
      if (!d) return false;
      if (d.status !== "confirmed") return false;
      if (!(d.amount > 0)) return false;
      if (!d.txHash) return false;

      const existed = prevByTx.has(d.txHash) || prev.some((p) => p.id === d.id);
      return !existed;
    });

    for (const d of newlyConfirmed) {
      toast.success("Deposit confirmed!");
    }

    prevDepositsRef.current = deposits.map((d) => ({ ...d }));
  }, [deposits]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscription setup
  useEffect(() => {
    if (!walletAddress) return;

    let depositsChannel: any = null;
    let positionsChannel: any = null;
    let withdrawalsChannel: any = null;

    const setupRealtime = () => {
      // 1. Deposits Realtime Channel
      depositsChannel = supabase
        .channel(`deposits-realtime-${walletAddress}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "deposits",
            filter: `wallet_address=eq.${walletAddress}`,
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            const next = normalizeDeposit(payload.new);
            const previous = normalizeDeposit(payload.old);

            setDeposits((current) => {
              if (payload.eventType === "DELETE" && previous) {
                return current.filter((item) => item.id !== previous.id);
              }
              if (!next) return current;
              const others = current.filter((item) => item.id !== next.id);
              return [next, ...others];
            });
          }
        )
        .subscribe();

      // 2. Positions Realtime Channel
      positionsChannel = supabase
        .channel(`positions-realtime-${walletAddress}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "vault_positions",
            filter: `wallet_address=eq.${walletAddress}`,
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            const next = normalizePosition(payload.new);
            const previous = normalizePosition(payload.old);

            setPositions((current) => {
              if (payload.eventType === "DELETE" && previous) {
                return current.filter((item) => item.id !== previous.id);
              }
              if (!next) return current;
              const others = current.filter((item) => item.id !== next.id);
              return [next, ...others];
            });
          }
        )
        .subscribe();

      // 3. Withdrawals Realtime Channel
      withdrawalsChannel = supabase
        .channel(`withdrawals-realtime-${walletAddress}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "withdrawals",
            filter: `wallet_address=eq.${walletAddress}`,
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            const next = normalizeWithdrawal(payload.new);
            const previous = normalizeWithdrawal(payload.old);

            setWithdrawals((current) => {
              if (payload.eventType === "DELETE" && previous) {
                return current.filter((item) => item.id !== previous.id);
              }
              if (!next) return current;
              const others = current.filter((item) => item.id !== next.id);
              return [next, ...others];
            });
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (depositsChannel) supabase.removeChannel(depositsChannel);
      if (positionsChannel) supabase.removeChannel(positionsChannel);
      if (withdrawalsChannel) supabase.removeChannel(withdrawalsChannel);
    };
  }, [walletAddress]);

  const confirmedDeposits = useMemo(
    () => deposits.filter((deposit) => deposit.status === "confirmed"),
    [deposits]
  );

  const totals = useMemo(() => {
    let totalAssets = 0;
    let totalBalance = 0;
    const uniqueVaultsSet = new Set<string>();

    positions.forEach((position) => {
      totalAssets += position.principalUsd;
      totalBalance += position.totalValueUsd;
      if (position.principalUsd > 0) {
        uniqueVaultsSet.add(position.vaultName);
      }
    });

    const uniqueVaults = Array.from(uniqueVaultsSet);

    return {
      totalAssets,
      totalBalance,
      vaultCount: uniqueVaults.length,
      uniqueVaults,
    };
  }, [positions]);

  const value: DepositContextValue = {
    deposits,
    confirmedDeposits,
    positions,
    withdrawals,
    loading,
    error,
    totals,
    refreshDeposits: fetchData,
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

