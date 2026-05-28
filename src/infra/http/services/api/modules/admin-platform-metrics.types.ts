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
