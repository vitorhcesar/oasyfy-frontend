import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiService } from "./use-api-service";

export const SELLER_FEE_TEMPLATES_QUERY_KEY = ["seller-fee-templates"] as const;

export default function useSellerFeeTemplatesQuery() {
  const apiService = useApiService();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: SELLER_FEE_TEMPLATES_QUERY_KEY,
    queryFn: () => apiService.modules.sellerFee.listSellerFees(),
  });

  const invalidateQuery = async () => {
    await queryClient.invalidateQueries({
      queryKey: SELLER_FEE_TEMPLATES_QUERY_KEY,
    });
  };

  return {
    ...query,
    data: query.data ?? [],
    invalidateQuery,
  };
}
