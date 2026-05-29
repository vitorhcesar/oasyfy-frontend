import { formatCurrency } from "./format-currency";

export function formatCompact(cents: number) {
  const val = cents / 100;
  if (val >= 1_000_000) return `R$ ${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `R$ ${(val / 1_000).toFixed(1)}k`;
  return formatCurrency(cents);
}
