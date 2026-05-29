import type {
  IAdminKycSubmissionsResponseDto,
  TAdminKycListFilter,
} from "@/infra/http/services/api/modules/admin-kyc-submissions.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const DEFAULT_RETURN: IAdminKycSubmissionsResponseDto = {
  submissions: [],
  registeredOnly: [],
};

const QUERY_KEY = ["admin", "kyc-submissions"];

export default function useAdminKycSubmissionsQuery(filter: TAdminKycListFilter) {
  const apiService = useApiService();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...QUERY_KEY, filter],
    queryFn: () =>
      apiService.modules.adminKycSubmissions.listSubmissions({ filter }),
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
