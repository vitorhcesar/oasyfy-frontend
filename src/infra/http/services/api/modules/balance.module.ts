import { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";

export interface IBalanceDto {
  available: number;
  retained: number;
  totalSalesCount: number;
  totalSalesAmount: number;
  grossSalesAmount: number;
  earnedFeesAmount: number;
  refundCount: number;
  refundAmount: number;
  withdrawnAmount: number;
}

export interface IBalanceModule {
  get: (sellerId?: string) => Promise<IBalanceDto>;
}

export class BalanceModule extends BaseApiModule implements IBalanceModule {
  private readonly baseUrl = "/api/v1/balance";

  async get(sellerId?: string): Promise<IBalanceDto> {
    const response = await this.getClient().get<IApiEnvelope<IBalanceDto>>(
      this.baseUrl,
      sellerId ? { params: { sellerId } } : undefined,
    );
    return response.data;
  }
}
