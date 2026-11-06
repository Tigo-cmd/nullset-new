// Live ETH/USD price for the balance's USD estimate. Fetched client-side from
// CoinGecko's public API (CORS-enabled, no key needed) and shared through an
// external store so every component uses one value and one request. Falls back
// to a fixed rate when the request is blocked or fails.

import { useSyncExternalStore } from "react";
import { ETH_USD } from "./sim";

const ENDPOINT = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";
const REFRESH_MS = 60_000;

let rate = ETH_USD; // fallback until the first successful fetch
let started = false;
const subs = new Set<() => void>();

async function refresh() {
  try {
    const res = await fetch(ENDPOINT, { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { ethereum?: { usd?: number } };
    const usd = data?.ethereum?.usd;
    if (typeof usd === "number" && usd > 0) {
      rate = usd;
      subs.forEach((f) => f());
    }
  } catch {
    /* offline, blocked or rate-limited: keep the last known rate */
  }
}

const priceStore = {
  subscribe(cb: () => void) {
    subs.add(cb);
    if (!started) {
      started = true;
      refresh();
      setInterval(refresh, REFRESH_MS);
    }
    return () => subs.delete(cb);
  },
  getSnapshot(): number {
    return rate;
  },
  getServerSnapshot(): number {
    return ETH_USD;
  },
};

/** Current ETH/USD rate (live when available, fallback otherwise). */
export function useEthUsd(): number {
  return useSyncExternalStore(priceStore.subscribe, priceStore.getSnapshot, priceStore.getServerSnapshot);
}
