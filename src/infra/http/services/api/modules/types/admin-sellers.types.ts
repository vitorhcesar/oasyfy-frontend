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
