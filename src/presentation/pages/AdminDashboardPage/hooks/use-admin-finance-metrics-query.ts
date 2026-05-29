import type { IAdminFinanceMetricsResponseDto } from "@/infra/http/services/api/modules/admin-platform-metrics.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAdminDashboardPageStore } from "../stores/admin-dashboard-page.store";

const DEFAULT_RETURN: IAdminFinanceMetricsResponseDto = {
  totalVolume: 0,
  volumeChange: 0,
  totalFees: 0,
  feesChange: 0,
  totalNet: 0,
  conversionRate: 0,
  completedTransactionsCount: 0,
  filteredTransactionsCount: 0,
  withdrawalVolume: 0,
};

export default function useAdminFinanceMetricsQuery() {
  const apiService = useApiService();
  const queryClient = useQueryClient();
  const { period, customFrom, customTo } = useAdminDashboardPageStore();

  const queryKey = [
    "admin",
    "finance-metrics",
    period,
    customFrom?.toISOString() ?? null,
    customTo?.toISOString() ?? null,
  ] as const;

  const query = useQuery({
    queryKey,
    queryFn: () =>
      apiService.modules.adminPlatformMetrics.getFinanceMetrics({
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
