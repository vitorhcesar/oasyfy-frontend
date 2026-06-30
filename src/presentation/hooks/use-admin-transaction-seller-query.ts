import { useApiService } from "@/presentation/hooks/use-api-service";
import { useQuery } from "@tanstack/react-query";

const QUERY_KEY = ["admin", "transactions", "seller-info"] as const;

export default function useAdminTransactionSellerQuery(sellerId: number | null) {
  const apiService = useApiService();

  return useQuery({
    queryKey: [...QUERY_KEY, sellerId],
    queryFn: () =>
      apiService.modules.adminFinance.getTransactionSellerInfo(sellerId!),
    enabled: sellerId != null && !Number.isNaN(sellerId),
  });
}
