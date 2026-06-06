/**
 * Unified-contract verification pipeline.
 *
 * Fast mode (default — recommended): all steps are deterministic on-chain.
 *   1. submit_content
 *   2. extract_claims
 *   3. use_fallback_sources
 *   4. use_deterministic_credibility
 *   5. calculate_credibility
 *   6. store_report
 *   7. update_reputation
 *   8. get_report   (final read)
 *
 * AI mode (optional, slower): swaps in the AI-powered methods.
 *   3. analyse_sources(webResultsText)
 *   4. analyse_credibility
 *
 * Every contract write goes through the user's wallet via writeFn.
 * Receipt polling is done by waitForTx in trustdsource/service.ts.
 */

import {
  getReport,
  getProfile,
  getAnalytics,
  parseClaims,
  parseSources,
  parseReport,
  waitForTx,
} from "@/lib/trustdsource/service";
import { safeJsonParse } from "@/lib/trustdsource/utils";
import type {
  Claim,
  PipelineMode,
  Source,
  TrustDSourceAnalytics,
  TrustDSourceProfile,
  TrustDSourceReport,
} from "@/lib/trustdsource/types";

// ----------------------------------------------------------------
// Pipeline state
// ----------------------------------------------------------------

export type PipelineStep =
  | "idle"
  | "submitting"
  | "snapshot_locked"
  | "extracting_claims"
  | "claims_extracted"
  | "discovering_sources"
  | "sources_fallback"
  | "sources_analyzed"
  | "verifying_claims"
  | "credibility_deterministic"
  | "credibility_analyzed"
  | "calculating_credibility"
  | "credibility_calculated"
  | "storing_report"
  | "updating_reputation"
  | "reading_final"
  | "complete"
  | "failed";

export interface PipelineState {
  step: PipelineStep;
  mode: PipelineMode;
  reportId: string | null;
  claims: Claim[];
  sources: Source[];
  analysis: Record<string, unknown> | null;
  finalReport: TrustDSourceReport | null;
  profile: TrustDSourceProfile | null;
  analytics: TrustDSourceAnalytics | null;
  error: string | null;
  failedStep: PipelineStep | null;
  txHashes: { step: PipelineStep; hash: string }[];
  currentTxStatus: string | null;
  currentTxElapsedMs: number;
}

export function initialPipelineState(mode: PipelineMode = "fast"): PipelineState {
  return {
    step: "idle",
    mode,
    reportId: null,
    claims: [],
    sources: [],
    analysis: null,
    finalReport: null,
    profile: null,
    analytics: null,
    error: null,
    failedStep: null,
    txHashes: [],
    currentTxStatus: null,
    currentTxElapsedMs: 0,
  };
}

// ----------------------------------------------------------------
// Recent reports — localStorage (synced to Supabase via /api/recent-reports)
// ----------------------------------------------------------------

const STORAGE_KEY = "trustdsource:recentReports";

export interface RecentReport {
  reportId: string;
  title: string;
  timestamp: number;
  verdict?: string;
  credibility_score?: number;
  wallet?: string;
}

export function saveRecentReport(report: RecentReport): void {
  try {
    const existing: RecentReport[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "[]"
    );
    const filtered = existing.filter((r) => r.reportId !== report.reportId);
    const updated = [report, ...filtered].slice(0, 20);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  // Best-effort Supabase sync
  fetch("/api/recent-reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report),
  }).catch(() => {});
}

