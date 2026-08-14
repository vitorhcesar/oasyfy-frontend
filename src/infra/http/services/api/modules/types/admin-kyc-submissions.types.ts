import type { IKycSubmissionBankData } from "@/domain/types/kyc-submission-bank-data.type";

export type TAdminKycListFilter =
  | "all"
  | "registered"
  | "pending"
  | "approved"
  | "rejected";

export type {
  IKycSubmissionBankData,
  TKycBankAccountType,
  TKycPixKeyType,
} from "@/domain/types/kyc-submission-bank-data.type";

export interface IAdminKycSubmissionsQueryDto {
  filter: TAdminKycListFilter;
}

export interface IAdminRegisteredSellerDto {
  userId: number;
  fullName: string | null;
  email: string | null;
  accountId: string | null;
  createdAt: string;
  emailManuallyApproved: boolean;
  emailVerified: boolean;
}

export interface IAdminKycSubmissionDto {
  id: number;
  userId: number;
  status: string;
  personType: "pf" | "pj";
  fullName: string;
  cpf: string | null;
  cnpj: string | null;
  companyName: string | null;
  companyType: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  city: string;
  state: string;
  street: string;
  number: string;
  neighborhood: string;
  zipCode: string;
  complement: string | null;
  bankData: IKycSubmissionBankData | null;
  addressStatus: string;
  bankStatus: string;
  documentsStatus: string;
  rejectionReason: string | null;
  isBanned: boolean;
  withdrawalsBlocked: boolean;
  withdrawalBlockReason: string | null;
  apiAccessEnabled: boolean;
  documentsReview: Record<string, unknown>;
  dateOfBirth: string | null;
  tradingName: string | null;
  businessActivity: string | null;
  monthlyRevenue: string | null;
  reviewedAt: string | null;
  reviewedBy: number | null;
  updatedAt: string;
  accountId: string | null;
  emailManuallyApproved: boolean;
  emailVerified: boolean;
  documentFrontUrl: string | null;
  documentBackUrl: string | null;
  selfieUrl: string | null;
  proofOfAddressUrl: string | null;
  companyContractUrl: string | null;
}

export interface IAdminKycSubmissionsResponseDto {
  submissions: IAdminKycSubmissionDto[];
  registeredOnly: IAdminRegisteredSellerDto[];
}

export interface IApproveKycSubmissionAddressResponseDto {
  autoApproved: boolean;
}

export interface IApproveKycSubmissionResponseDto {
  emailSent: boolean;
}

export interface IAutoApproveKycSubmissionIfCompleteResponseDto {
  approved: boolean;
  emailSent: boolean;
}

export interface IRejectKycSubmissionAddressBodyDto {
  reason?: string;
}

export interface IRejectKycSubmissionBodyDto {
  reason?: string;
}

export interface IToggleKycSubmissionBanResponseDto {
  isBanned: boolean;
}

export interface IBlockKycSubmissionWithdrawalsBodyDto {
  reason: string;
}

export interface IBlockKycSubmissionWithdrawalsResponseDto {
  withdrawalsBlocked: boolean;
}

export interface IUnblockKycSubmissionWithdrawalsResponseDto {
  withdrawalsBlocked: boolean;
}

export interface ISetKycSubmissionApiAccessBodyDto {
  enabled: boolean;
}

export interface ISetKycSubmissionApiAccessResponseDto {
  apiAccessEnabled: boolean;
}
