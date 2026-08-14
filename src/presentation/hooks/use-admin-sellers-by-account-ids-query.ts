import { useApiService } from "@/presentation/hooks/use-api-service";
import { useQuery } from "@tanstack/react-query";

const QUERY_KEY = ["admin", "transactions", "sellers-by-account"] as const;
const DEFAULT_RETURN: {
  accountId: string;
  fullName: string | null;
  email: string | null;
}[] = [];

export default function useAdminSellersByAccountIdsQuery(accountIds: string[]) {
  const apiService = useApiService();
  const key = [...accountIds].sort().join(",");

  const query = useQuery({
    queryKey: [...QUERY_KEY, key],
    queryFn: () =>
      apiService.modules.adminFinance.getSellersByAccountIds(accountIds),
    enabled: accountIds.length > 0,
  });

  return {
    ...query,
    data: query.data ?? DEFAULT_RETURN,
  };
}
