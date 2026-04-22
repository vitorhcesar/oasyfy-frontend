import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function computeHmacSha512(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonRes(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface AcquirerConnection {
  id: string;
  name: string;
  api_url: string;
  client_id: string | null;
  access_token: string | null;
  hmac_key: string | null;
  branch_id: string | null;
  account_number: string | null;
  is_active: boolean;
  methods?: string[] | null;
}

interface RoutingRule {
  id: string;
  method: string;
  acquirer_id: string;
  priority: number;
  is_active: boolean;
}

const normalizeMethod = (value: string | null | undefined) => value?.trim().toLowerCase() ?? "";

function hasPixMethod(acquirer: AcquirerConnection) {
  return (acquirer.methods ?? []).some((method) => normalizeMethod(method) === "pix");
}

function hasRequiredCredentials(acquirer: AcquirerConnection, action: string) {
  const hasApiCredentials = Boolean(acquirer.client_id && acquirer.access_token && acquirer.hmac_key);
  if (!hasApiCredentials) return false;

  if (action === "create-pix") {
    return Boolean(acquirer.branch_id && acquirer.account_number);
  }

  return true;
}

function handledError(message: string, details?: Record<string, unknown>) {
  return jsonRes({ error: message, fallback: true, ...details }, 200);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return jsonRes({ error: "Configuração do backend ausente" }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonRes({ error: "Não autorizado" }, 401);

    const token = authHeader.replace("Bearer ", "").trim();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) return jsonRes({ error: "Token inválido" }, 401);

    const [{ data: hasAdmin }, { data: hasSeller }] = await Promise.all([
      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      supabase.rpc("has_role", { _user_id: user.id, _role: "seller" }),
    ]);

    if (!hasAdmin && !hasSeller) return jsonRes({ error: "Permissão negada" }, 403);

    let body: Record<string, unknown> = {};
    if (req.method !== "GET") {
      try {
        body = await req.json();
      } catch {
        return jsonRes({ error: "JSON inválido" }, 400);
      }
    }

    const { action, ...params } = body;
    if (!action || typeof action !== "string") {
      return jsonRes({ error: "Ação obrigatória" }, 400);
    }

    let endpoint = "";
    let method = "POST";

    switch (action) {
      case "create-pix":
        endpoint = "/v2/finance/create-pix-copy-and-paste";
        break;
      case "check-pix-status": {
        const qrCodeId = typeof params.qr_code_id === "string" ? params.qr_code_id : "";
        if (!qrCodeId) return jsonRes({ error: "qr_code_id é obrigatório" }, 400);
        endpoint = `/v2/finance/qrcode/${qrCodeId}`;
        method = "GET";
        break;
      }
      default:
        return jsonRes({ error: `Ação desconhecida: ${action}` }, 400);
    }

    const { data: allRules, error: rulesError } = await supabase
      .from("gateway_routing_rules")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: true });

    if (rulesError) {
      console.error("Erro ao buscar regras:", rulesError);
      return handledError("Erro ao carregar roteamento");
    }

    const rules = ((allRules ?? []) as RoutingRule[]).filter(
      (rule) => normalizeMethod(rule.method) === "pix"
    );

    let orderedAcquirers: AcquirerConnection[] = [];
    let routingStrategy = "routing_rules";

    if (rules.length > 0) {
      const acquirerIds = [...new Set(rules.map((rule) => rule.acquirer_id))];
      const { data: acquirers, error: acqError } = await supabase
        .from("acquirer_connections")
        .select("*")
        .in("id", acquirerIds)
        .eq("is_active", true)
        .eq("status", "connected");

      if (acqError) {
        console.error("Erro ao buscar adquirentes do roteamento:", acqError);
        return handledError("Erro ao carregar adquirentes");
      }

      orderedAcquirers = rules
        .map((rule) => (acquirers ?? []).find((acquirer) => acquirer.id === rule.acquirer_id) as AcquirerConnection | undefined)
        .filter((acquirer): acquirer is AcquirerConnection => Boolean(acquirer && hasPixMethod(acquirer) && hasRequiredCredentials(acquirer, action)));
    }

    if (orderedAcquirers.length === 0) {
      routingStrategy = "active_acquirers_fallback";

      const { data: fallbackAcquirers, error: fallbackError } = await supabase
        .from("acquirer_connections")
        .select("*")
        .eq("is_active", true)
        .eq("status", "connected")
        .order("name", { ascending: true });

      if (fallbackError) {
        console.error("Erro ao buscar adquirentes ativas:", fallbackError);
        return handledError("Erro ao carregar adquirentes");
      }

      orderedAcquirers = ((fallbackAcquirers ?? []) as AcquirerConnection[]).filter(
        (acquirer) => hasPixMethod(acquirer) && hasRequiredCredentials(acquirer, action)
      );
    }

    if (orderedAcquirers.length === 0) {
      return handledError("Nenhuma adquirente PIX ativa e configurada", {
        attempts: [],
        strategy: routingStrategy,
      });
    }

    const errors: { acquirer: string; status: number; details: unknown }[] = [];

    for (const acq of orderedAcquirers) {
      try {
        const accessToken = acq.access_token;
        const hmacKey = acq.hmac_key;

        if (!hasRequiredCredentials(acq, action)) {
          errors.push({ acquirer: acq.name, status: 0, details: "Credenciais ausentes" });
          continue;
        }

        const fetchOptions: RequestInit = {
          method,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "ci": acq.client_id || "",
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        };

        if (method === "POST") {
          const amountValue = typeof params.amount === "number" ? params.amount / 100 : 0;
          const payload: Record<string, unknown> = {
            amount: amountValue,
            debtor_name: params.debtor_name,
            type_fine: params.type_fine ?? "NONE",
            fine: params.fine ?? 0,
            source_account_branch_identifier: acq.branch_id,
            source_account_number: acq.account_number,
            base_64_image: params.base_64_image ?? true,
          };

          if (params.debtor_document) payload.debtor_document = params.debtor_document;
          if (params.type_document) payload.type_document = params.type_document;

          const bodyStr = JSON.stringify(payload);

          // Generate HMAC-SHA512 signature from payload
          const hmacSignature = await computeHmacSha512(hmacKey as string, bodyStr);

          console.log(`HMAC gerado para ${acq.name}, body length: ${bodyStr.length}, hmac length: ${hmacSignature.length}`);

          fetchOptions.headers = {
            ...fetchOptions.headers,
            hmac: hmacSignature,
          };
          fetchOptions.body = bodyStr;
        }

        const apiUrl = acq.api_url || "https://api.cartwavehub.com.br";
        const response = await fetch(`${apiUrl}${endpoint}`, fetchOptions);
        const rawText = await response.text();

        let data: unknown = null;
        try {
          data = rawText ? JSON.parse(rawText) : null;
        } catch {
          data = { raw: rawText };
        }

        if (response.ok) {
          console.log(`PIX gerado com sucesso via ${acq.name}`);
          return jsonRes({
            ...((data && typeof data === "object") ? data : { data }),
            _routing: {
              acquirer: acq.name,
              acquirer_id: acq.id,
              failover_attempts: errors.length,
              strategy: routingStrategy,
            },
          });
        }

        console.warn(`Falha na ${acq.name}: ${response.status}`, data);
        errors.push({ acquirer: acq.name, status: response.status, details: data });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro de conexão";
        console.error(`Erro de conexão com ${acq.name}:`, msg);
        errors.push({ acquirer: acq.name, status: 0, details: msg });
      }
    }

    return handledError("Todas as adquirentes falharam ao gerar PIX", {
      attempts: errors,
      strategy: routingStrategy,
    });
  } catch (error) {
    console.error("PIX failover error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return handledError(message);
  }
});
