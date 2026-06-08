import { IAdminBannerDto } from "@/infra/http/services/api/modules/admin-banner.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const DEFAULT_RETURN: IAdminBannerDto[] = [];

export default function useAdminBannersQuery() {
  const apiService = useApiService();

  const queryClient = useQueryClient();

  const QUERY_KEY = ["admin", "banners"];

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiService.modules.adminBanners.list(),
  });

  const invalidateQuery = async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  };

  return {
    ...query,
    data: query.data ?? DEFAULT_RETURN,
    invalidateQuery,
  };
}
