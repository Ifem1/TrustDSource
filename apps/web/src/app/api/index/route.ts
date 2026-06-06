/**
 * Read the Supabase verifications_index.
 *
 * GET /api/index?wallet=&category=&verdict=&q=&limit=20&offset=0
 *
 * Falls back to an empty list if Supabase isn't configured, so the
 * UI can keep rendering "indexing offline" rather than crashing.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(req: NextRequest) {
  const supabase = getClient();
  if (!supabase) {
    return NextResponse.json({ data: [], offline: true });
  }

  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");
  const category = searchParams.get("category");
  const verdict = searchParams.get("verdict");
  const q = searchParams.get("q");
  const limit = Math.min(100, Number(searchParams.get("limit") ?? "20"));
  const offset = Math.max(0, Number(searchParams.get("offset") ?? "0"));

  let query = supabase
    .from("verifications_index")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (wallet) query = query.eq("wallet", wallet);
  if (category) query = query.eq("category", category);
  if (verdict) query = query.eq("verdict", verdict);
  if (q) query = query.ilike("title", `%${q}%`);

  const { data, error } = await query;
  if (error) {
    console.error("[index GET]", error.message);
    return NextResponse.json({ data: [], error: error.message });
  }
  return NextResponse.json({ data: data ?? [] });
}
