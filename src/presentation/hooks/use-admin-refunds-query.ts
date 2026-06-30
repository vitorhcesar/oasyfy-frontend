import type { mapAdminRefundRequestToView } from "@/infra/http/services/api/modules/admin-finance.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export type TAdminRefundRequestView = ReturnType<
  typeof mapAdminRefundRequestToView
>;

const DEFAULT_RETURN: TAdminRefundRequestView[] = [];
const QUERY_KEY = ["admin", "refunds"] as const;

export default function useAdminRefundsQuery() {
  const apiService = useApiService();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiService.modules.adminFinance.listRefundRequests(),
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
