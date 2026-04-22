import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // --- Extract API key ---
  const apiKey =
    req.headers.get("x-api-key") ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!apiKey || !apiKey.startsWith("sk_live_OAS_")) {
    return jsonResponse({ error: "API key inválida ou ausente" }, 401);
  }

  // --- Validate API key ---
  const { data: keyData, error: keyError } = await supabaseAdmin
    .from("api_keys")
    .select("*")
    .eq("api_key", apiKey)
    .eq("is_active", true)
    .single();

  if (keyError || !keyData) {
    return jsonResponse({ error: "API key inválida ou desativada" }, 401);
  }

  const sellerId = keyData.seller_id;
  const permissions: string[] = keyData.permissions || [];

  // --- Check IP whitelist ---
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const { data: authorizedIps } = await supabaseAdmin
    .from("authorized_ips")
    .select("ip_address")
    .eq("seller_id", sellerId);

  if (authorizedIps && authorizedIps.length > 0) {
    const allowed = authorizedIps.some((ip) => ip.ip_address === clientIp);
    if (!allowed) {
      return jsonResponse(
        { error: "IP não autorizado", ip: clientIp },
        403
      );
    }
  }

  // --- Route parsing ---
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  // Path: /api-gateway/{route}
  const route = pathParts[pathParts.length - 1] || "";

  // --- Permission check ---
  const routePermissionMap: Record<string, string> = {
    consulta: "consulta",
    venda: "venda",
    pix: "venda",
    saque: "saque",
    rastreio: "rastreio",
    reembolso: "venda",
    lock: "venda",
  };

  const requiredPermission = routePermissionMap[route];
  if (!requiredPermission) {
    return jsonResponse(
      {
        error: "Rota não encontrada",
        rotas_disponiveis: ["/consulta", "/venda", "/pix", "/saque", "/rastreio", "/reembolso", "/lock"],
      },
      404
    );
  }

  if (!permissions.includes(requiredPermission)) {
    return jsonResponse(
      { error: `Permissão '${requiredPermission}' não habilitada nesta chave` },
      403
    );
  }

  // --- Parse body for POST/PUT ---
  let body: Record<string, unknown> = {};
  if (req.method === "POST" || req.method === "PUT") {
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Body JSON inválido" }, 400);
    }
  }

  // --- Route handlers ---
  try {
    switch (route) {
      case "consulta":
        return await handleConsulta(supabaseAdmin, sellerId, url, body);
      case "venda":
        return await handleVenda(supabaseAdmin, sellerId, body);
      case "pix":
        return await handleGerarPix(supabaseAdmin, sellerId, body);
      case "saque":
        return await handleSaque(supabaseAdmin, sellerId, body);
      case "rastreio":
        return await handleRastreio(supabaseAdmin, sellerId, url, body);
      case "reembolso":
        return await handleReembolso(supabaseAdmin, sellerId, body);
      case "lock":
        return await handleLock(supabaseAdmin, sellerId, body);
      default:
        return jsonResponse({ error: "Rota não encontrada" }, 404);
    }
  } catch (err) {
    console.error("Gateway error:", err);
    return jsonResponse({ error: "Erro interno do gateway" }, 500);
  }
});

// ===================== CONSULTA =====================
async function handleConsulta(
  supabase: ReturnType<typeof createClient>,
  sellerId: string,
  url: URL,
  body: Record<string, unknown>
) {
  const transactionId =
    url.searchParams.get("transaction_id") || (body.transaction_id as string);
  const status = url.searchParams.get("status") || (body.status as string);
  const method = url.searchParams.get("method") || (body.method as string);
  const limit = parseInt(
    url.searchParams.get("limit") || (body.limit as string) || "50"
  );
  const offset = parseInt(
    url.searchParams.get("offset") || (body.offset as string) || "0"
  );

  // Single transaction lookup
  if (transactionId) {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .eq("seller_id", sellerId)
      .single();

    if (error || !data) {
      return jsonResponse({ error: "Transação não encontrada" }, 404);
    }
    return jsonResponse({ transaction: data });
  }

  // List transactions
  let query = supabase
    .from("transactions")
    .select("*", { count: "exact" })
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (method) query = query.eq("method", method);

  const { data, error, count } = await query;

  if (error) {
    return jsonResponse({ error: "Erro ao consultar transações" }, 500);
  }

  return jsonResponse({
    transactions: data,
    total: count,
    limit,
    offset,
  });
}

