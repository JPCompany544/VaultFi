"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

type Props = {
  value: string;
  onChange: (val: string) => void;
  onPriceChangeAction?: (price: number | null) => void;
};

export default function DepositAmountInput({ value, onChange, onPriceChangeAction }: Props) {
  const [solPrice, setSolPrice] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchSolPrice = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = await res.json();
        const price = Number(data?.solana?.usd);
        if (!cancelled && Number.isFinite(price)) {
          setSolPrice(price);
          onPriceChangeAction?.(price);
        }
      } catch {}
    };

    fetchSolPrice();
    const id = setInterval(fetchSolPrice, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Propagate last known price to parent whenever it changes
  useEffect(() => {
    onPriceChangeAction?.(solPrice ?? null);
  }, [solPrice, onPriceChangeAction]);

  const amountNum = Number.parseFloat(value || "0") || 0;
  const usdValue = (solPrice ?? 0) * amountNum;

  return (
    <div className="text-white">
      <label className="block text-xs md:text-sm font-medium text-white mb-2 md:mb-3">
        Amount
      </label>

      <div className="relative bg-[#1a1a1a] rounded-lg md:rounded-xl border border-neutral-700 p-3 md:p-4 shadow-inner">
        <div className="flex items-center justify-between gap-2 md:gap-3">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-transparent text-white placeholder-neutral-500 text-base md:text-lg font-medium focus:outline-none"
          />

          <div className="flex items-center gap-1.5 md:gap-2">
            <button className="px-2.5 md:px-3 py-1 bg-[#7C5CFC] text-white text-xs font-medium rounded-md md:rounded-lg hover:bg-[#7C5CFC]/90 transition-colors touch-manipulation">
              MAX
            </button>
            <div className="flex items-center gap-1.5 md:gap-2 pl-1.5 md:pl-2 pr-2 md:pr-3 py-1 border border-neutral-700 rounded-md md:rounded-lg">
              <img src="/vault-list-logos/SOL.svg" alt="SOL" className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-white text-xs md:text-sm font-medium">SOL</span>
            </div>
            <ArrowRight size={16} className="text-neutral-400 hidden md:block" />
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-0 text-[10px] md:text-xs text-neutral-400">
        <div>
          ≈ {usdValue ? `$${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "$0.00"} USD
        </div>
        <div>
          Live SOL Price: {solPrice ? `$${solPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "Loading..."}
        </div>
      </div>
    </div>
  );
}
