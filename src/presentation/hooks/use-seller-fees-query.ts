import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiService } from "./use-api-service";

const DEFAULT_RETURN = null;

export default function useSellerFeesQuery() {
  const apiService = useApiService();

  const queryClient = useQueryClient();

  const QUERY_KEY = ["seller-fees"];

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const data = await apiService.modules.sellerFee.getSellerFees();
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
