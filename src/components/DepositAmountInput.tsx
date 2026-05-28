"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

type Props = {
  value: string;
  onChange: (val: string) => void;
  onPriceChangeAction?: (price: number | null) => void;
  label?: string;
  hideOracle?: boolean;
  solPrice?: number | null;
};

export default function DepositAmountInput({ 
  value, 
  onChange, 
  onPriceChangeAction,
  label = "Allocation Amount",
  hideOracle = false,
  solPrice
}: Props) {
  const [internalPrice, setInternalPrice] = useState<number | null>(null);

  // Poll price internally only if not provided by parent
  useEffect(() => {
    if (solPrice !== undefined && solPrice !== null) {
      onPriceChangeAction?.(solPrice);
      return;
    }

    let active = true;
    const fetchPrice = async () => {
      try {
        const res = await fetch("/api/solPrice");
        const data = await res.json();
        if (active && data.success && data.price > 0) {
          setInternalPrice(data.price);
          onPriceChangeAction?.(data.price);
        }
      } catch (e) {
        console.error("Internal input price fetch failed:", e);
      }
    };

    void fetchPrice();
    const interval = setInterval(fetchPrice, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [solPrice, onPriceChangeAction]);

  const activePrice = solPrice !== undefined && solPrice !== null ? solPrice : (internalPrice || 165);
  const amountNum = Number.parseFloat(value || "0") || 0;
  const usdValue = activePrice * amountNum;

  return (
    <div className="text-[#F5F5F5]">
      <label className="block text-xs font-semibold tracking-wider text-[#8A8A8A] uppercase mb-1.5">
        {label}
      </label>

      <div className="relative bg-[#101010] rounded-sm border border-white/10 p-3">
        <div className="flex items-center justify-between gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-transparent text-[#F5F5F5] placeholder-neutral-700 text-base font-mono focus:outline-none"
          />

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#151515] border border-white/5 rounded-sm">
              <img src="/vault-list-logos/SOL.svg" alt="SOL" className="w-3.5 h-3.5" />
              <span className="text-[#F5F5F5] text-xs font-mono font-medium">SOL</span>
            </div>
            <ArrowRight size={14} className="text-[#8A8A8A] hidden md:block" />
          </div>
        </div>
      </div>

      {!hideOracle && (
        <div className="mt-1.5 flex justify-between text-[10px] font-mono text-[#8A8A8A]">
          <div>
            ≈ {usdValue ? `$${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "$0.00"} USD
          </div>
          <div>
            Index Price: {activePrice ? `$${activePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "Fetching..."}
          </div>
        </div>
      )}
    </div>
  );
}

