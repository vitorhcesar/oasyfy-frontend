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

/** Corpo do POST `/api/v1/seller/kyc-submission` (multipart/form-data). */
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

export interface ISubmitSellerKycFiles {
  documentFront: File;
  documentBack: File;
  selfie: File;
  proofOfAddress: File;
  companyContract?: File;
}

export interface ISubmitSellerKycParams {
  body: ISubmitSellerKycBody;
  files: ISubmitSellerKycFiles;
}

export interface IKycSubmissionModule {
  getSellerSubmission: () => Promise<ISellerKycSubmissionResponseDto>;
  submitSellerSubmission: (
    params: ISubmitSellerKycParams
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
    params: ISubmitSellerKycParams
  ): Promise<ISellerKycSubmissionResponseDto> {
    const formData = new FormData();
    const { body, files } = params;

    formData.append("personType", body.personType);
    formData.append("fullName", body.fullName);
    formData.append("cpf", body.cpf ?? "");
    formData.append("dateOfBirth", body.dateOfBirth ?? "");
    formData.append("phone", body.phone);
    formData.append("companyName", body.companyName ?? "");
    formData.append("companyType", body.companyType ?? "");
    formData.append("cnpj", body.cnpj ?? "");
    formData.append("tradingName", body.tradingName ?? "");
    formData.append("businessActivity", body.businessActivity ?? "");
    formData.append("monthlyRevenue", body.monthlyRevenue ?? "");
    formData.append("zipCode", body.zipCode);
    formData.append("street", body.street);
    formData.append("number", body.number);
    formData.append("complement", body.complement ?? "");
    formData.append("neighborhood", body.neighborhood);
    formData.append("city", body.city);
    formData.append("state", body.state);
    formData.append("bank", JSON.stringify(body.bank));
    formData.append("documentFront", files.documentFront);
    formData.append("documentBack", files.documentBack);
    formData.append("selfie", files.selfie);
    formData.append("proofOfAddress", files.proofOfAddress);

    if (files.companyContract) {
      formData.append("companyContract", files.companyContract);
    }

    const response = await this.getClient().rawRequest<
      IApiEnvelope<ISellerKycSubmissionResponseDto>
    >({
      method: "POST",
      url: this.baseUrl,
      data: formData,
      headers: {
        Accept: "application/json",
      },
      transformRequest: [
        (data, headers) => {
          if (data instanceof FormData && headers) {
            delete headers["Content-Type"];
          }
          return data;
        },
      ],
    });

    return response.data.data;
  }
}
