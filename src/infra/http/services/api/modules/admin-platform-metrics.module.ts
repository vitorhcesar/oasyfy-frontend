import type { IApiEnvelope } from "../api-types";
import type {
  IAdminFinanceMetricsQueryDto,
  IAdminFinanceMetricsResponseDto,
  IPlatformMetricsResponseDto,
} from "./admin-platform-metrics.types";
import { BaseApiModule } from "./base-api.module";

export type {
  IAdminFinanceMetricsQueryDto,
  IAdminFinanceMetricsResponseDto,
  IPlatformMetricsResponseDto,
  IPlatformMetricsTransactionDto,
  ISellerProfileSummaryDto,
} from "./admin-platform-metrics.types";

export interface IAdminPlatformMetricsModule {
  getPlatformMetrics(): Promise<IPlatformMetricsResponseDto>;
  getFinanceMetrics(
    query: IAdminFinanceMetricsQueryDto,
  ): Promise<IAdminFinanceMetricsResponseDto>;
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
}
