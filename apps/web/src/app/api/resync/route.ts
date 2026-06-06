/**
 * Rebuild the Supabase verifications_index from the contract.
 *
 * Walks get_recent_report_ids(limit) and upserts each report.
 * Use this if Supabase ever drifts or you redeploy with a fresh DB.
 *
 * POST /api/resync   { limit?: number = 200 }
 *
 * Best-effort. Returns counts. Safe to call repeatedly.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TRUSTDSOURCE_UNIFIED_ADDRESS } from "@/lib/genlayer/contracts";

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value.trim()) as T;
  } catch {
    return fallback;
  }
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }

  let limit = 200;
  try {
    const body = (await req.json().catch(() => ({}))) as { limit?: number };
    if (typeof body.limit === "number") limit = Math.min(1000, Math.max(1, body.limit));
  } catch {}

  const account = createAccount();
  const client = createClient({ chain: studionet, account });

  let recentIdsRaw: unknown;
  try {
    recentIdsRaw = await client.readContract({
      address: TRUSTDSOURCE_UNIFIED_ADDRESS,
      functionName: "get_recent_report_ids",
      args: [limit],
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to read recent ids" },
      { status: 500 }
    );
  }

  const reportIds = safeJsonParse<string[]>(recentIdsRaw, []);
  if (reportIds.length === 0) {
    return NextResponse.json({ scanned: 0, indexed: 0 });
  }

  let indexed = 0;
  const errors: string[] = [];

  for (const reportId of reportIds) {
    try {
      const reportRaw = await client.readContract({
        address: TRUSTDSOURCE_UNIFIED_ADDRESS,
        functionName: "get_report",
        args: [reportId],
      });
      const report = safeJsonParse<Record<string, unknown>>(reportRaw, {});
      if (!report || !report.report_id) continue;

      const wallet = String(report.submitter_wallet ?? "");
      if (!wallet) continue;

      let reputationScore = 0;
      let reputationTier = "new";
      try {
        const profileRaw = await client.readContract({
          address: TRUSTDSOURCE_UNIFIED_ADDRESS,
          functionName: "get_profile",
          args: [wallet],
        });
        const profile = safeJsonParse<Record<string, unknown>>(profileRaw, {});
        reputationScore = Number(profile.reputation_score ?? 0);
        reputationTier = String(profile.reputation_tier ?? "new");
      } catch {}

      const row = {
        report_id: String(report.report_id),
        wallet,
        title: String(report.title ?? "").slice(0, 500),
        url: report.url ? String(report.url) : null,
        category: report.category ? String(report.category) : null,
        verdict: report.verdict ? String(report.verdict) : null,
        credibility_score: Number(report.credibility_score ?? 0),
        source_quality: Number(report.source_quality ?? 0),
        evidence_strength: Number(report.evidence_strength ?? 0),
        consistency_score: Number(report.consistency_score ?? 0),
        bias_risk: report.bias_risk ? String(report.bias_risk) : null,
        misinformation_risk: report.misinformation_risk
          ? String(report.misinformation_risk)
          : null,
        confidence: Number(report.confidence ?? 0),
        reputation_at_time: reputationScore,
        reputation_tier_at_time: reputationTier,
        ai_summary: report.ai_summary
          ? String(report.ai_summary).slice(0, 2000)
          : null,
        created_at: report.created_at
          ? new Date(String(report.created_at)).toISOString()
          : new Date().toISOString(),
        indexed_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("verifications_index")
        .upsert(row, { onConflict: "report_id" });

      if (error) {
        errors.push(`${reportId}: ${error.message}`);
      } else {
        indexed++;
      }
    } catch (e) {
      errors.push(`${reportId}: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }

  return NextResponse.json({
    scanned: reportIds.length,
    indexed,
    errors: errors.slice(0, 10),
  });
}
