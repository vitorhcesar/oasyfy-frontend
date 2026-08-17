import { Transaction } from "@/domain/entities/transaction.entity";
import type { IListSellerTransactionsParams } from "@/infra/http/services/api/modules/transaction.module";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiService } from "./use-api-service";

const DEFAULT_ITEMS: Transaction[] = [];

export const SELLER_TRANSACTIONS_QUERY_KEY = ["seller-transactions"] as const;

export default function useSellerTransactionsQuery(
  params: IListSellerTransactionsParams = {},
) {
  const apiService = useApiService();
  const queryClient = useQueryClient();

  const queryKey = [...SELLER_TRANSACTIONS_QUERY_KEY, params] as const;

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      return apiService.modules.transaction.listSellerTransactions(params);
    },
    placeholderData: keepPreviousData,
  });

  const invalidateQuery = async () => {
    await queryClient.invalidateQueries({
      queryKey: [...SELLER_TRANSACTIONS_QUERY_KEY],
    });
  };

  return {
    ...query,
    data: query.data?.items ?? DEFAULT_ITEMS,
    page: query.data?.page ?? params.page ?? 1,
    limit: query.data?.limit ?? params.limit ?? 20,
    total: query.data?.total ?? 0,
    totalPages: query.data?.totalPages ?? 1,
    approvedCount: query.data?.approvedCount ?? 0,
    approvedAmount: query.data?.approvedAmount ?? 0,
    pendingWithdrawalAmount: query.data?.pendingWithdrawalAmount ?? 0,
    completedWithdrawalAmount: query.data?.completedWithdrawalAmount ?? 0,
    invalidateQuery,
  };
}
