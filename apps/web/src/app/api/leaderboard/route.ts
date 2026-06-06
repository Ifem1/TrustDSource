/**
 * Read the leaderboard_index view from Supabase.
 *
 * GET /api/leaderboard?limit=50
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
  const limit = Math.min(200, Number(searchParams.get("limit") ?? "50"));

  const { data, error } = await supabase
    .from("leaderboard_index")
    .select("*")
    .limit(limit);

  if (error) {
    console.error("[leaderboard GET]", error.message);
    return NextResponse.json({ data: [], error: error.message });
  }

  // Annotate with rank
  const ranked = (data ?? []).map(
    (row: Record<string, unknown>, i: number) => ({
      ...row,
      rank: i + 1,
    })
  );
  return NextResponse.json({ data: ranked });
}
