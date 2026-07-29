import type { IApiEnvelope } from "@/infra/http/services/api/api-types";
import { BaseApiModule } from "./base-api.module";
import { mapSellerKycSubmissionResponse } from "./types/kyc-submission.mapper";
import type {
  IKycSubmissionDocumentsDto,
  IKycSubmissionDto,
  ISellerKycSubmissionResponseDto,
  ISubmitSellerKycBody,
  ISubmitSellerKycFiles,
  ISubmitSellerKycParams,
  ISubmitSellerKycWithdrawalDetailsBody,
  TSellerDashboardKycStatus,
  TSellerKycDocReviewEntry,
  TSellerKycDocumentsReview,
} from "./types/kyc-submission.types";

export type {
  IKycSubmissionDocumentsDto,
  IKycSubmissionDto,
  ISellerKycSubmissionResponseDto,
  ISubmitSellerKycBody,
  ISubmitSellerKycFiles,
  ISubmitSellerKycParams,
  ISubmitSellerKycWithdrawalDetailsBody,
  TSellerDashboardKycStatus,
  TSellerKycDocReviewEntry,
  TSellerKycDocumentsReview,
};

export interface IKycSubmissionModule {
  getSellerSubmission: () => Promise<ISellerKycSubmissionResponseDto>;
  submitSellerSubmission: (
    params: ISubmitSellerKycParams,
  ) => Promise<ISellerKycSubmissionResponseDto>;
  submitWithdrawalDetails: (
    body: ISubmitSellerKycWithdrawalDetailsBody,
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
    return mapSellerKycSubmissionResponse(response.data);
  }

  async submitSellerSubmission(
    params: ISubmitSellerKycParams,
  ): Promise<ISellerKycSubmissionResponseDto> {
    const formData = new FormData();
    const { body, files } = params;

    formData.append("personType", body.personType);
    formData.append("cpf", body.cpf ?? "");
    formData.append("companyName", body.companyName ?? "");
    formData.append("companyType", body.companyType ?? "");
    formData.append("cnpj", body.cnpj ?? "");
    formData.append("tradingName", body.tradingName ?? "");
    formData.append("businessActivity", body.businessActivity ?? "");
    formData.append("monthlyRevenue", body.monthlyRevenue ?? "");
    formData.append("documentFront", files.documentFront);
    formData.append("documentBack", files.documentBack);
    formData.append("selfie", files.selfie);

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

    return mapSellerKycSubmissionResponse(response.data.data);
  }

  async submitWithdrawalDetails(
    body: ISubmitSellerKycWithdrawalDetailsBody,
  ): Promise<ISellerKycSubmissionResponseDto> {
    const response = await this.getClient().post<
      IApiEnvelope<ISellerKycSubmissionResponseDto>
    >(`${this.baseUrl}/withdrawal-details`, body);
    return mapSellerKycSubmissionResponse(response.data);
  }
}
