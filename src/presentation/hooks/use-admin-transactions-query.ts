import type { IListAdminTransactionsParams } from "@/infra/http/services/api/modules/admin-finance.module";
import type { mapAdminTransactionToView } from "@/infra/http/services/api/modules/admin-finance.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";

export type TAdminTransactionView = ReturnType<typeof mapAdminTransactionToView>;

const DEFAULT_ITEMS: TAdminTransactionView[] = [];
const QUERY_KEY = ["admin", "transactions"] as const;

const EMPTY_STATS = {
  paid: { count: 0, amount: 0 },
  pending: { count: 0, amount: 0 },
  failed: { count: 0, amount: 0 },
  chargeback: { count: 0, amount: 0 },
  refunded: { count: 0, amount: 0 },
};

export default function useAdminTransactionsQuery(
  params: IListAdminTransactionsParams = {},
) {
  const apiService = useApiService();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...QUERY_KEY, params],
    queryFn: () => apiService.modules.adminFinance.listTransactions(params),
    placeholderData: keepPreviousData,
  });

  const invalidateQuery = async () => {
    await queryClient.invalidateQueries({ queryKey: [...QUERY_KEY] });
  };

  return {
    ...query,
    data: query.data?.items ?? DEFAULT_ITEMS,
    page: query.data?.page ?? params.page ?? 1,
    limit: query.data?.limit ?? params.limit ?? 20,
    total: query.data?.total ?? 0,
    totalPages: query.data?.totalPages ?? 1,
    stats: query.data?.stats ?? EMPTY_STATS,
    statsTotal: query.data?.statsTotal ?? 0,
    invalidateQuery,
  };
}
