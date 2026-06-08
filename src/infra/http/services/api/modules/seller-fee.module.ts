import { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";

export interface IGetSellerFeesResponseDto {
  id: number;
  pixRetentionDays: number;
  cardRetentionDays: number;
  boletoRetentionDays: number;
  cryptoRetentionDays: number;
}

export interface IGetFullSellerFeesResponseDto {
  id: number;
  pixFixedFee: number;
  pixVariableFee: number;
  pixMinFee: number;
  pixRetentionFee: number;
  pixRetentionDays: number;
  cardFixedFee: number;
  cardVariableFee: number;
  cardMinFee: number;
  cardRetentionFee: number;
  cardRetentionDays: number;
  boletoFixedFee: number;
  boletoVariableFee: number;
  boletoMinFee: number;
  boletoRetentionFee: number;
  boletoRetentionDays: number;
  cryptoFixedFee: number;
  cryptoVariableFee: number;
  cryptoMinFee: number;
  cryptoRetentionFee: number;
  cryptoRetentionDays: number;
  withdrawalFixedFee: number;
  withdrawalVariableFee: number;
  withdrawalMinFee: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISellerFeeModule {
  getSellerFees(): Promise<IGetSellerFeesResponseDto>;
  getFullSellerFees(): Promise<IGetFullSellerFeesResponseDto>;
}

export class SellerFeeModule extends BaseApiModule implements ISellerFeeModule {
  private readonly baseUrl = "/api/v1/seller-fees";

  async getSellerFees(): Promise<IGetSellerFeesResponseDto> {
    const response = await this.getClient().get<
      IApiEnvelope<IGetSellerFeesResponseDto>
    >(this.baseUrl);
    return response.data;
  }

  async getFullSellerFees(): Promise<IGetFullSellerFeesResponseDto> {
    const response = await this.getClient().get<
      IApiEnvelope<IGetFullSellerFeesResponseDto>
    >(`${this.baseUrl}/full`);
    return response.data;
  }
}
