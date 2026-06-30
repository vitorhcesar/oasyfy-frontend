import { useApiService } from "@/presentation/hooks/use-api-service";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export type TAcquirerCostView = {
  id?: string;
  acquirer_id: string;
  operation_type: "deposit" | "withdrawal";
  method: string;
  fixed_cost: number;
  variable_cost: number;
  min_cost: number;
};

const DEFAULT_RETURN: TAcquirerCostView[] = [];
const QUERY_KEY = ["admin", "acquirer-costs"] as const;

export default function useAdminAcquirerCostsQuery() {
  const apiService = useApiService();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const data = await apiService.modules.adminConfig.listAcquirerCosts();
      return (data as unknown as TAcquirerCostView[]) ?? [];
    },
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
