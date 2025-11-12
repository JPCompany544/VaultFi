"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useDepositContext } from "@/context/DepositContext";

export type LiveYieldItem = {
  id: string;
  wallet: string;
  vaultName: string | null;
  amount: number; // base USD amount saved in DB
  createdAt: string;
  txHash: string | null;
  apy?: number;
  claimable_rewards?: number;
  // computed live fields
  currentValue: number; // base * multiplier
  rewards: number; // currentValue - base
  multiplier: number; // 1.0 .. 1.9
  progress: number; // 0..1 over 10 mins
};

export function useLiveVaultYield() {
  const { confirmedDeposits } = useDepositContext();
  const [live, setLive] = useState<LiveYieldItem[]>([]);
  const updatedAtCapRef = useRef<Set<string>>(new Set());

  const baseItems = useMemo(() => {
    return (confirmedDeposits || []).map((d) => ({
      id: d.id,
      wallet: d.wallet,
      vaultName: d.vaultName ?? null,
      amount: Number(d.amount || 0),
      createdAt: d.createdAt,
      txHash: d.txHash ?? null,
      apy: d.apy,
      claimable_rewards: d.claimable_rewards,
    }));
  }, [confirmedDeposits]);

  // compute live values every second
  useEffect(() => {
    const DURATION = 600_000; // 10 minutes in ms

    const compute = () => {
      const now = Date.now();
      const next = baseItems.map((b) => {
        const start = new Date(b.createdAt).getTime() || now;
        const elapsed = Math.max(0, now - start);
        const progress = Math.min(elapsed / DURATION, 1);
        const multiplier = 1 + 0.9 * progress; // 1.0 -> 1.9
        const currentValue = b.amount * multiplier;
        const rewards = currentValue - b.amount;
        return {
          ...b,
          currentValue,
          rewards,
          multiplier,
          progress,
        } as LiveYieldItem;
      });
      setLive(next);
    };

    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, [baseItems]);

  // Optional sync of claimable_rewards when cap reached
  useEffect(() => {
    const run = async () => {
      for (const item of live) {
        if (item.multiplier >= 1.9) {
          const rounded = Number(item.rewards.toFixed(2));
          const already = updatedAtCapRef.current.has(item.id);
          if (!already && (typeof item.claimable_rewards !== "number" || Number(item.claimable_rewards.toFixed ? item.claimable_rewards.toFixed(2) : item.claimable_rewards) !== rounded)) {
            try {
              const { error } = await supabase
                .from("deposits")
                .update({ claimable_rewards: rounded })
                .eq("id", item.id);
              if (!error) {
                updatedAtCapRef.current.add(item.id);
              }
            } catch {}
          }
        }
      }
    };
    run();
  }, [live]);

  return live;
}
