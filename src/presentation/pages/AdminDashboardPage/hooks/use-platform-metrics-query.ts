import type { IPlatformMetricsResponseDto } from "@/infra/http/services/api/modules/admin-platform-metrics.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const DEFAULT_RETURN: IPlatformMetricsResponseDto = {
  sellersCount: 0,
  pendingKycCount: 0,
  approvedKycCount: 0,
  rejectedKycCount: 0,
  bannedSellersCount: 0,
  pendingWithdrawalsCount: 0,
  pendingRefundsCount: 0,
  transactions: [],
  sellerProfiles: [],
};

const QUERY_KEY = ["admin", "platform-metrics"];

export default function usePlatformMetricsQuery() {
  const apiService = useApiService();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiService.modules.adminPlatformMetrics.getPlatformMetrics(),
  });

  const invalidateQuery = async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  };

  return {
    ...query,
    data: query.data ?? DEFAULT_RETURN,
    invalidateQuery,
  };
}
