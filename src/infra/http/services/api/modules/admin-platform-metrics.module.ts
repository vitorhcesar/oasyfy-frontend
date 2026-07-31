import type { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";
import type {
  IAdminFinanceMetricsQueryDto,
  IAdminFinanceMetricsResponseDto,
  IAdminSecondaryMetricsResponseDto,
  IPlatformAvailableBalanceResponseDto,
  IPlatformMetricsResponseDto,
} from "./types/admin-platform-metrics.types";

export type {
  IAdminFinanceMetricsQueryDto,
  IAdminFinanceMetricsResponseDto,
  IAdminSecondaryMetricsResponseDto,
  IPlatformAvailableBalanceResponseDto,
  IPlatformMetricsResponseDto,
  IPlatformMetricsTransactionDto,
  ISellerProfileSummaryDto,
} from "./types/admin-platform-metrics.types";

export interface IAdminPlatformMetricsModule {
  getPlatformMetrics(): Promise<IPlatformMetricsResponseDto>;
  getFinanceMetrics(
    query: IAdminFinanceMetricsQueryDto,
  ): Promise<IAdminFinanceMetricsResponseDto>;
  getSecondaryMetrics(
    query: IAdminFinanceMetricsQueryDto,
  ): Promise<IAdminSecondaryMetricsResponseDto>;
  getPlatformAvailableBalance(): Promise<IPlatformAvailableBalanceResponseDto>;
}

export class AdminPlatformMetricsModule
  extends BaseApiModule
  implements IAdminPlatformMetricsModule
{
  private readonly baseUrl = "/api/v1/admin/metrics/platform";

  async getPlatformMetrics(): Promise<IPlatformMetricsResponseDto> {
    const response = await this.getClient().get<
      IApiEnvelope<IPlatformMetricsResponseDto>
    >(this.baseUrl);
    return response.data;
  }

  async getFinanceMetrics(
    query: IAdminFinanceMetricsQueryDto,
  ): Promise<IAdminFinanceMetricsResponseDto> {
    const response = await this.getClient().get<
      IApiEnvelope<IAdminFinanceMetricsResponseDto>
    >("/api/v1/admin/metrics/finance", { params: query });
    return response.data;
  }

  async getSecondaryMetrics(
    query: IAdminFinanceMetricsQueryDto,
  ): Promise<IAdminSecondaryMetricsResponseDto> {
    const response = await this.getClient().get<
      IApiEnvelope<IAdminSecondaryMetricsResponseDto>
    >("/api/v1/admin/metrics/secondary", { params: query });
    return response.data;
  }

  async getPlatformAvailableBalance(): Promise<IPlatformAvailableBalanceResponseDto> {
    const response = await this.getClient().get<
      IApiEnvelope<IPlatformAvailableBalanceResponseDto>
    >("/api/v1/admin/metrics/platform-balances");
    return response.data;
  }
}
