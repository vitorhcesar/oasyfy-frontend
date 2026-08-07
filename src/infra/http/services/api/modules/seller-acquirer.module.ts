import type { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";
import type { IAcquirerPreferenceResponseDto } from "./types/acquirer-preference.types";

export type {
  IAcquirerPreferenceResponseDto,
  IAcquirerSafeSummaryDto,
  TAcquirerPreferenceSource,
} from "./types/acquirer-preference.types";

export interface ISellerAcquirerModule {
  getPreference(): Promise<IAcquirerPreferenceResponseDto>;
  updatePreference(
    acquirerId: number | null,
  ): Promise<IAcquirerPreferenceResponseDto>;
}

export class SellerAcquirerModule
  extends BaseApiModule
  implements ISellerAcquirerModule
{
  private readonly baseUrl = "/api/v1/seller/acquirer";

  async getPreference(): Promise<IAcquirerPreferenceResponseDto> {
    const response = await this.getClient().get<
      IApiEnvelope<IAcquirerPreferenceResponseDto>
    >(`${this.baseUrl}/preference`);
    return response.data;
  }

  async updatePreference(
    acquirerId: number | null,
  ): Promise<IAcquirerPreferenceResponseDto> {
    const response = await this.getClient().put<
      IApiEnvelope<IAcquirerPreferenceResponseDto>
    >(`${this.baseUrl}/preference`, { acquirerId });
    return response.data;
  }
}
