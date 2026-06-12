import { IBalanceDto } from "@/infra/http/services/api/modules/balance.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const DEFAULT_RETURN: IBalanceDto = {
  available: 0,
  retained: 0,
  totalSalesCount: 0,
  totalSalesAmount: 0,
  grossSalesAmount: 0,
  earnedFeesAmount: 0,
  refundCount: 0,
  refundAmount: 0,
  withdrawnAmount: 0,
};

export default function useAdminSellerBalancerQuery(sellerId: string) {
  const apiService = useApiService();

  const queryClient = useQueryClient();

  const QUERY_KEY = ["admin", "seller", "balance", sellerId];

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const data = await apiService.modules.balance.get(sellerId);
      return data;
    },
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
