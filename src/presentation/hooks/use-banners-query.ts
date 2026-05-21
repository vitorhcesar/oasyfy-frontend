import { IBannerDto } from "@/infra/http/services/api/modules/banner.module";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiService } from "./use-api-service";

const DEFAULT_RETURN: IBannerDto[] = [];

export default function useBannersQuery() {
  const apiService = useApiService();

  const queryClient = useQueryClient();

  const QUERY_KEY = ["banners"];

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const data = await apiService.modules.banner.list();
      return data;
    },
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
