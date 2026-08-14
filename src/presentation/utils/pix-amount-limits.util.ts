function formatBRLFromCents(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export function resolvePixMinAmountCents(
  pixMinAmount: number | null | undefined,
) {
  if (typeof pixMinAmount === "number" && pixMinAmount > 0) {
    return pixMinAmount * 100;
  }
  return 100;
}

export function resolvePixMaxAmountCents(
  pixMaxAmount: number | null | undefined,
) {
  if (typeof pixMaxAmount === "number" && pixMaxAmount > 0) {
    return pixMaxAmount * 100;
  }
  return null;
}

export function getPixAmountLimitError(
  amountCents: number,
  pixMinAmount: number | null | undefined,
  pixMaxAmount: number | null | undefined,
): string | null {
  const minCents = resolvePixMinAmountCents(pixMinAmount);
  const maxCents = resolvePixMaxAmountCents(pixMaxAmount);

  if (amountCents < minCents) {
    return `Valor mínimo: ${formatBRLFromCents(minCents)}`;
  }
  if (maxCents != null && amountCents > maxCents) {
    return `Valor máximo: ${formatBRLFromCents(maxCents)}`;
  }
  return null;
}

export function describePixAmountLimits(
  pixMinAmount: number | null | undefined,
  pixMaxAmount: number | null | undefined,
) {
  const minCents = resolvePixMinAmountCents(pixMinAmount);
  const maxCents = resolvePixMaxAmountCents(pixMaxAmount);
  if (maxCents == null) {
    return `Valor mínimo: ${formatBRLFromCents(minCents)}.`;
  }
  return `Valor entre ${formatBRLFromCents(minCents)} e ${formatBRLFromCents(maxCents)}.`;
}
