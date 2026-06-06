import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "30");
  const supabase = await createServerSupabaseClient();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const [{ data: analytics }, { data: stats }, { data: leaderboard }] =
    await Promise.all([
      supabase
        .from("analytics_daily")
        .select("*")
        .gte("date", cutoff.toISOString().split("T")[0])
        .order("date", { ascending: true }),
      supabase.from("platform_stats").select("*").maybeSingle(),
      supabase
        .from("leaderboard")
        .select("*")
        .limit(10),
    ]);

  return NextResponse.json({
    analytics: analytics ?? [],
    stats: stats ?? null,
    leaderboard: leaderboard ?? [],
  });
}
