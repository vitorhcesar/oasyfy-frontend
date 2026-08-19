import type { IListAdminWebhookDeliveriesParams } from "@/infra/http/services/api/modules/admin-webhooks.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY = ["admin", "webhooks", "deliveries"] as const;
const EMPTY_STATS = { pending: 0, success: 0, failed: 0 };

export default function useAdminWebhookDeliveriesQuery(
  params: IListAdminWebhookDeliveriesParams = {},
) {
  const apiService = useApiService();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...QUERY_KEY, params],
    queryFn: () => apiService.modules.adminWebhooks.listDeliveries(params),
    placeholderData: keepPreviousData,
  });

  const invalidateQuery = async () => {
    await queryClient.invalidateQueries({ queryKey: [...QUERY_KEY] });
  };

  return {
    ...query,
    data: query.data?.items ?? [],
    page: query.data?.page ?? params.page ?? 1,
    limit: query.data?.limit ?? params.limit ?? 20,
    total: query.data?.total ?? 0,
    totalPages: query.data?.totalPages ?? 1,
    stats: query.data?.stats ?? EMPTY_STATS,
    invalidateQuery,
  };
}