// ===================== SPLIT HELPER =====================
interface SplitItem {
  account_id: string;
  percentage?: number;
  fixed_amount?: number;
  description?: string;
  charge_processing_fee?: boolean;
}

function validateSplit(split: SplitItem[], totalAmount: number) {
  if (!Array.isArray(split)) return { error: "split deve ser um array" };
  
  let totalPercentage = 0;
  let totalFixed = 0;

  for (const item of split) {
    if (!item.account_id) return { error: "Cada split deve ter account_id" };
    if (!item.percentage && !item.fixed_amount) return { error: "Cada split deve ter percentage ou fixed_amount" };
    
    if (item.percentage !== undefined) {
      if (typeof item.percentage !== "number" || item.percentage <= 0 || item.percentage > 100) {
        return { error: `Percentual inválido: ${item.percentage}. Use 0.000001 a 100` };
      }
      totalPercentage += item.percentage;
    }
    if (item.fixed_amount !== undefined) {
      if (typeof item.fixed_amount !== "number" || item.fixed_amount <= 0) {
        return { error: "fixed_amount deve ser positivo em centavos" };
      }
      totalFixed += item.fixed_amount;
    }
  }

  if (totalPercentage > 100) return { error: `Soma dos percentuais (${totalPercentage}%) excede 100%` };
  if (totalFixed > totalAmount) return { error: "Soma dos valores fixos excede o valor total" };

  return { valid: true };
}

function calculateSplitBreakdown(split: SplitItem[], totalAmount: number) {
  let remaining = totalAmount;
  const breakdown: any[] = [];

  // Fixed amounts first
  for (const item of split) {
    if (item.fixed_amount) {
      const amount = Math.min(item.fixed_amount, remaining);
      remaining -= amount;
      breakdown.push({
        account_id: item.account_id,
        fixed_amount: item.fixed_amount,
        amount,
        description: item.description || null,
        charge_processing_fee: item.charge_processing_fee || false,
      });
    }
  }

  // Then percentages on remaining
  let totalSplitAmount = breakdown.reduce((s, b) => s + b.amount, 0);
  for (const item of split) {
    if (item.percentage) {
      const amount = Math.round(totalAmount * item.percentage / 100);
      totalSplitAmount += amount;
      breakdown.push({
        account_id: item.account_id,
        percentage: item.percentage,
        amount,
        description: item.description || null,
        charge_processing_fee: item.charge_processing_fee || false,
      });
    }
  }

  const sellerAmount = totalAmount - totalSplitAmount;
  const sellerPercentage = parseFloat(((sellerAmount / totalAmount) * 100).toFixed(6));

  return {
    total_splits: breakdown.length,
    breakdown,
    seller_amount: sellerAmount,
    seller_percentage: sellerPercentage,
  };
}

// ===================== VENDA =====================
async function handleVenda(
  supabase: ReturnType<typeof createClient>,
  sellerId: string,
  body: Record<string, unknown>
) {
  const { customer_name, customer_email, amount, method, description, metadata, split } =
    body as {
      customer_name?: string;
      customer_email?: string;
      amount?: number;
      method?: string;
      description?: string;
      metadata?: Record<string, unknown>;
      split?: SplitItem[];
    };

  if (!customer_name || !amount || !method) {
    return jsonResponse(
      {
        error: "Campos obrigatórios: customer_name, amount, method",
        methods_aceitos: ["pix", "card", "boleto", "crypto"],
      },
      400
    );
  }

  if (!["pix", "card", "boleto", "crypto"].includes(method)) {
    return jsonResponse(
      { error: "Método inválido. Use: pix, card, boleto, crypto" },
      400
    );
  }

  if (typeof amount !== "number" || amount <= 0) {
    return jsonResponse({ error: "Valor (amount) deve ser positivo em centavos" }, 400);
  }

  // Validate split
  let splitDetails = null;
  if (split && split.length > 0) {
    const validation = validateSplit(split, amount);
    if ('error' in validation) return jsonResponse({ error: validation.error }, 400);
    splitDetails = calculateSplitBreakdown(split, amount);
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      seller_id: sellerId,
      customer_name,
      customer_email: customer_email || null,
      amount,
      method,
      description: description || null,
      metadata: {
        ...(metadata || {}),
        ...(splitDetails ? { split: splitDetails } : {}),
      },
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Venda error:", error);
    return jsonResponse({ error: "Erro ao criar transação" }, 500);
  }

  const response: any = {
    message: "Transação criada com sucesso",
    transaction: data,
  };
  if (splitDetails) response.split_details = splitDetails;

  return jsonResponse(response, 201);
}

