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

export const SELLER_BALANCE_QUERY_KEY = ["seller-balance"] as const;

export default function useSellerBalanceQuery() {
  const apiService = useApiService();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: SELLER_BALANCE_QUERY_KEY,
    queryFn: async () => {
      return apiService.modules.balance.get();
    },
  });

  const invalidateQuery = async () => {
    await queryClient.invalidateQueries({ queryKey: SELLER_BALANCE_QUERY_KEY });
  };

  return {
    ...query,
    data: query.data ?? DEFAULT_RETURN,
    invalidateQuery,
  };
}
