export function isApprovedTransactionStatus(status: string): boolean {
  return status === "paid" || status === "completed";
}

export type TTransactionStatusView = {
  status: string;
  method?: string;
  metadata?: Record<string, unknown> | null;
  pix_code?: string | null;
  pixCode?: string | null;
};

export function matchesTransactionStatusFilter(
  tx: TTransactionStatusView,
  filter: string,
): boolean {
  if (!filter || filter === "all") return true;
  const displayed = displayedTransactionStatus(tx);
  if (filter === "completed") {
    return isApprovedTransactionStatus(displayed);
  }
  return displayed === filter;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasGeneratedPixCode(tx: TTransactionStatusView): boolean {
  const code = tx.pix_code ?? tx.pixCode;
  return typeof code === "string" && code.trim().length > 0;
}

/** PIX gerado e não pago (QR expirado). O backend persiste isso como `failed`. */
export function isExpiredUnpaidTransaction(tx: TTransactionStatusView): boolean {
  if (tx.status === "expired") return true;
  if (tx.status !== "failed") return false;
  if (tx.method === "withdrawal") return false;

  const meta = tx.metadata;
  if (isRecord(meta) && meta.pix_generation_failed === true) return false;

  if (hasGeneratedPixCode(tx)) return true;

  if (isRecord(meta)) {
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

  return false;
}

/** Status exibido na UI: PIX expirado/não pago aparece como `pending`. */
export function displayedTransactionStatus(tx: TTransactionStatusView): string {
  if (isExpiredUnpaidTransaction(tx)) return "pending";
  return tx.status;
}
