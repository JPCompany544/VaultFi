import { NextResponse } from "next/server";

// Simple in-memory cache ( NextJS API route environment persists in dev/prod node processes )
let cache: {
  price: number;
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 10 * 1000; // 10 seconds
const STALE_TTL_MS = 60 * 1000; // 60 seconds fallback

async function fetchFromJupiter(): Promise<number | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch("https://api.jup.ag/price/v2?ids=SOL", { signal: controller.signal });
    clearTimeout(timeout);
    
    if (res.ok) {
      const json = await res.json();
      const price = Number(json.data?.SOL?.price);
      if (price > 0) return price;
    }
  } catch (e) {
    console.error("[PriceOracle] Jupiter fetch failed:", e);
  }
  return null;
}

async function fetchFromCoinGecko(): Promise<number | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      const price = Number(json.solana?.usd);
      if (price > 0) return price;
    }
  } catch (e) {
    console.error("[PriceOracle] CoinGecko fallback failed:", e);
  }
  return null;
}

export async function GET() {
  const now = Date.now();

  // 1. Check if cache is fresh
  if (cache && now - cache.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      success: true,
      price: cache.price,
      stale: false,
      cached: true,
    });
  }

  // 2. Fetch from Jupiter (primary provider)
  let price = await fetchFromJupiter();

  // 3. Fallback to CoinGecko (secondary provider)
  if (!price) {
    console.warn("[PriceOracle] Jupiter failed. Trying CoinGecko fallback...");
    price = await fetchFromCoinGecko();
  }

  // 4. Handle success and update cache
  if (price) {
    cache = {
      price,
      timestamp: now,
    };
    return NextResponse.json({
      success: true,
      price,
      stale: false,
      cached: false,
    });
  }

  // 5. If both providers failed, fallback to stale cache (up to 60s)
  if (cache && now - cache.timestamp < STALE_TTL_MS) {
    console.warn("[PriceOracle] Both providers failed. Returning stale cache.");
    return NextResponse.json({
      success: true,
      price: cache.price,
      stale: true,
      cached: true,
      warning: "Price might be stale. Both index feeds are currently down."
    });
  }

  // 6. Complete failure state
  return NextResponse.json({
    success: false,
    error: "Index price feed unavailable.",
    fallbackPrice: 165.0, // baseline safety fallback
  }, { status: 503 });
}
