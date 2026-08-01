import type { ISellerRevenueRankingDto } from "@/infra/http/services/api/modules/seller-portal.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useSellerDashboardStore } from "../stores/seller-dashboard.store";

export const SELLER_REVENUE_RANKING_QUERY_KEY = [
  "seller-revenue-ranking",
] as const;

export default function useSellerRevenueRankingQuery() {
  const apiService = useApiService();
  const queryClient = useQueryClient();
  const { timeRange, dateRange } = useSellerDashboardStore();

  const queryParams = useMemo(() => {
    if (timeRange === "custom") {
      return {
        range: "custom" as const,
        rangeStart: dateRange?.from?.toISOString(),
        rangeEnd: dateRange?.to?.toISOString(),
      };
    }
    return { range: timeRange };
  }, [timeRange, dateRange]);

  const queryKey = [
    ...SELLER_REVENUE_RANKING_QUERY_KEY,
    queryParams.range,
    queryParams.rangeStart ?? null,
    queryParams.rangeEnd ?? null,
  ] as const;

  const query = useQuery({
    queryKey,
    queryFn: () =>
      apiService.modules.sellerPortal.getRevenueRanking(queryParams),
    enabled:
      timeRange !== "custom" ||
      Boolean(dateRange?.from),
  });

  const invalidateQuery = async () => {
    await queryClient.invalidateQueries({
      queryKey: SELLER_REVENUE_RANKING_QUERY_KEY,
    });
  };

  return {
    ...query,
    data: query.data as ISellerRevenueRankingDto | undefined,
    invalidateQuery,
  };
}
