import { useApiService } from "@/presentation/hooks/use-api-service";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export type TCrmSettingsView = {
  id: string;
  api_url: string;
  api_token: string;
  instance_name: string;
  welcome_message: string;
  is_active: boolean;
};

const QUERY_KEY = ["admin", "crm-settings"] as const;

export default function useAdminCrmSettingsQuery() {
  const apiService = useApiService();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiService.modules.adminConfig.getCrmSettings(),
  });

  const invalidateQuery = async () => {
    await queryClient.invalidateQueries({ queryKey: [...QUERY_KEY] });
  };

  return {
    ...query,
    data: (query.data as TCrmSettingsView | null | undefined) ?? null,
    invalidateQuery,
  };
}
