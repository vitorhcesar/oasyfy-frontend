import type { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";
import type {
  IAdminKycSubmissionsQueryDto,
  IAdminKycSubmissionsResponseDto,
  IApproveKycSubmissionAddressResponseDto,
  IApproveKycSubmissionResponseDto,
  IAutoApproveKycSubmissionIfCompleteResponseDto,
  IRejectKycSubmissionAddressBodyDto,
  IRejectKycSubmissionBodyDto,
} from "./types/admin-kyc-submissions.types";

export type {
  IAdminKycSubmissionDto,
  IAdminKycSubmissionsQueryDto,
  IAdminKycSubmissionsResponseDto,
  IAdminRegisteredSellerDto,
  IApproveKycSubmissionAddressResponseDto,
  IApproveKycSubmissionResponseDto,
  IAutoApproveKycSubmissionIfCompleteResponseDto,
  IRejectKycSubmissionAddressBodyDto,
  IRejectKycSubmissionBodyDto,
  TAdminKycListFilter,
} from "./types/admin-kyc-submissions.types";

export interface IAdminKycSubmissionsModule {
  listSubmissions(
    query: IAdminKycSubmissionsQueryDto,
  ): Promise<IAdminKycSubmissionsResponseDto>;
  approve(
    submissionId: number,
  ): Promise<IApproveKycSubmissionResponseDto>;
  reject(
    submissionId: number,
    body?: IRejectKycSubmissionBodyDto,
  ): Promise<void>;
  autoApproveIfComplete(
    submissionId: number,
  ): Promise<IAutoApproveKycSubmissionIfCompleteResponseDto>;
  approveAddress(
    submissionId: number,
  ): Promise<IApproveKycSubmissionAddressResponseDto>;
  rejectAddress(
    submissionId: number,
    body?: IRejectKycSubmissionAddressBodyDto,
  ): Promise<void>;
}

export class AdminKycSubmissionsModule
  extends BaseApiModule
  implements IAdminKycSubmissionsModule
{
  private readonly baseUrl = "/api/v1/admin/kyc-submissions";

  async listSubmissions(
    query: IAdminKycSubmissionsQueryDto,
  ): Promise<IAdminKycSubmissionsResponseDto> {
    const response = await this.getClient().get<
      IApiEnvelope<IAdminKycSubmissionsResponseDto>
    >(this.baseUrl, { params: query });
    return response.data;
  }

  async approve(
    submissionId: number,
  ): Promise<IApproveKycSubmissionResponseDto> {
    const response = await this.getClient().post<
      IApiEnvelope<IApproveKycSubmissionResponseDto>
    >(`${this.baseUrl}/${submissionId}/approve`);
    return response.data;
  }

  async reject(
    submissionId: number,
    body?: IRejectKycSubmissionBodyDto,
  ): Promise<void> {
    await this.getClient().post<IApiEnvelope<{ rejected: boolean }>>(
      `${this.baseUrl}/${submissionId}/reject`,
      body ?? {},
    );
  }

  async autoApproveIfComplete(
    submissionId: number,
  ): Promise<IAutoApproveKycSubmissionIfCompleteResponseDto> {
    const response = await this.getClient().post<
      IApiEnvelope<IAutoApproveKycSubmissionIfCompleteResponseDto>
    >(`${this.baseUrl}/${submissionId}/auto-approve-if-complete`);
    return response.data;
  }

  async approveAddress(
    submissionId: number,
  ): Promise<IApproveKycSubmissionAddressResponseDto> {
    const response = await this.getClient().post<
      IApiEnvelope<IApproveKycSubmissionAddressResponseDto>
    >(`${this.baseUrl}/${submissionId}/address/approve`);
    return response.data;
  }

  async rejectAddress(
    submissionId: number,
    body?: IRejectKycSubmissionAddressBodyDto,
  ): Promise<void> {
    await this.getClient().post<IApiEnvelope<{ rejected: boolean }>>(
      `${this.baseUrl}/${submissionId}/address/reject`,
      body ?? {},
    );
  }
}
