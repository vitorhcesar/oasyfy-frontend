function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isSplitCreditMetadata(
  meta: Record<string, unknown> | null | undefined,
): boolean {
  return meta?.type === "split_credit";
}

export function hasSaleSplitMetadata(
  meta: Record<string, unknown> | null | undefined,
): boolean {
  return getSaleSplitDetails(meta) !== null;
}

export type TSaleSplitBreakdownItem = {
  accountId: string;
  amount: number;
  percentage: number | null;
  fixedAmount: number | null;
  description: string | null;
};

export type TSaleSplitDetails = {
  sellerAmount: number | null;
  sellerPercentage: number | null;
  partnerAmount: number;
  baseAmount: number | null;
  base: string | null;
  breakdown: TSaleSplitBreakdownItem[];
  settledAt: string | null;
  skipped: Array<{ accountId: string; reason: string }>;
  source: string | null;
};

export function getSaleSplitDetails(
  meta: Record<string, unknown> | null | undefined,
): TSaleSplitDetails | null {
  if (!meta || isSplitCreditMetadata(meta) || !isRecord(meta.split)) {
    return null;
  }

  const split = meta.split;
  const rawBreakdown = Array.isArray(split.breakdown) ? split.breakdown : [];
  const breakdown: TSaleSplitBreakdownItem[] = [];

  for (const raw of rawBreakdown) {
    if (!isRecord(raw) || typeof raw.account_id !== "string") continue;
    if (typeof raw.amount !== "number") continue;
    breakdown.push({
      accountId: raw.account_id,
      amount: raw.amount,
      percentage: typeof raw.percentage === "number" ? raw.percentage : null,
      fixedAmount:
        typeof raw.fixed_amount === "number" ? raw.fixed_amount : null,
      description:
        typeof raw.description === "string" ? raw.description : null,
    });
  }

  if (breakdown.length === 0) return null;

  const skippedRaw = Array.isArray(meta.split_settle_skipped)
    ? meta.split_settle_skipped
    : [];
  const skipped: Array<{ accountId: string; reason: string }> = [];
  for (const raw of skippedRaw) {
    if (!isRecord(raw) || typeof raw.account_id !== "string") continue;
    skipped.push({
      accountId: raw.account_id,
      reason: typeof raw.reason === "string" ? raw.reason : "Não liquidado",
    });
  }

  return {
    sellerAmount:
      typeof split.seller_amount === "number" ? split.seller_amount : null,
    sellerPercentage:
      typeof split.seller_percentage === "number"
        ? split.seller_percentage
        : null,
    partnerAmount: breakdown.reduce((sum, item) => sum + item.amount, 0),
    baseAmount:
      typeof split.base_amount === "number" ? split.base_amount : null,
    base: typeof split.base === "string" ? split.base : null,
    breakdown,
    settledAt:
      typeof meta.split_settled_at === "string" ? meta.split_settled_at : null,
    skipped,
    source: typeof meta.split_source === "string" ? meta.split_source : null,
  };
}
