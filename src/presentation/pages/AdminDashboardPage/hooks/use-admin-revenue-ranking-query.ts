import type { IAdminRevenueRankingDto } from "@/infra/http/services/api/modules/admin-platform-metrics.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAdminDashboardPageStore } from "../stores/admin-dashboard-page.store";

export const ADMIN_REVENUE_RANKING_QUERY_KEY = [
  "admin",
  "revenue-ranking",
] as const;

const DEFAULT_RETURN: IAdminRevenueRankingDto = {
  range: "30d",
  from: "",
  to: "",
  entries: [],
};

export default function useAdminRevenueRankingQuery() {
  const apiService = useApiService();
  const queryClient = useQueryClient();
  const { period, customFrom, customTo } = useAdminDashboardPageStore();

  const queryKey = [
    ...ADMIN_REVENUE_RANKING_QUERY_KEY,
    period,
    customFrom?.toISOString() ?? null,
    customTo?.toISOString() ?? null,
  ] as const;

  const query = useQuery({
    queryKey,
    queryFn: () =>
      apiService.modules.adminPlatformMetrics.getRevenueRanking({
        period,
        rangeStart: customFrom?.toISOString(),
        rangeEnd: customTo?.toISOString(),
      }),
  });

  const invalidateQuery = async () => {
    await queryClient.invalidateQueries({
      queryKey: ADMIN_REVENUE_RANKING_QUERY_KEY,
    });
  };

  return {
    ...query,
    data: query.data ?? DEFAULT_RETURN,
    invalidateQuery,
  };
}
