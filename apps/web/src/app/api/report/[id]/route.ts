import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("verification_full")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const { data: claims } = await supabase
    .from("claims")
    .select("*")
    .eq("verification_id", id)
    .order("order_index");

  const { data: sources } = await supabase
    .from("sources")
    .select("*")
    .eq("verification_id", id)
    .order("credibility_score", { ascending: false });

  return NextResponse.json({ ...data, claims: claims ?? [], sources: sources ?? [] });
}
