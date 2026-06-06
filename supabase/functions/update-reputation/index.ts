import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { wallet_address, delta, reason, verification_id } = await req.json();

    if (!wallet_address || !delta || !reason) {
      return new Response(
        JSON.stringify({ error: "wallet_address, delta, and reason required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase.rpc("update_profile_reputation", {
      p_wallet: wallet_address,
      p_delta: delta,
      p_reason: reason,
      p_verification_id: verification_id ?? null,
    });

    const { data: profile } = await supabase
      .from("profiles")
      .select("reputation_score, reputation_tier")
      .eq("wallet_address", wallet_address)
      .single();

    return new Response(
      JSON.stringify({ success: true, profile }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
