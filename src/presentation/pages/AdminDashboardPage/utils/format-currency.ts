export function formatCurrency(cents: number) {
  return `R$ ${(cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
  })}`;
}
