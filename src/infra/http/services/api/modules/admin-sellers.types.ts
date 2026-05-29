export type TAdminSellerKycStatus =
  | "sem_kyc"
  | "pending"
  | "under_review"
  | "approved"
  | "rejected";

export interface IAdminSellerDto {
  userId: number;
  fullName: string | null;
  createdAt: string | null;
  kycStatus: TAdminSellerKycStatus;
}
