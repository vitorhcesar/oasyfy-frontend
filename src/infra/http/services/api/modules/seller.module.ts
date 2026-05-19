import { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";

export interface ISellerStatsQueryDto {
  rangeStart?: Date;
  rangeEnd?: Date;
}

export interface ISellerStatsResponseDto {
  availableBalance: number;
  totalPending: number;
  retainedBalance: number;
  netProfit: number;
  transactionsCount: number;
  averageTicket: number;
}

export interface ISellerModule {
  getSellerStats(query: ISellerStatsQueryDto): Promise<ISellerStatsResponseDto>;
}

export class SellerModule extends BaseApiModule implements ISellerModule {
  private readonly baseUrl = "/api/v1/seller";

  async getSellerStats(
    query: ISellerStatsQueryDto
  ): Promise<ISellerStatsResponseDto> {
    const response = await this.getClient().get<
      IApiEnvelope<ISellerStatsResponseDto>
    >(`${this.baseUrl}/stats`, { params: query });
    return response.data;
  }
}
