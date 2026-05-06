import type { IApiEnvelope } from "@/infra/http/api-types";
import type { IHttpClient } from "@/infra/http/http-client";

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

export interface IKycSubmissionSummaryDto {
  id: string;
  status: Exclude<TSellerDashboardKycStatus, "none">;
  rejectionReason: string | null;
  documentsStatus: string;
  bankStatus: string;
  addressStatus: string;
  documentsReview: TSellerKycDocumentsReview;
}

export interface ISellerKycSubmissionResponseDto {
  submission: IKycSubmissionSummaryDto | null;
  fullyApproved: boolean;
}

export interface IKycSubmissionModule {
  getSellerSubmission: () => Promise<ISellerKycSubmissionResponseDto>;
}

export class KycSubmissionModule implements IKycSubmissionModule {
  constructor(private readonly httpClient: IHttpClient) {}

  async getSellerSubmission(): Promise<ISellerKycSubmissionResponseDto> {
    const body =
      await this.httpClient.get<IApiEnvelope<ISellerKycSubmissionResponseDto>>(
        "/api/v1/seller/kyc-submission"
      );
    return body.data;
  }
}
