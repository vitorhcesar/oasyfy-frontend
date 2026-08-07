export type TAdminSellerKycStatus =
  | "sem_kyc"
  | "pending"
  | "under_review"
  | "approved"
  | "rejected";

export type TAdminSellerAcquirerSource =
  | "seller"
  | "platform_default"
  | "routing"
  | "fallback";

export interface IAdminSellerAcquirerDto {
  id: number | null;
  name: string | null;
  source: TAdminSellerAcquirerSource;
  preferenceAcquirerId: number | null;
}

export interface IAdminSellerDto {
  userId: number;
  fullName: string | null;
  accountId: string;
  createdAt: string | null;
  kycStatus: TAdminSellerKycStatus;
  acquirer: IAdminSellerAcquirerDto;
}

export interface IAdminSellerProfileDto {
  seller: {
    id: number;
    fullName: string | null;
    email: string | null;
    accountId: string;
    createdAt: string | null;
  };
  kyc: {
    submissionId: number;
    status: string;
  } | null;
  balance: {
    available: number;
    retained: number;
    withdrawn: number;
    refunded: number;
    totalSalesCount: number;
    totalSalesAmount: number;
    grossSalesAmount: number;
    earnedFeesAmount: number;
    refundCount: number;
    refundAmount: number;
  };
  withdrawal: {
    blocked: boolean;
    reason: string | null;
    blockedAt: string | null;
    blockedBy: { id: number; name: string | null } | null;
  };
  recentAdjustments: Array<{
    id: number;
    amount: number;
    reason: string;
    balanceBefore: number;
    balanceAfter: number;
    adminUserId: number;
    createdAt: string;
  }>;
}

export interface IAdminBalanceAdjustmentDto {
  id: number;
  transactionId: number;
  sellerId: number;
  adminUserId: number;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reason: string;
  idempotencyKey: string | null;
  createdAt: string;
}

export interface IAdminBalanceCreditResultDto {
  adjustment: {
    id: number;
    transactionId: number;
    amount: number;
    reason: string;
    balanceBefore: number;
    balanceAfter: number;
    createdAt: string;
  };
  balanceBefore: number;
  balanceAfter: number;
  duplicated: boolean;
}

export interface IAdminWithdrawalControlDto {
  blocked: boolean;
  reason: string | null;
  blockedAt: string | null;
  blockedBy: { id: number; name: string | null } | null;
  transitioned?: boolean;
}
