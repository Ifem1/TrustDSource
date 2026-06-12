/**
 * Self-healing index sync.
 *
 * If the contract has more verifications than the Supabase index,
 * trigger /api/resync in the background and signal the UI to wait.
 *
 * Idempotent — safe to call from multiple pages or in parallel.
 */

import { getTotalVerifications } from "./service";

export interface SyncCheckResult {
  contractTotal: number;
  indexTotal: number;
  needsSync: boolean;
}

export interface SyncRunResult {
  scanned: number;
  indexed: number;
  error?: string;
}

let lastSyncAt = 0;
const SYNC_COOLDOWN_MS = 30_000; // don't hammer the endpoint

export async function checkIndexHealth(): Promise<SyncCheckResult> {
  const [contractRes, indexRes] = await Promise.all([
    getTotalVerifications(),
    fetch("/api/index?limit=100")
      .then((r) => r.json())
      .catch(() => ({ data: [] })),
  ]);

  const contractTotal = Number(contractRes.data ?? 0);
  const indexTotal = Array.isArray(indexRes.data) ? indexRes.data.length : 0;

  return {
    contractTotal,
    indexTotal,
    needsSync: contractTotal > indexTotal,
  };
}

export async function runResync(limit = 25): Promise<SyncRunResult> {
  const now = Date.now();
  if (now - lastSyncAt < SYNC_COOLDOWN_MS) {
    return { scanned: 0, indexed: 0 };
  }
  lastSyncAt = now;

  try {
    const res = await fetch("/api/resync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit }),
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      return { scanned: 0, indexed: 0, error: json.error ?? `HTTP ${res.status}` };
    }
    return {
      scanned: Number(json.scanned ?? 0),
      indexed: Number(json.indexed ?? 0),
    };
  } catch (e) {
    return {
      scanned: 0,
      indexed: 0,
      error: e instanceof Error ? e.message : "Network error",
    };
  }
}

/**
 * Convenience: check + auto-resync if needed.
 * Returns whether a sync was triggered so the caller can refetch.
 */
export async function autoHealIndex(): Promise<{
  triggered: boolean;
  result?: SyncRunResult;
}> {
  const health = await checkIndexHealth();
  if (!health.needsSync) return { triggered: false };
  const result = await runResync(25);
  return { triggered: true, result };
}