// ===================== PIX (Gerar) =====================
async function handleGerarPix(
  supabase: ReturnType<typeof createClient>,
  sellerId: string,
  body: Record<string, unknown>
) {
  const { customer_name, customer_email, amount, description, metadata, split, pix_code } = body as {
    customer_name?: string;
    customer_email?: string;
    amount?: number;
    description?: string;
    metadata?: Record<string, unknown>;
    split?: SplitItem[];
    pix_code?: string;
  };

  if (!customer_name || !amount) {
    return jsonResponse(
      { error: "Campos obrigatórios: customer_name, amount (em centavos)" },
      400
    );
  }

  if (typeof amount !== "number" || amount <= 0) {
    return jsonResponse({ error: "Valor deve ser positivo em centavos" }, 400);
  }

  // Validate split
  let splitDetails = null;
  if (split && split.length > 0) {
    const validation = validateSplit(split, amount);
    if ('error' in validation) return jsonResponse({ error: validation.error }, 400);
    splitDetails = calculateSplitBreakdown(split, amount);
  }

  // Create PIX transaction
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      seller_id: sellerId,
      customer_name,
      customer_email: customer_email || null,
      amount,
      method: "pix",
      description: description || null,
      pix_code: pix_code || null,
      metadata: {
        ...(metadata || {}),
        pix_generated: true,
        pix_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        ...(splitDetails ? { split: splitDetails } : {}),
      },
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("PIX error:", error);
    return jsonResponse({ error: "Erro ao gerar PIX" }, 500);
  }

  const response: any = {
    message: "PIX gerado com sucesso",
    transaction: data,
    pix: {
      transaction_id: data.id,
      amount: data.amount,
      pix_code: data.pix_code || null,
      expiration: (data.metadata as any)?.pix_expiration,
      status: "awaiting_payment",
    },
  };
  if (splitDetails) response.split_details = splitDetails;

  return jsonResponse(response, 201);
}

// ===================== SAQUE =====================
async function handleSaque(
  supabase: ReturnType<typeof createClient>,
  sellerId: string,
  body: Record<string, unknown>
) {
  const { amount, description } = body as {
    amount?: number;
    description?: string;
  };

  if (!amount || typeof amount !== "number" || amount <= 0) {
    return jsonResponse(
      { error: "Campo obrigatório: amount (valor em centavos, positivo)" },
      400
    );
  }

  // Check if seller is not blocked for withdrawals
  const { data: kyc } = await supabase
    .from("kyc_submissions")
    .select("status, withdrawals_blocked")
    .eq("user_id", sellerId)
    .single();

  if (!kyc || kyc.status !== "approved") {
    return jsonResponse(
      { error: "KYC não aprovado. Saques indisponíveis." },
      403
    );
  }

  if (kyc.withdrawals_blocked) {
    return jsonResponse(
      { error: "Saques bloqueados para esta conta." },
      403
    );
  }

  // Create withdrawal transaction
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      seller_id: sellerId,
      customer_name: "Saque",
      amount: -amount, // Negative for withdrawal
      method: "withdrawal",
      description: description || "Saque via API",
      status: "pending",
      metadata: { type: "withdrawal", requested_via: "api" },
    })
    .select()
    .single();

  if (error) {
    console.error("Saque error:", error);
    return jsonResponse({ error: "Erro ao solicitar saque" }, 500);
  }

  return jsonResponse({
    message: "Saque solicitado com sucesso",
    withdrawal: {
      id: data.id,
      amount,
      status: "pending",
      created_at: data.created_at,
    },
  }, 201);
}

