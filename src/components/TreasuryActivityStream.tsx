"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Terminal } from "lucide-react";

interface ActivityLog {
  id: string;
  timestamp: string;
  type: "system" | "user" | "network";
  message: string;
  hash?: string;
  status?: "success" | "pending" | "info";
}

export default function TreasuryActivityStream() {
  const [ledgerLogs, setLedgerLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLedgerLogs = async () => {
    try {
      const response = await fetch("/api/treasury");
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          setLedgerLogs(json.data);
        }
      }
    } catch (e) {
      console.error("Failed to fetch treasury ledger logs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerLogs();

    // Use polling since local Prisma doesn't have Supabase realtime channels
    const interval = setInterval(() => {
      void fetchLedgerLogs();
    }, 5000); // refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Format real database events into logs
  const logs = useMemo<ActivityLog[]>(() => {
    return ledgerLogs.map((row) => {
      const isSol = row.asset === "SOL";
      const amountVal = isSol ? Number(row.amount) / 1e9 : Number(row.amount) / 100;
      const amountStr = isSol 
        ? `${amountVal.toFixed(4)} SOL` 
        : `$${amountVal.toFixed(2)} USD`;
      
      const txHash = row.txHash || row.tx_hash;
      const shortenedHash = txHash ? `${txHash.slice(0, 6)}...${txHash.slice(-6)}` : "";
      
      const type = row.direction === "IN" ? "user" : "system";
      const typeLabel = row.direction === "IN" ? "Capital allocation verified" : "Liquidity exit settled";
      
      return {
        id: row.id,
        timestamp: row.createdAt || row.created_at,
        type: type as any,
        message: `${typeLabel}. ${row.direction}flow of ${amountStr} ${shortenedHash ? `(${shortenedHash})` : ""}`,
        hash: txHash || undefined,
        status: row.verified ? "success" : "pending",
      };
    });
  }, [ledgerLogs]);

  return (
    <div className="bg-[#101010] border border-white/5 p-4 rounded-sm font-mono text-[11px] leading-relaxed select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3 text-[#8A8A8A]">
        <div className="flex items-center gap-2">
          <Terminal size={12} className="text-[#7C5CFC] animate-pulse" />
          <span className="font-semibold uppercase tracking-wider text-[10px]">TREASURY ACTIVITY STREAM</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span className="uppercase text-[9px] text-emerald-400 font-semibold tracking-widest">LIVE STREAMING</span>
        </div>
      </div>

      {/* Terminal logs list */}
      <div className="h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {loading ? (
          <div className="text-[#8A8A8A] italic">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-[#8A8A8A] italic">Awaiting connection status...</div>
        ) : (
          logs.map((log) => {
            const timeFormatted = new Date(log.timestamp).toLocaleTimeString("en-US", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit"
            });

            let logColor = "text-[#F5F5F5]";
            let typePrefix = "[SYS]";
            let badgeStyle = "text-[#8A8A8A]";
            
            if (log.type === "user") {
              typePrefix = "[TXN]";
              logColor = "text-[#F5F5F5]";
              badgeStyle = "text-[#7C5CFC]";
            } else if (log.type === "network") {
              typePrefix = "[NET]";
              logColor = "text-[#8A8A8A]";
              badgeStyle = "text-[#FACC15]";
            }

            return (
              <div key={log.id} className="flex items-start gap-2 hover:bg-white/[0.02] py-0.5 px-1 rounded-sm transition-colors">
                <span className="text-[#8A8A8A] flex-shrink-0 select-none">
                  [{timeFormatted}]
                </span>
                <span className={`${badgeStyle} flex-shrink-0 select-none font-bold`}>
                  {typePrefix}
                </span>
                <span className={`${logColor} flex-grow break-all`}>
                  {log.message}
                  {log.status === "pending" && (
                    <span className="ml-1.5 text-[#FACC15] animate-pulse">● processing</span>
                  )}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

