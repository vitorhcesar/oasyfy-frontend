import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/infra/http/services/api/api.service";
import type { IAdminAcquirerPreferenceDto } from "@/infra/http/services/api/modules/types/acquirer-preference.types";

const QUERY_KEY = ["admin", "acquirer-preference"] as const;

export default function useAdminAcquirerPreferenceQuery() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      apiService.modules.adminSellers.getPlatformAcquirerPreference(),
  });

  const invalidateQuery = () =>
    queryClient.invalidateQueries({ queryKey: [...QUERY_KEY] });

  const setCached = (data: IAdminAcquirerPreferenceDto) => {
    queryClient.setQueryData(QUERY_KEY, data);
  };

  return { ...query, invalidateQuery, setCached };
}
