import type { IPixAmountLimitsDto } from "@/infra/http/services/api/modules/pix.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { useQuery } from "@tanstack/react-query";

const QUERY_KEY = ["pix", "amount-limits"] as const;

export default function usePixAmountLimitsQuery() {
  const apiService = useApiService();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiService.modules.pix.getAmountLimits(),
  });

  return {
    ...query,
    data: (query.data as IPixAmountLimitsDto | undefined) ?? null,
  };
}
