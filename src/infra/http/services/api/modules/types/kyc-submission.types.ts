import type { IKycSubmissionBankData } from "@/domain/types/kyc-submission-bank-data.type";
import { KycStatusEnum } from "@/domain/enums/kyc-status.enum";
import { KycSubmissionSectionStatusEnum } from "@/domain/enums/kyc-submission-section-status.enum";
import { PersonTypeEnum } from "@/domain/enums/person-type.enum";

export interface IKycSubmissionDocumentsDto {
  documentFrontUrl: string | null;
  documentBackUrl: string | null;
  selfieUrl: string | null;
  proofOfAddressUrl: string | null;
  companyContractUrl: string | null;
}

/** Alinhado ao enum Prisma `KycStatus` + `none` quando não existe envio */
export type TSellerDashboardKycStatus =
  | "none"
  | "pending"
  | "under_review"
  | "approved"
  | "rejected";

export type TSellerKycDocReviewEntry = {
  status: string;
  reason?: string;
};

export type TSellerKycDocumentsReview = Record<
  string,
  TSellerKycDocReviewEntry
>;

export interface IKycSubmissionDto {
  id: number;
  userId: number;
  status: KycStatusEnum;
  personType: PersonTypeEnum;
  fullName: string;
  cpf: string | null;
  dateOfBirth: Date | null;
  phone: string | null;
  companyName: string | null;
  companyType: string | null;
  cnpj: string | null;
  tradingName: string | null;
  businessActivity: string | null;
  monthlyRevenue: string | null;
  zipCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  bankData: IKycSubmissionBankData | null;
  rejectionReason: string | null;
  documentsStatus: KycSubmissionSectionStatusEnum;
  bankStatus: KycSubmissionSectionStatusEnum;
  addressStatus: KycSubmissionSectionStatusEnum;
  documentsReview: TSellerKycDocumentsReview;
  email: string | null;
  isBanned: boolean;
  withdrawalsBlocked: boolean;
  withdrawalBlockReason: string | null;
  reviewedAt: Date | null;
  reviewedBy: number | null;
  createdAt: Date;
  updatedAt: Date;
  documents: IKycSubmissionDocumentsDto | null;
}

export interface ISellerKycSubmissionResponseDto {
  submission: IKycSubmissionDto | null;
  documentsApproved: boolean;
  canSell: boolean;
  canWithdraw: boolean;
  fullyApproved: boolean;
}

/** Corpo do POST `/api/v1/seller/kyc-submission` (multipart/form-data). */
export interface ISubmitSellerKycBody {
  personType: "pf" | "pj";
  cpf: string | null;
  companyName: string | null;
  companyType: string | null;
  cnpj: string | null;
  tradingName: string | null;
  businessActivity: string | null;
  monthlyRevenue: string | null;
}

export interface ISubmitSellerKycFiles {
  documentFront: File;
  documentBack: File;
  selfie: File;
  companyContract?: File;
}

export interface ISubmitSellerKycParams {
  body: ISubmitSellerKycBody;
  files: ISubmitSellerKycFiles;
}

export interface ISubmitSellerKycWithdrawalDetailsBody {
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  bank: {
    bankName: string;
    agency: string;
    agencyDigit?: string;
    account: string;
    accountDigit?: string;
    accountType: "corrente" | "poupanca";
    pixKeyType: "cpf" | "cnpj" | "email" | "phone";
    pixKey: string;
  };
}
