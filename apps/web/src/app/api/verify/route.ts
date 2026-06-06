import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { hashContent } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(5).max(500),
  url: z.string().url().or(z.literal("")).optional().default(""),
  content: z.string().min(50).max(10000),
  claim_summary: z.string().max(1000).optional().default(""),
  category: z.enum([
    "news", "social", "research", "public_statement",
    "blog", "press_release", "breaking_news", "other",
  ]),
  wallet_address: z.string().min(10),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, url, content, claim_summary, category, wallet_address } =
      parsed.data;

    const content_hash = hashContent(content, url ?? "", claim_summary ?? "");
    const supabase = await createServiceRoleClient();

    const { data: existing } = await supabase
      .from("verifications")
      .select("id, status")
      .eq("content_hash", content_hash)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        verification_id: existing.id,
        status: existing.status,
        duplicate: true,
      });
    }

    let profileId: string | null = null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("wallet_address", wallet_address)
      .maybeSingle();

    if (profile) {
      profileId = profile.id;
    } else {
      const { data: newProfile } = await supabase
        .from("profiles")
        .insert({ wallet_address })
        .select("id")
        .single();
      if (newProfile) profileId = newProfile.id;
    }

    const { data: verification, error: insertError } = await supabase
      .from("verifications")
      .insert({
        submitter_wallet: wallet_address,
        submitter_id: profileId,
        title,
        url: url || null,
        content,
        claim_summary: claim_summary || null,
        category,
        content_hash,
        status: "snapshot_locked",
        snapshot_timestamp: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError || !verification) {
      return NextResponse.json(
        { error: "Failed to create verification" },
        { status: 500 }
      );
    }

    const processUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/process/${verification.id}`;
    fetch(processUrl, { method: "POST" }).catch(() => {});

    return NextResponse.json({
      verification_id: verification.id,
      status: "snapshot_locked",
      content_hash,
    });
  } catch (err) {
    console.error("Verify route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
