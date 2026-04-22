import { createClient } from "@supabase/supabase-js";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
const BLOCK_MINUTES = 30;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action = "signup" } = await req.json();

    // Get IP from headers
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Cleanup old entries
    await supabase.rpc("cleanup_old_rate_limits");

    // Check current rate limit status
    const { data: existing } = await supabase
      .from("rate_limits")
      .select("*")
      .eq("ip_address", ip)
      .eq("action", action)
      .maybeSingle();

    // If blocked, check if block has expired
    if (existing?.blocked_until) {
      const blockedUntil = new Date(existing.blocked_until);
      if (blockedUntil > new Date()) {
        const remainingMs = blockedUntil.getTime() - Date.now();
        const remainingMin = Math.ceil(remainingMs / 60000);
        return new Response(
          JSON.stringify({
            allowed: false,
            message: `IP bloqueado. Tente novamente em ${remainingMin} minuto(s).`,
            blocked_until: existing.blocked_until,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Block expired, reset
      await supabase
        .from("rate_limits")
        .update({ attempts: 1, blocked_until: null, first_attempt_at: new Date().toISOString(), last_attempt_at: new Date().toISOString() })
        .eq("id", existing.id);

      return new Response(
        JSON.stringify({ allowed: true, attempts: 1, remaining: MAX_ATTEMPTS - 1 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!existing) {
      // First attempt
      await supabase.from("rate_limits").insert({ ip_address: ip, action, attempts: 1 });
      return new Response(
        JSON.stringify({ allowed: true, attempts: 1, remaining: MAX_ATTEMPTS - 1 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if within the window
    const firstAttempt = new Date(existing.first_attempt_at);
    const windowExpired = (Date.now() - firstAttempt.getTime()) > WINDOW_MINUTES * 60 * 1000;

    if (windowExpired) {
      // Reset window
      await supabase
        .from("rate_limits")
        .update({ attempts: 1, first_attempt_at: new Date().toISOString(), last_attempt_at: new Date().toISOString() })
        .eq("id", existing.id);

      return new Response(
        JSON.stringify({ allowed: true, attempts: 1, remaining: MAX_ATTEMPTS - 1 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newAttempts = existing.attempts + 1;

    if (newAttempts > MAX_ATTEMPTS) {
      // Block the IP
      const blockedUntil = new Date(Date.now() + BLOCK_MINUTES * 60 * 1000).toISOString();
      await supabase
        .from("rate_limits")
        .update({ attempts: newAttempts, blocked_until: blockedUntil, last_attempt_at: new Date().toISOString() })
        .eq("id", existing.id);

      return new Response(
        JSON.stringify({
          allowed: false,
          message: `Muitas tentativas. IP bloqueado por ${BLOCK_MINUTES} minutos.`,
          blocked_until: blockedUntil,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Increment attempts
    await supabase
      .from("rate_limits")
      .update({ attempts: newAttempts, last_attempt_at: new Date().toISOString() })
      .eq("id", existing.id);

    return new Response(
      JSON.stringify({ allowed: true, attempts: newAttempts, remaining: MAX_ATTEMPTS - newAttempts }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ allowed: true, error: "Rate limit check failed" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
