import { useApiService } from "@/presentation/hooks/use-api-service";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export type TRoutingRuleView = {
  id: string;
  method: string;
  acquirer_id: string;
  priority: number;
  is_active: boolean;
  weight: number;
};

const DEFAULT_RETURN: TRoutingRuleView[] = [];
const QUERY_KEY = ["admin", "routing-rules"] as const;

export default function useAdminRoutingRulesQuery() {
  const apiService = useApiService();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const data = await apiService.modules.adminConfig.listRoutingRules();
      return (data as unknown as TRoutingRuleView[]) ?? [];
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