// ===================== RASTREIO =====================
async function handleRastreio(
  supabase: ReturnType<typeof createClient>,
  sellerId: string,
  url: URL,
  body: Record<string, unknown>
) {
  const transactionId =
    url.searchParams.get("transaction_id") || (body.transaction_id as string);

  if (!transactionId) {
    return jsonResponse(
      { error: "Campo obrigatório: transaction_id" },
      400
    );
  }

  const { data: transaction, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", transactionId)
    .eq("seller_id", sellerId)
    .single();

  if (error || !transaction) {
    return jsonResponse({ error: "Transação não encontrada" }, 404);
  }

  return jsonResponse({
    tracking: {
      transaction_id: transaction.id,
      status: transaction.status,
      method: transaction.method,
      amount: transaction.amount,
      customer_name: transaction.customer_name,
      created_at: transaction.created_at,
      updated_at: transaction.updated_at,
      metadata: transaction.metadata,
    },
  });
}

// ===================== REEMBOLSO =====================
async function handleReembolso(
  supabase: ReturnType<typeof createClient>,
  sellerId: string,
  body: Record<string, unknown>
) {
  const { transaction_id, reason, fake } = body as {
    transaction_id?: string;
    reason?: string;
    fake?: boolean;
  };

  if (!transaction_id || !reason) {
    return jsonResponse({ error: "Campos obrigatórios: transaction_id, reason" }, 400);
  }

  const { data: tx, error: txErr } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", transaction_id)
    .eq("seller_id", sellerId)
    .single();

  if (txErr || !tx) {
    return jsonResponse({ error: "Transação não encontrada" }, 404);
  }

  if (tx.status === "refunded") {
    return jsonResponse({ error: "Transação já foi reembolsada" }, 400);
  }

  if (tx.is_locked) {
    return jsonResponse({ error: "Transação está travada. Destrave antes de reembolsar." }, 403);
  }

  const { error } = await supabase
    .from("transactions")
    .update({
      status: "refunded",
      refund_reason: reason,
      is_fake_refund: !!fake,
      updated_at: new Date().toISOString(),
    })
    .eq("id", transaction_id);

  if (error) {
    return jsonResponse({ error: "Erro ao processar reembolso" }, 500);
  }

  // Create refund request record
  await supabase.from("refund_requests").insert({
    transaction_id,
    seller_id: sellerId,
    amount: tx.amount,
    reason,
    status: "approved",
    admin_note: fake ? "Reembolso fake via API" : "Reembolso real via API",
    reviewed_at: new Date().toISOString(),
  });

  return jsonResponse({
    message: fake ? "Reembolso fake aplicado" : "Reembolso realizado",
    transaction_id,
    is_fake: !!fake,
  });
}

// ===================== LOCK/UNLOCK =====================
async function handleLock(
  supabase: ReturnType<typeof createClient>,
  sellerId: string,
  body: Record<string, unknown>
) {
  const { transaction_id, lock, reason } = body as {
    transaction_id?: string;
    lock?: boolean;
    reason?: string;
  };

  if (!transaction_id) {
    return jsonResponse({ error: "Campo obrigatório: transaction_id" }, 400);
  }

  if (lock === undefined) {
    return jsonResponse({ error: "Campo obrigatório: lock (true/false)" }, 400);
  }

  if (lock && !reason) {
    return jsonResponse({ error: "Campo obrigatório para travar: reason" }, 400);
  }

  const { data: tx, error: txErr } = await supabase
    .from("transactions")
    .select("id, seller_id")
    .eq("id", transaction_id)
    .eq("seller_id", sellerId)
    .single();

  if (txErr || !tx) {
    return jsonResponse({ error: "Transação não encontrada" }, 404);
  }

  const { error } = await supabase
    .from("transactions")
    .update({
      is_locked: lock,
      lock_reason: lock ? reason : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", transaction_id);

  if (error) {
    return jsonResponse({ error: "Erro ao alterar status" }, 500);
  }

  return jsonResponse({
    message: lock ? "Transação travada" : "Transação destravada",
    transaction_id,
    is_locked: lock,
  });
}
