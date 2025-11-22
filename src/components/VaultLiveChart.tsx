"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";

interface ChartDataPoint {
  time: string;
  value: number;
  timestamp: number;
}

interface VaultLiveChartProps {
  className?: string;
}

export default function VaultLiveChart({ className = "" }: VaultLiveChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Real-time chart simulates Solis vault TVL movement starting at $123,456,789
  const BASE_TVL = 423_456_879;
  const MIN_UPDATE_MS = 1000; // 1s
  const MAX_UPDATE_MS = 3000; // 3s
  const GROWTH_MIN = 0.0001; // +0.01%
  const GROWTH_MAX = 0.0005; // +0.05%
  const DIP_MIN = -0.0002;   // -0.02%
  const DIP_MAX = -0.0001;   // -0.01%
  const DIP_PROBABILITY = 0.2; // 20% chance of a small dip
  const WINDOW_MS = 60 * 60 * 1000; // keep last 1 hour of data
  const INITIAL_STEP_MS = 2000; // Seed initial series with 2s spacing

  const formatUSD = useCallback((v: number) => {
    return `$${Math.round(v).toLocaleString("en-US")}`;
  }, []);

  // Generate initial data
  const generateInitialData = useCallback(() => {
    const initialData: ChartDataPoint[] = [];
    const now = Date.now();
    let value = BASE_TVL;
    for (let i = 29; i >= 0; i--) {
      const timestamp = now - i * INITIAL_STEP_MS;
      const time = new Date(timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const isDip = Math.random() < DIP_PROBABILITY;
      const delta = isDip
        ? DIP_MIN + Math.random() * (DIP_MAX - DIP_MIN)
        : GROWTH_MIN + Math.random() * (GROWTH_MAX - GROWTH_MIN);
      // Slow upward trend with occasional micro dips
      value = i === 29 ? value : value * (1 + delta);
      initialData.push({ time, value, timestamp });
    }
    return initialData;
  }, []);

  // Generate new data point
  const generateNewDataPoint = useCallback((lastValue: number): ChartDataPoint => {
    const now = Date.now();
    const time = new Date(now).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const isDip = Math.random() < DIP_PROBABILITY;
    const delta = isDip
      ? DIP_MIN + Math.random() * (DIP_MAX - DIP_MIN)
      : GROWTH_MIN + Math.random() * (GROWTH_MAX - GROWTH_MIN);
    const value = lastValue * (1 + delta);
    return { time, value, timestamp: now };
  }, []);

  // Initialize data
  useEffect(() => {
    setData(generateInitialData());
  }, [generateInitialData]);

  // Update data on a randomized 1–3s interval using timeouts
  useEffect(() => {
    const scheduleNext = () => {
      const delay = MIN_UPDATE_MS + Math.random() * (MAX_UPDATE_MS - MIN_UPDATE_MS);
      timerRef.current = setTimeout(() => {
        setData((prevData) => {
          const lastValue = prevData[prevData.length - 1]?.value || BASE_TVL;
          const newPoint = generateNewDataPoint(lastValue);
          const cutoff = Date.now() - WINDOW_MS;
          const next = [...prevData, newPoint].filter((p) => p.timestamp >= cutoff);
          return next;
        });
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [generateNewDataPoint]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1A1A1A] border border-neutral-700 rounded-lg p-3 shadow-lg">
          <p className="text-white text-sm font-medium">
            TVL: <span className="text-[#7C5CFC]">{formatUSD(data.value)}</span>
          </p>
          <p className="text-neutral-400 text-xs">
            Time: {data.time}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom dot component for hover effect
  const CustomDot = ({ cx, cy, payload, index }: any) => {
    const isLastPoint = index === data.length - 1;
    const isActive = isHovered && index === data.length - 1;
    
    return (
      <circle
        cx={cx}
        cy={cy}
        r={isActive || isLastPoint ? 6 : 0}
        fill="#7C5CFC"
        stroke="#7C5CFC"
        strokeWidth={2}
        className="transition-all duration-200"
        style={{
          filter: isActive || isLastPoint ? "drop-shadow(0 0 6px rgba(124, 92, 252, 0.35))" : "none",
        }}
      />
    );
  };

  const currentValue = data[data.length - 1]?.value ?? BASE_TVL;
  const hasOneHourOfData = data.length > 0 && (Date.now() - data[0].timestamp) >= WINDOW_MS;
  let oneHourChangePct: number | null = null;
  if (hasOneHourOfData) {
    const oneHourAgoValue = data[0].value;
    if (oneHourAgoValue > 0) {
      oneHourChangePct = ((currentValue - oneHourAgoValue) / oneHourAgoValue) * 100;
    }
  }

  return (
    <div className={`bg-[#1A1A1A] rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg ${className}`}>
      {/* Chart Header */}
      <div className="mb-5 md:mb-6">
        <h3 className="text-base md:text-lg font-semibold text-white mb-1.5 md:mb-2" style={{ fontFamily: 'Faculty-Glyphic' }}>
          Vault TVL Growth (Live)
        </h3>
        <p className="text-xs md:text-sm text-neutral-400">
          Tracking Solis Vault Liquidity Movements in Real Time
        </p>
      </div>

      {/* Chart Container */}
      <div className="h-52 md:h-64 w-full relative">
        {/* Overlay: Current TVL and optional 1h change */}
        <div className="pointer-events-none absolute right-2 md:right-3 top-2 md:top-3 text-right">
          <div
            className="text-white font-semibold text-xs md:text-sm lg:text-base"
            style={{ textShadow: "0 0 8px rgba(124, 92, 252, 0.35)" }}
          >
            {formatUSD(currentValue)}
          </div>
          <div className="text-[9px] md:text-[10px] lg:text-xs text-neutral-400">
            {oneHourChangePct === null ? (
              <span>1h: —</span>
            ) : (
              <span className={oneHourChangePct >= 0 ? "text-emerald-400" : "text-rose-400"}>
                1h: {oneHourChangePct >= 0 ? "+" : ""}{oneHourChangePct.toFixed(2)}%
              </span>
            )}
          </div>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C5CFC" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#7C5CFC" stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#2A2A2A" 
              strokeOpacity={0.15}
            />
            
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#A0A0A0", fontFamily: 'Inter, ui-sans-serif, system-ui' }}
              interval="preserveStartEnd"
              hide={false}
            />
            
            <YAxis
              domain={[ 'dataMin', 'dataMax' ]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#A0A0A0", fontFamily: 'Inter, ui-sans-serif, system-ui' }}
              tickFormatter={(value) => formatUSD(value)}
              width={45}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Area
              type="monotone"
              dataKey="value"
              stroke="none"
              fill="url(#colorGradient)"
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-in-out"
            />
            
            <Line
              type="monotone"
              dataKey="value"
              stroke="#7C5CFC"
              strokeWidth={2}
              dot={false}
              activeDot={<CustomDot />}
              style={{
                filter: "drop-shadow(0 0 6px rgba(124, 92, 252, 0.25))",
              }}
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-in-out"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer */}
      <div className="mt-3 md:mt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-1 md:gap-0 text-[10px] md:text-xs text-neutral-500">
        <span>Last updated: {data[data.length - 1]?.time || "Loading..."}</span>
        <span>{data.length} data points</span>
      </div>
    </div>
  );
}
