import type { IAdminManagerDto } from "@/infra/http/services/api/modules/manage-admins.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const DEFAULT_RETURN: IAdminManagerDto[] = [];
const QUERY_KEY = ["admin", "managers"] as const;

export default function useAdminManagersQuery() {
  const apiService = useApiService();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiService.modules.manageAdmins.listManagers(),
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
