import type { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";
import type {
  IAdminKycSubmissionsQueryDto,
  IAdminKycSubmissionsResponseDto,
  IApproveKycSubmissionAddressResponseDto,
  IApproveKycSubmissionResponseDto,
  IAutoApproveKycSubmissionIfCompleteResponseDto,
  IBlockKycSubmissionWithdrawalsBodyDto,
  IBlockKycSubmissionWithdrawalsResponseDto,
  IRejectKycSubmissionAddressBodyDto,
  IRejectKycSubmissionBodyDto,
  IToggleKycSubmissionBanResponseDto,
  IUnblockKycSubmissionWithdrawalsResponseDto,
} from "./types/admin-kyc-submissions.types";

export type {
  IAdminKycSubmissionDto,
  IAdminKycSubmissionsQueryDto,
  IAdminKycSubmissionsResponseDto,
  IAdminRegisteredSellerDto,
  IApproveKycSubmissionAddressResponseDto,
  IApproveKycSubmissionResponseDto,
  IAutoApproveKycSubmissionIfCompleteResponseDto,
  IBlockKycSubmissionWithdrawalsBodyDto,
  IBlockKycSubmissionWithdrawalsResponseDto,
  IRejectKycSubmissionAddressBodyDto,
  IRejectKycSubmissionBodyDto,
  IToggleKycSubmissionBanResponseDto,
  IUnblockKycSubmissionWithdrawalsResponseDto,
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
  toggleBan(submissionId: number): Promise<IToggleKycSubmissionBanResponseDto>;
  blockWithdrawals(
    submissionId: number,
    body: IBlockKycSubmissionWithdrawalsBodyDto,
  ): Promise<IBlockKycSubmissionWithdrawalsResponseDto>;
  unblockWithdrawals(
    submissionId: number,
  ): Promise<IUnblockKycSubmissionWithdrawalsResponseDto>;
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

  async toggleBan(
    submissionId: number,
  ): Promise<IToggleKycSubmissionBanResponseDto> {
    const response = await this.getClient().post<
      IApiEnvelope<IToggleKycSubmissionBanResponseDto>
    >(`${this.baseUrl}/${submissionId}/toggle-ban`);
    return response.data;
  }

  async blockWithdrawals(
    submissionId: number,
    body: IBlockKycSubmissionWithdrawalsBodyDto,
  ): Promise<IBlockKycSubmissionWithdrawalsResponseDto> {
    const response = await this.getClient().post<
      IApiEnvelope<IBlockKycSubmissionWithdrawalsResponseDto>
    >(`${this.baseUrl}/${submissionId}/withdrawals/block`, body);
    return response.data;
  }

  async unblockWithdrawals(
    submissionId: number,
  ): Promise<IUnblockKycSubmissionWithdrawalsResponseDto> {
    const response = await this.getClient().post<
      IApiEnvelope<IUnblockKycSubmissionWithdrawalsResponseDto>
    >(`${this.baseUrl}/${submissionId}/withdrawals/unblock`);
    return response.data;
  }
}
