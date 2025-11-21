"use client";

import { useLiveVaultYield } from "@/hooks/useLiveVaultYield";

export default function VaultYieldDashboard() {
  const live = useLiveVaultYield();

  if (!live || live.length === 0) {
    return (
      <div className="bg-[#1A1A1A] rounded-xl md:rounded-2xl p-5 md:p-8 border border-neutral-800">
        <div className="text-sm text-neutral-400">No confirmed deposits yet.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {live.map((d) => (
        <div key={d.id} className="bg-[#1A1A1A] rounded-xl md:rounded-2xl p-4 md:p-5 border border-neutral-800">
          <div className="flex items-center justify-between">
            <div className="text-xs md:text-sm text-neutral-400">{d.vaultName || "Solis Yield Vault"}</div>
            <div className="text-xs md:text-sm text-neutral-500">{Math.round(d.progress * 100)}% of yield phase</div>
          </div>
          <div className="mt-2 text-white text-lg md:text-xl font-semibold">
            ${d.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-emerald-400 text-xs md:text-sm">
            +${d.rewards.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({(d.multiplier * 100).toFixed(1)}%)
          </div>
        </div>
      ))}
    </div>
  );
}
