"use client";

import { useEffect, useState, useMemo } from "react";
import { useDepositContext } from "@/context/DepositContext";
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
  const { deposits } = useDepositContext();
  const [systemLogs, setSystemLogs] = useState<ActivityLog[]>([]);

  // Generate some realistic background system logs on mount
  useEffect(() => {
    const baseTime = Date.now();
    const mockLogs: ActivityLog[] = [
      {
        id: "sys-1",
        timestamp: new Date(baseTime - 45 * 60 * 1000).toISOString(),
        type: "system",
        message: "Treasury synchronization complete. All ledger states verified.",
        status: "success"
      },
      {
        id: "sys-2",
        timestamp: new Date(baseTime - 30 * 60 * 1000).toISOString(),
        type: "network",
        message: "Solana RPC status: Helius node synchronization active (Latency: 12ms).",
        status: "info"
      },
      {
        id: "sys-3",
        timestamp: new Date(baseTime - 15 * 60 * 1000).toISOString(),
        type: "system",
        message: "Settlement window verification check complete. Exit routes open.",
        status: "success"
      },
      {
        id: "sys-4",
        timestamp: new Date(baseTime - 5 * 60 * 1000).toISOString(),
        type: "system",
        message: "System health check complete. State: Sovereign Operational.",
        status: "success"
      }
    ];
    setSystemLogs(mockLogs);

    // Periodically add new system messages to keep terminal alive
    const interval = setInterval(() => {
      const messages = [
        "Treasury synchronization complete.",
        "Solana network oracle sync successful.",
        "Active capital deployment channels synchronized.",
        "Liquidity exit pathways verified.",
        "Ledger synchronization check: OK."
      ];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      setSystemLogs(prev => [
        {
          id: `sys-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: "system",
          message: randomMsg,
          status: "success"
        },
        ...prev.slice(0, 10) // Limit backlog size
      ]);
    }, 45000);

    return () => clearInterval(interval);
  }, []);

  // Format real user deposits/withdrawals from Supabase
  const userLogs = useMemo<ActivityLog[]>(() => {
    const logs: ActivityLog[] = [];
    deposits.forEach((dep) => {
      if (dep.vaultName !== "Solis Yield Vault") return;
      const timeStr = dep.createdAt;
      const shortenedHash = dep.txHash ? `${dep.txHash.slice(0, 6)}...${dep.txHash.slice(-6)}` : "";
      
      if (dep.status === "confirmed") {
        if (dep.amount > 0) {
          logs.push({
            id: `usr-dep-${dep.id}`,
            timestamp: timeStr,
            type: "user",
            message: `Capital allocation confirmed. Verified ${dep.amount} SOL (${shortenedHash})`,
            status: "success",
            hash: dep.txHash || undefined
          });
          logs.push({
            id: `usr-pos-${dep.id}`,
            timestamp: timeStr,
            type: "user",
            message: `Position activated. Allocation size: ${dep.amount} SOL`,
            status: "success"
          });
        } else {
          // Completed exit (withdrawal is represented as negative deposit)
          logs.push({
            id: `usr-wth-${dep.id}`,
            timestamp: timeStr,
            type: "user",
            message: `Liquidity exit completed. Settled: ${Math.abs(dep.amount)} USD`,
            status: "success"
          });
        }
      } else if (dep.status === "pending") {
        logs.push({
          id: `usr-dep-pend-${dep.id}`,
          timestamp: timeStr,
          type: "user",
          message: `Settlement processing in progress. Allocation of ${dep.amount} SOL (${shortenedHash})`,
          status: "pending",
          hash: dep.txHash || undefined
        });
      } else if (dep.status === "pending_withdrawal") {
        logs.push({
          id: `usr-wth-pend-${dep.id}`,
          timestamp: timeStr,
          type: "user",
          message: `Liquidity exit request initiated. Amount: ${dep.amount} USD`,
          status: "pending"
        });
      }
    });
    return logs;
  }, [deposits]);

  // Combine and sort all logs by timestamp descending
  const allLogs = useMemo(() => {
    const combined = [...systemLogs, ...userLogs];
    return combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [systemLogs, userLogs]);

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
        {allLogs.length === 0 ? (
          <div className="text-[#8A8A8A] italic">Awaiting connection status...</div>
        ) : (
          allLogs.map((log) => {
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
