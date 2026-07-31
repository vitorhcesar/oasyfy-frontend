import type { IPlatformAvailableBalanceResponseDto } from "@/infra/http/services/api/modules/admin-platform-metrics.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const DEFAULT_RETURN: IPlatformAvailableBalanceResponseDto = {
  totalAvailable: 0,
  totalRetained: 0,
  totalWithdrawn: 0,
  totalRefunded: 0,
};

export default function usePlatformAvailableBalanceQuery() {
  const apiService = useApiService();
  const queryClient = useQueryClient();

  const queryKey = ["admin", "platform-available-balance"] as const;

  const query = useQuery({
    queryKey,
    queryFn: () =>
      apiService.modules.adminPlatformMetrics.getPlatformAvailableBalance(),
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
