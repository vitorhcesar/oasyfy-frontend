import type { IAdminFinancialSettingsDto } from "@/infra/http/services/api/modules/admin-config.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY = ["admin", "financial-settings"] as const;

export default function useAdminFinancialSettingsQuery() {
  const apiService = useApiService();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiService.modules.adminConfig.getFinancialSettings(),
  });

  const invalidateQuery = async () => {
    await queryClient.invalidateQueries({ queryKey: [...QUERY_KEY] });
  };

  return {
    ...query,
    data: (query.data as IAdminFinancialSettingsDto | undefined) ?? null,
    invalidateQuery,
  };
}
