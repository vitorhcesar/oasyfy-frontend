import type { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";
import type {
  IAdminBalanceAdjustmentDto,
  IAdminBalanceCreditResultDto,
  IAdminSellerDto,
  IAdminSellerProfileDto,
  IAdminWithdrawalControlDto,
} from "./types/admin-sellers.types";
import type {
  IAcquirerPreferenceResponseDto,
  IAdminAcquirerPreferenceDto,
} from "./types/acquirer-preference.types";

export type {
  IAdminSellerDto,
  TAdminSellerKycStatus,
  IAdminSellerProfileDto,
  IAdminBalanceAdjustmentDto,
  IAdminBalanceCreditResultDto,
  IAdminWithdrawalControlDto,
} from "./types/admin-sellers.types";

export interface IAdminSellersModule {
  listSellers(): Promise<IAdminSellerDto[]>;
  getSellerProfile(sellerId: number): Promise<IAdminSellerProfileDto>;
  listBalanceAdjustments(
    sellerId: number,
  ): Promise<IAdminBalanceAdjustmentDto[]>;
  addBalanceCredit(
    sellerId: number,
    body: { amount: number; reason?: string; idempotencyKey?: string },
  ): Promise<IAdminBalanceCreditResultDto>;
  addBalanceDebit(
    sellerId: number,
    body: { amount: number; reason?: string; idempotencyKey?: string },
  ): Promise<IAdminBalanceCreditResultDto>;
  blockWithdrawals(
    sellerId: number,
    body: { reason: string },
  ): Promise<IAdminWithdrawalControlDto>;
  unblockWithdrawals(sellerId: number): Promise<IAdminWithdrawalControlDto>;
  getSellerAcquirerPreference(
    sellerId: number,
  ): Promise<IAcquirerPreferenceResponseDto>;
  updateSellerAcquirerPreference(
    sellerId: number,
    acquirerId: number | null,
    reason?: string | null,
  ): Promise<IAcquirerPreferenceResponseDto>;
  getPlatformAcquirerPreference(): Promise<IAdminAcquirerPreferenceDto>;
  updatePlatformDefaultAcquirer(
    defaultAcquirerId: number | null,
  ): Promise<IAdminAcquirerPreferenceDto>;
  deleteSeller(sellerId: number): Promise<{ sellerId: number }>;
}

export class AdminSellersModule
  extends BaseApiModule
  implements IAdminSellersModule
{
  private readonly baseUrl = "/api/v1/admin/sellers";
  private readonly preferenceUrl = "/api/v1/admin/acquirer-preference";

  async listSellers(): Promise<IAdminSellerDto[]> {
    const response = await this.getClient().get<
      IApiEnvelope<IAdminSellerDto[]>
    >(this.baseUrl);
    return response.data;
  }

  async getSellerProfile(sellerId: number): Promise<IAdminSellerProfileDto> {
    const response = await this.getClient().get<
      IApiEnvelope<IAdminSellerProfileDto>
    >(`${this.baseUrl}/${sellerId}/profile`);
    return response.data;
  }

  async listBalanceAdjustments(
    sellerId: number,
  ): Promise<IAdminBalanceAdjustmentDto[]> {
    const response = await this.getClient().get<
      IApiEnvelope<IAdminBalanceAdjustmentDto[]>
    >(`${this.baseUrl}/${sellerId}/balance/adjustments`);
    return response.data;
  }

  async addBalanceCredit(
    sellerId: number,
    body: { amount: number; reason?: string; idempotencyKey?: string },
  ): Promise<IAdminBalanceCreditResultDto> {
    const response = await this.getClient().post<
      IApiEnvelope<IAdminBalanceCreditResultDto>
    >(`${this.baseUrl}/${sellerId}/balance/credits`, body);
    return response.data;
  }

  async addBalanceDebit(
    sellerId: number,
    body: { amount: number; reason?: string; idempotencyKey?: string },
  ): Promise<IAdminBalanceCreditResultDto> {
    const response = await this.getClient().post<
      IApiEnvelope<IAdminBalanceCreditResultDto>
    >(`${this.baseUrl}/${sellerId}/balance/debits`, body);
    return response.data;
  }

  async blockWithdrawals(
    sellerId: number,
    body: { reason: string },
  ): Promise<IAdminWithdrawalControlDto> {
    const response = await this.getClient().post<
      IApiEnvelope<IAdminWithdrawalControlDto>
    >(`${this.baseUrl}/${sellerId}/withdrawals/block`, body);
    return response.data;
  }

  async unblockWithdrawals(
    sellerId: number,
  ): Promise<IAdminWithdrawalControlDto> {
    const response = await this.getClient().post<
      IApiEnvelope<IAdminWithdrawalControlDto>
    >(`${this.baseUrl}/${sellerId}/withdrawals/unblock`, {});
    return response.data;
  }

  async getSellerAcquirerPreference(
    sellerId: number,
  ): Promise<IAcquirerPreferenceResponseDto> {
    const response = await this.getClient().get<
      IApiEnvelope<IAcquirerPreferenceResponseDto>
    >(`${this.baseUrl}/${sellerId}/acquirer-preference`);
    return response.data;
  }

  async updateSellerAcquirerPreference(
    sellerId: number,
    acquirerId: number | null,
    reason?: string | null,
  ): Promise<IAcquirerPreferenceResponseDto> {
    const response = await this.getClient().put<
      IApiEnvelope<IAcquirerPreferenceResponseDto>
    >(`${this.baseUrl}/${sellerId}/acquirer-preference`, {
      acquirerId,
      reason: reason ?? null,
    });
    return response.data;
  }

  async getPlatformAcquirerPreference(): Promise<IAdminAcquirerPreferenceDto> {
    const response = await this.getClient().get<
      IApiEnvelope<IAdminAcquirerPreferenceDto>
    >(this.preferenceUrl);
    return response.data;
  }

  async updatePlatformDefaultAcquirer(
    defaultAcquirerId: number | null,
  ): Promise<IAdminAcquirerPreferenceDto> {
    const response = await this.getClient().put<
      IApiEnvelope<IAdminAcquirerPreferenceDto>
    >(`${this.preferenceUrl}/default`, { defaultAcquirerId });
    return response.data;
  }

  async deleteSeller(sellerId: number): Promise<{ sellerId: number }> {
    const response = await this.getClient().delete<
      IApiEnvelope<{ sellerId: number }>
    >(`${this.baseUrl}/${sellerId}`);
    return response.data;
  }
}