export function getRecentReports(): RecentReport[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

// ----------------------------------------------------------------
// Wallet write function (provided by useGenLayerWrite)
// ----------------------------------------------------------------

export type WriteFn = (
  method: string,
  args: unknown[]
) => Promise<{ evmTxHash: string; error?: string }>;

export type StepCallback = (patch: Partial<PipelineState>) => void;

function pushTx(
  txHashes: PipelineState["txHashes"],
  step: PipelineStep,
  hash: string | undefined
): PipelineState["txHashes"] {
  if (!hash) return txHashes;
  return [...txHashes, { step, hash }];
}

async function runStep<T>(
  writeFn: WriteFn,
  method: string,
  args: unknown[],
  onStatusUpdate?: (status: string, elapsedMs: number) => void
): Promise<{ data?: T; txHash?: string; error?: string }> {
  const write = await writeFn(method, args);
  if (write.error || !write.evmTxHash) {
    return { error: write.error ?? `Failed to send ${method}` };
  }
  const receipt = await waitForTx<T>(
    write.evmTxHash,
    method,
    args,
    onStatusUpdate
  );
  if (receipt.error) {
    return { txHash: write.evmTxHash, error: receipt.error };
  }
  return { txHash: write.evmTxHash, data: receipt.data };
}

// ----------------------------------------------------------------
// Compose a final report locally from individual step outputs.
// Used as a fallback if calculate_credibility returns nothing useful.
// ----------------------------------------------------------------

function composeFinalReport(args: {
  reportId: string;
  claims: Claim[];
  sources: Source[];
  analysis: Record<string, unknown>;
  formData: { title: string; url: string; category: string };
  walletAddress: string;
}): TrustDSourceReport {
  const a = args.analysis;
  const supporting = args.sources.filter((s) => s.is_supporting);
  const conflicting = args.sources.filter((s) => !s.is_supporting);
  return {
    report_id: args.reportId,
    content_hash: "",
    credibility_score: Number(a.credibility_score ?? 0),
    confidence: String(a.confidence ?? "0.0"),
    source_quality: Number(a.source_quality ?? 0),
    evidence_strength: Number(a.evidence_strength ?? 0),
    consistency_score: Number(a.consistency_score ?? 0),
    bias_risk: String(a.bias_risk ?? "LOW"),
    misinformation_risk: String(a.misinformation_risk ?? "LOW"),
    verdict: String(a.verdict ?? "UNVERIFIED"),
    supporting_sources: supporting,
    conflicting_sources: conflicting,
    reasoning: String(a.reasoning ?? ""),
    ai_summary: String(a.ai_summary ?? ""),
    misinformation_signals: Array.isArray(a.misinformation_signals)
      ? a.misinformation_signals.map(String)
      : [],
    bias_signals: Array.isArray(a.bias_signals) ? a.bias_signals.map(String) : [],
    claims: args.claims,
    created_at: new Date().toISOString(),
    title: args.formData.title,
    url: args.formData.url,
    category: args.formData.category,
    submitter_wallet: args.walletAddress,
    verification_hash: "",
  };
}

// ----------------------------------------------------------------
// Pipeline runner
// ----------------------------------------------------------------

export interface PipelineFormData {
  title: string;
  url: string;
  content: string;
  claimSummary: string;
  category: string;
}

export interface PipelineOptions {
  mode?: PipelineMode;
  webResultsText?: string; // only used in AI mode
}

export async function runVerificationPipeline(
  walletAddress: string,
  writeFn: WriteFn,
  formData: PipelineFormData,
  onStep: StepCallback,
  options: PipelineOptions = {},
  startState?: PipelineState
): Promise<PipelineState> {
  const mode: PipelineMode = options.mode ?? "fast";
  let state: PipelineState = startState ?? initialPipelineState(mode);
  state.mode = mode;

  const fail = (step: PipelineStep, error: string): PipelineState => {
    const s: PipelineState = { ...state, step: "failed", error, failedStep: step };
    onStep(s);
    return s;
  };

  const onStatus = (status: string, elapsed: number) =>
    onStep({ currentTxStatus: status, currentTxElapsedMs: elapsed });

  // ── Step 1: submit_content ──────────────────────────────────
  state = { ...state, step: "submitting", error: null };
  onStep(state);

  const submit = await runStep<unknown>(
    writeFn,
    "submit_content",
    [
      formData.title,
      formData.url,
      formData.content,
      formData.claimSummary,
      formData.category,
      walletAddress,
    ],
    onStatus
  );
  state.txHashes = pushTx(state.txHashes, "submitting", submit.txHash);
  if (submit.error) return fail("submitting", submit.error);

  // submit_content normally returns the report_id directly.
  // Handle several possible shapes from the decoder:
  //   "abc123..."                              → plain string
  //   { report_id: "abc..." }                  → object wrapper
  //   { content_hash: "...", report_id: ... }  → snapshot fallback
  let reportId = "";
  const raw = submit.data;
  if (typeof raw === "string") {
    reportId = raw;
  } else if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    reportId = String(r.report_id ?? r.id ?? "");
  }

  if (!reportId) return fail("submitting", "submit_content returned no report_id");

  state = { ...state, step: "snapshot_locked", reportId };
  onStep(state);

  saveRecentReport({
    reportId,
    title: formData.title,
    timestamp: Date.now(),
    wallet: walletAddress,
  });

  // ── Step 2: extract_claims (deterministic) ──────────────────
  state = { ...state, step: "extracting_claims" };
  onStep(state);

  const claimsRes = await runStep<unknown>(
    writeFn,
    "extract_claims",
    [reportId],
    onStatus
  );
  state.txHashes = pushTx(state.txHashes, "extracting_claims", claimsRes.txHash);
  if (claimsRes.error) return fail("extracting_claims", claimsRes.error);

  const claims = parseClaims(claimsRes.data);
  state = { ...state, step: "claims_extracted", claims };
  onStep(state);

  // ── Step 3: sources (mode-dependent) ────────────────────────
  state = { ...state, step: "discovering_sources" };
  onStep(state);

  let sourcesRes;
  if (mode === "ai") {
    const webResultsText =
      options.webResultsText ??
      // Fall back to a built block from submitted content
      `Title: ${formData.title}\nURL: ${formData.url}\n\nContent excerpt:\n${formData.content.slice(0, 4000)}`;
    sourcesRes = await runStep<unknown>(
      writeFn,
      "analyse_sources",
      [reportId, webResultsText],
      onStatus
    );
  } else {
    sourcesRes = await runStep<unknown>(
      writeFn,
      "use_fallback_sources",
      [reportId],
      onStatus
    );
  }
  state.txHashes = pushTx(state.txHashes, "discovering_sources", sourcesRes.txHash);
  if (sourcesRes.error) return fail("discovering_sources", sourcesRes.error);

  const sources = parseSources(sourcesRes.data);
  state = {
    ...state,
    step: mode === "ai" ? "sources_analyzed" : "sources_fallback",
    sources,
  };
  onStep(state);

  // ── Step 4: credibility analysis (mode-dependent) ───────────
  state = { ...state, step: "verifying_claims" };
  onStep(state);

  const credibilityMethod =
    mode === "ai" ? "analyse_credibility" : "use_deterministic_credibility";

  const credRes = await runStep<unknown>(
    writeFn,
    credibilityMethod,
    [reportId],
    onStatus
  );
  state.txHashes = pushTx(state.txHashes, "verifying_claims", credRes.txHash);
  if (credRes.error) return fail("verifying_claims", credRes.error);

  const analysis = safeJsonParse<Record<string, unknown>>(credRes.data, {});
  state = {
    ...state,
    step: mode === "ai" ? "credibility_analyzed" : "credibility_deterministic",
    analysis,
  };
  onStep(state);

  // ── Step 5: calculate_credibility ───────────────────────────
  state = { ...state, step: "calculating_credibility" };
  onStep(state);

  const calcRes = await runStep<unknown>(
    writeFn,
    "calculate_credibility",
    [reportId],
    onStatus
  );
  state.txHashes = pushTx(state.txHashes, "calculating_credibility", calcRes.txHash);
  if (calcRes.error) return fail("calculating_credibility", calcRes.error);

  let finalReport = parseReport(calcRes.data);
  // If contract returned an empty / malformed report, compose from local pieces
  if (!finalReport || !finalReport.report_id) {
    finalReport = composeFinalReport({
      reportId,
      claims,
      sources,
      analysis,
      formData,
      walletAddress,
    });
  }

  state = { ...state, step: "credibility_calculated", finalReport };
  onStep(state);

  saveRecentReport({
    reportId,
    title: formData.title,
    timestamp: Date.now(),
    verdict: finalReport.verdict,
    credibility_score: finalReport.credibility_score,
    wallet: walletAddress,
  });

  // ── Step 6: store_report ────────────────────────────────────
  state = { ...state, step: "storing_report" };
  onStep(state);

  const storeRes = await runStep<boolean>(
    writeFn,
    "store_report",
    [reportId],
    onStatus
  );
  state.txHashes = pushTx(state.txHashes, "storing_report", storeRes.txHash);
  if (storeRes.error) {
    console.warn("[pipeline] store_report failed:", storeRes.error);
  }

  // ── Step 7: update_reputation ───────────────────────────────
  state = { ...state, step: "updating_reputation" };
  onStep(state);

  const repRes = await runStep<unknown>(
    writeFn,
    "update_reputation",
    [walletAddress, reportId],
    onStatus
  );
  state.txHashes = pushTx(state.txHashes, "updating_reputation", repRes.txHash);
  if (repRes.error) {
    console.warn("[pipeline] update_reputation failed:", repRes.error);
  }

  // ── Step 8: read final report + profile + analytics ────────
  state = { ...state, step: "reading_final" };
  onStep(state);

  const [reportRes, profileRes, analyticsRes] = await Promise.all([
    getReport(reportId),
    getProfile(walletAddress),
    getAnalytics("all_time"),
  ]);

  const mergedReport =
    reportRes.data && reportRes.data.report_id
      ? { ...finalReport, ...reportRes.data }
      : finalReport;

  const finalState: PipelineState = {
    ...state,
    step: "complete",
    finalReport: mergedReport,
    profile: profileRes.data ?? null,
    analytics: analyticsRes.data ?? null,
    error: null,
    failedStep: null,
  };
  onStep(finalState);
  return finalState;
}

// ----------------------------------------------------------------
// Resume from a failed step — re-runs from scratch using the existing reportId
// ----------------------------------------------------------------

export async function resumePipeline(
  walletAddress: string,
  writeFn: WriteFn,
  currentState: PipelineState,
  onStep: StepCallback,
  formData?: PipelineFormData,
  options?: PipelineOptions
): Promise<PipelineState> {
  if (!formData) return currentState;
  return runVerificationPipeline(
    walletAddress,
    writeFn,
    formData,
    onStep,
    options ?? { mode: currentState.mode },
    { ...currentState, error: null, failedStep: null }
  );
}
