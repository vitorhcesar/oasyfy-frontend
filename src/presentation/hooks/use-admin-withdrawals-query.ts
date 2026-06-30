import type { mapAdminWithdrawalToView } from "@/infra/http/services/api/modules/admin-finance.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export type TAdminWithdrawalView = ReturnType<typeof mapAdminWithdrawalToView>;

const DEFAULT_RETURN: TAdminWithdrawalView[] = [];
const QUERY_KEY = ["admin", "withdrawals"] as const;

export default function useAdminWithdrawalsQuery() {
  const apiService = useApiService();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiService.modules.adminFinance.listWithdrawals(),
  });

  const invalidateQuery = async () => {
    await queryClient.invalidateQueries({ queryKey: [...QUERY_KEY] });
  };

  return {
    ...query,
    data: query.data ?? DEFAULT_RETURN,
    invalidateQuery,
  };
}
