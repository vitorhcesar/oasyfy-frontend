import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { pix_code } = await req.json();

    if (!pix_code || typeof pix_code !== "string" || pix_code.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Código PIX inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const search = pix_code.trim();

    // Search by pix_code column (exact or partial match)
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .or(`pix_code.ilike.%${search}%,metadata->>pix_code.ilike.%${search}%,metadata->>end2end.ilike.%${search}%,metadata->>e2e_id.ilike.%${search}%`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Search error:", error);
      return new Response(JSON.stringify({ error: "Erro ao buscar transações" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ transactions: data ?? [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
