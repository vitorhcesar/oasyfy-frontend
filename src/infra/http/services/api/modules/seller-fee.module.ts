import { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";

export interface IListSellerFeesResponseDto {
  id: number;
  pixRetentionDays: number;
  cardRetentionDays: number;
  boletoRetentionDays: number;
  cryptoRetentionDays: number;
}

export interface ISellerFeeModule {
  getSellerFees(): Promise<IListSellerFeesResponseDto>;
}

export class SellerFeeModule extends BaseApiModule implements ISellerFeeModule {
  private readonly baseUrl = "/api/v1/seller-fees";

  async getSellerFees(): Promise<IListSellerFeesResponseDto> {
    const response = await this.getClient().get<
      IApiEnvelope<IListSellerFeesResponseDto>
    >(this.baseUrl);
    return response.data;
  }
}
