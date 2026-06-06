/**
 * Trustdsource unified contract service.
 *
 * Read methods talk to the server-side /api/genlayer proxy.
 * Write methods are signed via the user's wallet — see useTrustDSourceWrite.
 *
 * Every complex return value from the unified contract is a JSON string,
 * so callers must run safeJsonParse on the result.
 */

import { safeJsonParse } from "./utils";
import type {
  Claim,
  Source,
  TrustDSourceAnalytics,
  TrustDSourceProfile,
  TrustDSourceReport,
  TrustDSourceSnapshot,
} from "./types";

export interface ServiceResult<T> {
  data?: T;
  error?: string;
  raw?: unknown;
}

async function callApi<T = unknown>(body: unknown): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch("/api/genlayer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json: { data?: T; error?: string } = await res.json();
    if (!res.ok || json.error) {
      return { error: json.error ?? `HTTP ${res.status}` };
    }
    return { data: json.data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Network error" };
  }
}

async function readUnified<TParsed, TFallback = TParsed>(
  method: string,
  args: unknown[],
  fallback: TFallback
): Promise<ServiceResult<TParsed | TFallback>> {
  const res = await callApi<unknown>({ action: "read", method, args });
  if (res.error) return { error: res.error, raw: res.data };
  const parsed = safeJsonParse<TParsed | TFallback>(res.data, fallback);
  return { data: parsed, raw: res.data };
}

// ================================================================
// View methods
// ================================================================

export async function getReport(
  reportId: string
): Promise<ServiceResult<TrustDSourceReport>> {
  return readUnified<TrustDSourceReport>(
    "get_report",
    [reportId],
    {} as TrustDSourceReport
  );
}

export async function getSnapshot(
  reportId: string
): Promise<ServiceResult<TrustDSourceSnapshot>> {
  return readUnified<TrustDSourceSnapshot>(
    "get_snapshot",
    [reportId],
    {} as TrustDSourceSnapshot
  );
}

export async function getProfile(
  walletAddress: string
): Promise<ServiceResult<TrustDSourceProfile>> {
  return readUnified<TrustDSourceProfile>(
    "get_profile",
    [walletAddress],
    {} as TrustDSourceProfile
  );
}

export async function getAnalytics(
  key: string = "all_time"
): Promise<ServiceResult<TrustDSourceAnalytics>> {
  return readUnified<TrustDSourceAnalytics>(
    "get_analytics",
    [key],
    {} as TrustDSourceAnalytics
  );
}

export async function getTotalVerifications(): Promise<ServiceResult<number>> {
  const res = await callApi<unknown>({
    action: "read",
    method: "get_total_verifications",
    args: [],
  });
  if (res.error) return { error: res.error };
  return { data: Number(res.data ?? 0), raw: res.data };
}

export async function getRecentReportIds(
  limit: number = 10
): Promise<ServiceResult<string[]>> {
  return readUnified<string[]>("get_recent_report_ids", [limit], []);
}

export async function getSchemaMetadata(): Promise<ServiceResult<Record<string, unknown>>> {
  return readUnified<Record<string, unknown>>(
    "get_schema_metadata_json",
    [],
    {}
  );
}

export async function buildSearchQuery(
  title: string,
  primaryClaim: string,
  category: string
): Promise<ServiceResult<string>> {
  const res = await callApi<unknown>({
    action: "read",
    method: "build_search_query",
    args: [title, primaryClaim, category],
  });
  if (res.error) return { error: res.error };
  return { data: String(res.data ?? ""), raw: res.data };
}

// ================================================================
// Parsing helpers for raw contract strings (used by pipeline)
// ================================================================

export function parseClaims(raw: unknown): Claim[] {
  return safeJsonParse<Claim[]>(raw, []);
}

export function parseSources(raw: unknown): Source[] {
  return safeJsonParse<Source[]>(raw, []);
}

export function parseAnalysis(raw: unknown): Record<string, unknown> {
  return safeJsonParse<Record<string, unknown>>(raw, {});
}

export function parseReport(raw: unknown): TrustDSourceReport {
  return safeJsonParse<TrustDSourceReport>(raw, {} as TrustDSourceReport);
}

// ================================================================
// Status helpers for wallet-signed writes
// (used by the pipeline to poll receipt status)
// ================================================================

export interface TxStatus {
  status: string;
  decided: boolean;
}

export async function getTxStatus(
  txHash: string
): Promise<ServiceResult<TxStatus>> {
  const res = await callApi<TxStatus>({ action: "status", txHash });
  if (res.error) return { error: res.error };
  return { data: res.data };
}

export async function getTxReceipt<T = unknown>(
  txHash: string,
  fromMethod?: string,
  fromArgs?: unknown[]
): Promise<ServiceResult<T>> {
  const res = await callApi<T>({
    action: "receipt",
    txHash,
    fromMethod,
    fromArgs,
  });
  return res;
}

export async function waitForTx<T = unknown>(
  txHash: string,
  fromMethod?: string,
  fromArgs?: unknown[],
  onProgress?: (status: string, elapsedMs: number) => void,
  intervalMs: number = 4_000
): Promise<ServiceResult<T>> {
  const start = Date.now();
  let lastStatus = "PENDING";
  while (true) {
    const statusRes = await getTxStatus(txHash);
    const elapsed = Date.now() - start;
    if (statusRes.data) {
      lastStatus = statusRes.data.status;
      if (onProgress) onProgress(lastStatus, elapsed);
      if (statusRes.data.decided) {
        return getTxReceipt<T>(txHash, fromMethod, fromArgs);
      }
    } else if (onProgress) {
      onProgress(lastStatus, elapsed);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
