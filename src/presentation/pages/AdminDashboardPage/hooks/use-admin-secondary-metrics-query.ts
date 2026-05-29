import type { IAdminSecondaryMetricsResponseDto } from "@/infra/http/services/api/modules/admin-platform-metrics.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAdminDashboardPageStore } from "../stores/admin-dashboard-page.store";

const DEFAULT_RETURN: IAdminSecondaryMetricsResponseDto = {
  averageTicket: 0,
  refundRate: 0,
  completedTransactionsCount: 0,
  transactionsCountChange: 0,
  feeMarginRate: 0,
};

export default function useAdminSecondaryMetricsQuery() {
  const apiService = useApiService();
  const queryClient = useQueryClient();
  const { period, customFrom, customTo } = useAdminDashboardPageStore();

  const queryKey = [
    "admin",
    "secondary-metrics",
    period,
    customFrom?.toISOString() ?? null,
    customTo?.toISOString() ?? null,
  ] as const;

  const query = useQuery({
    queryKey,
    queryFn: () =>
      apiService.modules.adminPlatformMetrics.getSecondaryMetrics({
        period,
        rangeStart: customFrom?.toISOString(),
        rangeEnd: customTo?.toISOString(),
      }),
  });

  const invalidateQuery = async () => {
    await queryClient.invalidateQueries({ queryKey });
  };

  return {
    ...query,
    data: query.data ?? DEFAULT_RETURN,
    invalidateQuery,
  };
}
