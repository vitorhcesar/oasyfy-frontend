import { KycStatusEnum } from "@/domain/enums/kyc-status.enum";
import { KycSubmissionSectionStatusEnum } from "@/domain/enums/kyc-submission-section-status.enum";
import { PersonTypeEnum } from "@/domain/enums/person-type.enum";
import type { IApiEnvelope } from "@/infra/http/services/api/api-types";
import { BaseApiModule } from "./base-api.module";

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
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  documentFrontUrl: string | null;
  documentBackUrl: string | null;
  selfieUrl: string | null;
  proofOfAddressUrl: string | null;
  companyContractUrl: string | null;
  bankData: Record<string, unknown>;
  rejectionReason: string | null;
  documentsStatus: KycSubmissionSectionStatusEnum;
  bankStatus: KycSubmissionSectionStatusEnum;
  addressStatus: KycSubmissionSectionStatusEnum;
  documentsReview: Record<string, unknown>;
  email: string | null;
  isBanned: boolean;
  withdrawalsBlocked: boolean;
  withdrawalBlockReason: string | null;
  reviewedAt: Date | null;
  reviewedBy: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISellerKycSubmissionResponseDto {
  submission: IKycSubmissionDto | null;
  fullyApproved: boolean;
}

/** Corpo do POST `/api/v1/seller/kyc-submission` (camelCase). */
export interface ISubmitSellerKycBody {
  personType: "pf" | "pj";
  fullName: string;
  cpf: string | null;
  dateOfBirth: string | null;
  phone: string;
  companyName: string | null;
  companyType: string | null;
  cnpj: string | null;
  tradingName: string | null;
  businessActivity: string | null;
  monthlyRevenue: string | null;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  documentFrontUrl: string | null;
  documentBackUrl: string | null;
  selfieUrl: string | null;
  proofOfAddressUrl: string | null;
  companyContractUrl: string | null;
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

export interface IKycSubmissionModule {
  getSellerSubmission: () => Promise<ISellerKycSubmissionResponseDto>;
  submitSellerSubmission: (
    body: ISubmitSellerKycBody
  ) => Promise<ISellerKycSubmissionResponseDto>;
}

export class KycSubmissionModule
  extends BaseApiModule
  implements IKycSubmissionModule
{
  private readonly baseUrl = "/api/v1/seller/kyc-submission";

  async getSellerSubmission(): Promise<ISellerKycSubmissionResponseDto> {
    const response = await this.getClient().get<
      IApiEnvelope<ISellerKycSubmissionResponseDto>
    >(this.baseUrl);
    return response.data;
  }

  async submitSellerSubmission(
    body: ISubmitSellerKycBody
  ): Promise<ISellerKycSubmissionResponseDto> {
    const envelope = await this.getClient().post<
      IApiEnvelope<ISellerKycSubmissionResponseDto>,
      ISubmitSellerKycBody
    >(this.baseUrl, body);
    return envelope.data;
  }
}
