import { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";

export interface IApproveSellerAndNotifyBodyDto {
  userId: number;
  sellerEmail: string;
  sellerName?: string | null;
}

export interface IApproveSellerAndNotifyResponseDto {
  userId: number;
  sent: boolean;
  to: string;
}

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
  approveAndNotify(
    body: IApproveSellerAndNotifyBodyDto,
  ): Promise<IApproveSellerAndNotifyResponseDto>;
  getSellerStats(query: ISellerStatsQueryDto): Promise<ISellerStatsResponseDto>;
}

export class SellerModule extends BaseApiModule implements ISellerModule {
  private readonly baseUrl = "/api/v1/seller";

  async approveAndNotify(
    body: IApproveSellerAndNotifyBodyDto,
  ): Promise<IApproveSellerAndNotifyResponseDto> {
    const response = await this.getClient().post<
      IApiEnvelope<IApproveSellerAndNotifyResponseDto>
    >(`${this.baseUrl}/approve-and-notify`, body);
    return response.data;
  }

  async getSellerStats(
    query: ISellerStatsQueryDto,
  ): Promise<ISellerStatsResponseDto> {
    const response = await this.getClient().get<
      IApiEnvelope<ISellerStatsResponseDto>
    >(`${this.baseUrl}/stats`, { params: query });
    return response.data;
  }
}
