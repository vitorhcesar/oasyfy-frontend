export type TAdminKycListFilter =
  | "all"
  | "registered"
  | "pending"
  | "approved"
  | "rejected";

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
  bankData: Record<string, unknown> | null;
  addressStatus: string;
  bankStatus: string;
  documentsStatus: string;
  rejectionReason: string | null;
  isBanned: boolean;
  withdrawalsBlocked: boolean;
  withdrawalBlockReason: string | null;
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
