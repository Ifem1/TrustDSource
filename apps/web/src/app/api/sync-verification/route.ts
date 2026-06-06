/**
 * Mirror a completed verification into the Supabase verifications_index.
 *
 * Best-effort. If Supabase isn't configured, returns 204.
 * Called from the pipeline after update_reputation succeeds.
 *
 * POST /api/sync-verification
 *   {
 *     report_id, wallet, title, url?, category?, verdict?,
 *     credibility_score?, source_quality?, evidence_strength?,
 *     consistency_score?, bias_risk?, misinformation_risk?,
 *     confidence?, reputation_at_time?, reputation_tier_at_time?,
 *     ai_summary?, created_at?
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  const supabase = getServiceClient();
  if (!supabase) return new NextResponse(null, { status: 204 });

  try {
    const body = (await req.json()) as Record<string, unknown>;

    if (!body.report_id || !body.wallet || !body.title) {
      return NextResponse.json(
        { error: "report_id, wallet, title required" },
        { status: 400 }
      );
    }

    const row = {
      report_id: String(body.report_id),
      wallet: String(body.wallet),
      title: String(body.title).slice(0, 500),
      url: body.url ? String(body.url) : null,
      category: body.category ? String(body.category) : null,
      verdict: body.verdict ? String(body.verdict) : null,
      credibility_score:
        body.credibility_score != null ? Number(body.credibility_score) : null,
      source_quality:
        body.source_quality != null ? Number(body.source_quality) : null,
      evidence_strength:
        body.evidence_strength != null
          ? Number(body.evidence_strength)
          : null,
      consistency_score:
        body.consistency_score != null
          ? Number(body.consistency_score)
          : null,
      bias_risk: body.bias_risk ? String(body.bias_risk) : null,
      misinformation_risk: body.misinformation_risk
        ? String(body.misinformation_risk)
        : null,
      confidence: body.confidence != null ? Number(body.confidence) : null,
      reputation_at_time:
        body.reputation_at_time != null
          ? Number(body.reputation_at_time)
          : null,
      reputation_tier_at_time: body.reputation_tier_at_time
        ? String(body.reputation_tier_at_time)
        : null,
      ai_summary: body.ai_summary
        ? String(body.ai_summary).slice(0, 2000)
        : null,
      created_at: body.created_at
        ? new Date(String(body.created_at)).toISOString()
        : new Date().toISOString(),
      indexed_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("verifications_index")
      .upsert(row, { onConflict: "report_id" });

    if (error) {
      console.error("[sync-verification] upsert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
