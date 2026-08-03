import type { ISellerCheckoutServiceStatusDto } from "@/infra/http/services/api/modules/checkout.module";
import { useUserContext } from "@/presentation/context/UserContext";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { useQuery } from "@tanstack/react-query";

export const SELLER_CHECKOUT_SERVICE_STATUS_KEY = [
  "seller",
  "checkout-service-status",
] as const;

export default function useSellerCheckoutServiceStatusQuery() {
  const user = useUserContext();
  const apiService = useApiService();

  const query = useQuery({
    queryKey: SELLER_CHECKOUT_SERVICE_STATUS_KEY,
    queryFn: () => apiService.modules.sellerCheckouts.getServiceStatus(),
    enabled: !!user?.id,
  });

  return {
    status: (query.data as ISellerCheckoutServiceStatusDto | undefined) ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
