export type TWithdrawalBalanceTab = "card" | "pix_boleto";

export function resolveWithdrawalModalBalance(input: {
  showCardBalanceTab: boolean;
  tab: TWithdrawalBalanceTab;
  availableBalance: number;
  cardBalance: number;
  pixBoletoBalance: number;
}): number {
  if (!input.showCardBalanceTab) {
    return Math.max(0, input.availableBalance);
  }

  const bucket =
    input.tab === "card" ? input.cardBalance : input.pixBoletoBalance;
  return Math.max(0, bucket);
}
