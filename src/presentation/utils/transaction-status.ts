export function isApprovedTransactionStatus(status: string): boolean {
  return status === "paid" || status === "completed";
}

export function matchesTransactionStatusFilter(
  status: string,
  filter: string,
): boolean {
  if (!filter || filter === "all") return true;
  if (filter === "completed") {
    return isApprovedTransactionStatus(status);
  }
  return status === filter;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** PIX/depósito não pago (QR expirado) — o backend persiste como `failed`. */
export function isExpiredUnpaidTransaction(tx: {
  status: string;
  method?: string;
  metadata?: Record<string, unknown> | null;
}): boolean {
  if (tx.status === "expired") return true;
  if (tx.status !== "failed") return false;
  if (tx.method === "withdrawal") return false;

  const meta = tx.metadata;
  if (isRecord(meta)) {
    if (meta.origin === "seller_deposit") return true;

    const webhook = meta.woovi_last_webhook;
    if (isRecord(webhook) && webhook.event === "OPENPIX:CHARGE_EXPIRED") {
      return true;
    }

    const cartwave = meta.cartwave_last_webhook;
    if (isRecord(cartwave)) {
      const data = isRecord(cartwave.data) ? cartwave.data : null;
      const rawStatus =
        typeof data?.status === "string" ? data.status.trim().toLowerCase() : "";
      if (rawStatus === "expired") return true;
    }
  }

  return tx.method === "pix";
}
