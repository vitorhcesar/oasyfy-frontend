import type { IApiEnvelope } from "@/infra/http/api-types";
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

export interface IKycSubmissionSummaryDto {
  id: number;
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

export class KycSubmissionModule
  extends BaseApiModule
  implements IKycSubmissionModule
{
  async getSellerSubmission(): Promise<ISellerKycSubmissionResponseDto> {
    const response = await this.getClient().get<
      IApiEnvelope<ISellerKycSubmissionResponseDto>
    >("/api/v1/seller/kyc-submission");
    return response.data;
  }
}
