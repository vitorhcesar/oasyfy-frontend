import type { IAdminCheckoutSettingsDto } from "@/infra/http/services/api/modules/admin-config.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY = ["admin", "checkout-settings"] as const;

export default function useAdminCheckoutSettingsQuery() {
  const apiService = useApiService();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiService.modules.adminConfig.getCheckoutSettings(),
  });

  const invalidateQuery = async () => {
    await queryClient.invalidateQueries({ queryKey: [...QUERY_KEY] });
  };

  return {
    ...query,
    data: (query.data as IAdminCheckoutSettingsDto | undefined) ?? null,
    invalidateQuery,
  };
}
