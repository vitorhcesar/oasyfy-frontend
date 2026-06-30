import { useApiService } from "@/presentation/hooks/use-api-service";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export type TGlobalFeesView = Record<string, number | string>;

const QUERY_KEY = ["admin", "global-fees"] as const;

export default function useAdminGlobalFeesQuery() {
  const apiService = useApiService();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiService.modules.adminConfig.getGlobalFees(),
  });

  const invalidateQuery = async () => {
    await queryClient.invalidateQueries({ queryKey: [...QUERY_KEY] });
  };

  return {
    ...query,
    data: (query.data as TGlobalFeesView | null | undefined) ?? null,
    invalidateQuery,
  };
}
