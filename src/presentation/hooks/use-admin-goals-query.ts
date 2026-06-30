import { useApiService } from "@/presentation/hooks/use-api-service";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export type TAdminGoalView = {
  id: string;
  title: string;
  description: string | null;
  goal_type: "revenue" | "transaction_count" | "avg_ticket" | "new_customers";
  target_value: number;
  reward_type: "balance_bonus" | "fee_discount" | "badge" | "custom";
  reward_value: number;
  reward_description: string | null;
  seller_id: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
};

const DEFAULT_RETURN: TAdminGoalView[] = [];
const QUERY_KEY = ["admin", "goals"] as const;

export default function useAdminGoalsQuery() {
  const apiService = useApiService();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const data = await apiService.modules.adminConfig.listSellerGoals();
      return data as TAdminGoalView[];
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
