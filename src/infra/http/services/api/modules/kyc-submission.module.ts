import type { IApiEnvelope } from "@/infra/http/services/api/api-types";
import { mapSellerKycSubmissionResponse } from "./kyc-submission.mapper";
import type {
  IKycSubmissionDto,
  IKycSubmissionDocumentsDto,
  ISellerKycSubmissionResponseDto,
  ISubmitSellerKycBody,
  ISubmitSellerKycFiles,
  ISubmitSellerKycParams,
  TSellerDashboardKycStatus,
  TSellerKycDocumentsReview,
  TSellerKycDocReviewEntry,
} from "./kyc-submission.types";
import { BaseApiModule } from "./base-api.module";

export type {
  IKycSubmissionDto,
  IKycSubmissionDocumentsDto,
  ISellerKycSubmissionResponseDto,
  ISubmitSellerKycBody,
  ISubmitSellerKycFiles,
  ISubmitSellerKycParams,
  TSellerDashboardKycStatus,
  TSellerKycDocumentsReview,
  TSellerKycDocReviewEntry,
};

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
    return mapSellerKycSubmissionResponse(response.data);
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

    return mapSellerKycSubmissionResponse(response.data.data);
  }
}
