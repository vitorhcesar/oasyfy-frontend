import {
  ISellerStatsQueryDto,
  ISellerStatsResponseDto,
} from "@/infra/http/services/api/modules/seller.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const DEFAULT_RETURN: ISellerStatsResponseDto = {
  availableBalance: 0,
  totalPending: 0,
  retainedBalance: 0,
  netProfit: 0,
  transactionsCount: 0,
  averageTicket: 0,
  conversionRate: 0,
  completedTransactionsCount: 0,
};

export default function useSellerStatsQuery(data?: ISellerStatsQueryDto) {
  const { rangeStart, rangeEnd } = data ?? {};

  const apiService = useApiService();
  const queryClient = useQueryClient();

  const queryKey = [
    "seller-stats",
    rangeStart?.toISOString() ?? null,
    rangeEnd?.toISOString() ?? null,
  ] as const;

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      return apiService.modules.seller.getSellerStats({
        rangeStart,
        rangeEnd,
      });
    },
  });

  const invalidateQuery = async () => {
    await queryClient.invalidateQueries({ queryKey: ["seller-stats"] });
  };

  return {
    ...query,
    data: query.data ?? DEFAULT_RETURN,
    invalidateQuery,
  };
}
