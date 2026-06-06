/**
 * Recent reports — Supabase-backed list of recent verifications.
 *
 * GET  /api/recent-reports?wallet=0x...&limit=10   → list
 * POST /api/recent-reports  { reportId, title, verdict?, credibility_score?, wallet? }
 *
 * If Supabase isn't configured, the API returns an empty list and 204 on POST.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(req: NextRequest) {
  const supabase = getServiceClient();
  if (!supabase) return NextResponse.json({ data: [] });

  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");
  const limit = Math.min(50, Number(searchParams.get("limit") ?? "20"));

  let query = supabase
    .from("recent_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (wallet) {
    query = query.eq("wallet", wallet);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[recent-reports GET]", error.message);
    return NextResponse.json({ data: [] });
  }
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = getServiceClient();
  if (!supabase) return new NextResponse(null, { status: 204 });

  try {
    const body = (await req.json()) as {
      reportId?: string;
      title?: string;
      verdict?: string;
      credibility_score?: number;
      wallet?: string;
    };

    if (!body.reportId || !body.title || !body.wallet) {
      return NextResponse.json(
        { error: "reportId, title, wallet required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("recent_reports")
      .upsert(
        {
          wallet: body.wallet,
          report_id: body.reportId,
          title: body.title.slice(0, 500),
          verdict: body.verdict ?? null,
          credibility_score: body.credibility_score ?? null,
          created_at: new Date().toISOString(),
        },
        { onConflict: "wallet,report_id" }
      );

    if (error) {
      console.error("[recent-reports POST]", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Cap at 20 per wallet — delete older overflow
    const { data: keep } = await supabase
      .from("recent_reports")
      .select("id")
      .eq("wallet", body.wallet)
      .order("created_at", { ascending: false })
      .limit(20);

    if (keep && keep.length === 20) {
      const keepIds = keep.map((k) => k.id);
      await supabase
        .from("recent_reports")
        .delete()
        .eq("wallet", body.wallet)
        .not("id", "in", `(${keepIds.join(",")})`);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
