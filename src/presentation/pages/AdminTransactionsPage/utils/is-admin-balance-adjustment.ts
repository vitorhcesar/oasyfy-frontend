export function isAdminBalanceAdjustment(tx: {
  customer_name?: string | null;
  metadata?: Record<string, unknown> | null;
}): boolean {
  const meta = tx.metadata;
  if (
    meta &&
    (meta.admin_credit === true ||
      meta.admin_debit === true ||
      meta.admin_adjustment === true)
  ) {
    return true;
  }
  return tx.customer_name === "Ajuste administrativo";
}
