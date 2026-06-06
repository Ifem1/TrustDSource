import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  const { wallet } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("wallet_address", wallet)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const { data: history } = await supabase
    .from("verification_full")
    .select("*")
    .eq("submitter_wallet", wallet)
    .eq("status", "complete")
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: repHistory } = await supabase
    .from("reputation_history")
    .select("*")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({
    profile,
    verifications: history ?? [],
    reputationHistory: repHistory ?? [],
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  const { wallet } = await params;
  const supabase = await createServerSupabaseClient();
  const body = await req.json();

  const allowed = ["username", "display_name", "bio", "avatar_url"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("wallet_address", wallet)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
