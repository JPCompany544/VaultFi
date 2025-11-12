"use client";

import React from "react";
import type { ActivityRecord } from "@/hooks/usePortfolioActivity";

type Props = {
  records: ActivityRecord[];
  variant: "deposits" | "withdrawals";
};

export default function PortfolioActivityTable({ records, variant }: Props) {
  const isEmpty = !records || records.length === 0;
  
  // Helper to get status color for withdrawals
  const getStatusColor = (status: string) => {
    if (variant === "deposits") return "border-emerald-500/40 text-emerald-300";
    // For withdrawals: green for confirmed, red for rejected, amber for pending
    if (status === "confirmed") return "border-emerald-500/40 text-emerald-300";
    if (status === "rejected") return "border-red-500/40 text-red-300";
    return "border-amber-500/40 text-amber-300"; // pending_withdrawal or other
  };
  
  return (
    <div className="w-full">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#141414]">
          <table className="min-w-full divide-y divide-neutral-800">
            <thead className="bg-[#171717]">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-300">Vault Name</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-300">Amount (USD)</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-300">Status</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-300">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {isEmpty ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-neutral-400 text-sm">No records found.</td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-[#181818] transition-colors">
                    <td className="px-4 py-3 text-sm text-white">{r.vault_name || "—"}</td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${variant === "deposits" ? "text-emerald-400" : "text-amber-400"}`}>
                      {formatUSD(r.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                        getStatusColor(r.status)
                      }`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-neutral-300">{formatDate(r.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {isEmpty ? (
          <div className="rounded-xl border border-neutral-800 bg-[#141414] p-4 text-center text-neutral-400 text-sm">No records found.</div>
        ) : (
          records.map((r) => (
            <div key={r.id} className="rounded-xl border border-neutral-800 bg-[#141414] p-4">
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-white text-sm font-medium">{r.vault_name || "—"}</div>
                <div className={`text-sm font-semibold ${variant === "deposits" ? "text-emerald-400" : "text-amber-400"}`}>{formatUSD(r.amount)}</div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 border ${
                  getStatusColor(r.status)
                }`}>{r.status}</span>
                <span className="text-neutral-300">{formatDate(r.created_at)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function formatUSD(n: number) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "$0.00";
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
