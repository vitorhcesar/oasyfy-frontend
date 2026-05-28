import type { IApiEnvelope } from "../api-types";
import type { IPlatformMetricsResponseDto } from "./admin-platform-metrics.types";
import { BaseApiModule } from "./base-api.module";

export type {
  IPlatformMetricsResponseDto,
  IPlatformMetricsTransactionDto,
  ISellerProfileSummaryDto,
} from "./admin-platform-metrics.types";

export interface IAdminPlatformMetricsModule {
  getPlatformMetrics(): Promise<IPlatformMetricsResponseDto>;
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
}
