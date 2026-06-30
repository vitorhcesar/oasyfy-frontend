import type { mapAdminTransactionToView } from "@/infra/http/services/api/modules/admin-finance.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export type TAdminTransactionView = ReturnType<typeof mapAdminTransactionToView>;

const DEFAULT_RETURN: TAdminTransactionView[] = [];
const QUERY_KEY = ["admin", "transactions"] as const;

export default function useAdminTransactionsQuery() {
  const apiService = useApiService();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiService.modules.adminFinance.listTransactions(),
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
