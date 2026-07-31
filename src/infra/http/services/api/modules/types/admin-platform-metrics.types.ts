export interface IPlatformMetricsTransactionDto {
  id: number;
  amount: number;
  feeAmount: number;
  netAmount: number;
  status: string;
  method: string;
  createdAt: string;
  sellerId: number | null;
  customerName: string;
}

export interface ISellerProfileSummaryDto {
  userId: number;
  fullName: string | null;
}

export interface IPlatformMetricsResponseDto {
  sellersCount: number;
  pendingKycCount: number;
  approvedKycCount: number;
  rejectedKycCount: number;
  bannedSellersCount: number;
  pendingWithdrawalsCount: number;
  pendingRefundsCount: number;
  transactions: IPlatformMetricsTransactionDto[];
  sellerProfiles: ISellerProfileSummaryDto[];
}

export interface IAdminFinanceMetricsQueryDto {
  period: "7d" | "30d" | "90d" | "custom";
  rangeStart?: string;
  rangeEnd?: string;
}

export interface IAdminFinanceMetricsResponseDto {
  totalVolume: number;
  volumeChange: number;
  totalFees: number;
  feesChange: number;
  totalNet: number;
  conversionRate: number;
  completedTransactionsCount: number;
  filteredTransactionsCount: number;
  withdrawalVolume: number;
}

export interface IAdminSecondaryMetricsResponseDto {
  averageTicket: number;
  refundRate: number;
  completedTransactionsCount: number;
  transactionsCountChange: number;
  feeMarginRate: number;
}

export interface IPlatformAvailableBalanceResponseDto {
  totalAvailable: number;
  totalRetained: number;
  totalWithdrawn: number;
  totalRefunded: number;
}
