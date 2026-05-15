import { ITransactionDto } from "@/infra/http/services/api/modules/transaction.module";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiService } from "./use-api-service";

const DEFAULT_RETURN: ITransactionDto[] = [];

export default function useSellerTransactionsQuery() {
  const apiService = useApiService();

  const queryClient = useQueryClient();

  const QUERY_KEY = ["seller-transactions"];

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const data =
        await apiService.modules.transaction.listSellerTransactions();
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
