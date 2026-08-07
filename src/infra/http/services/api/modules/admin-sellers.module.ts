import type { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";
import type { IAdminSellerDto } from "./types/admin-sellers.types";
import type {
  IAcquirerPreferenceResponseDto,
  IAdminAcquirerPreferenceDto,
} from "./types/acquirer-preference.types";

export type {
  IAdminSellerDto,
  TAdminSellerKycStatus,
} from "./types/admin-sellers.types";

export interface IAdminSellersModule {
  listSellers(): Promise<IAdminSellerDto[]>;
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
}
