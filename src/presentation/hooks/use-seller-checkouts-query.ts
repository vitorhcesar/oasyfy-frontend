import type {
  ICreateCheckoutBody,
  ISellerCheckoutDto,
  IUpdateCheckoutBody,
} from "@/infra/http/services/api/modules/checkout.module";
import { useUserContext } from "@/presentation/context/UserContext";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const SELLER_CHECKOUTS_QUERY_KEY = ["seller", "checkouts"] as const;

export default function useSellerCheckoutsQuery() {
  const user = useUserContext();
  const apiService = useApiService();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: SELLER_CHECKOUTS_QUERY_KEY,
    queryFn: () => apiService.modules.sellerCheckouts.list(),
    enabled: !!user?.id,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: SELLER_CHECKOUTS_QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (body: ICreateCheckoutBody) =>
      apiService.modules.sellerCheckouts.create(body),
    onSuccess: () => invalidate(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: IUpdateCheckoutBody }) =>
      apiService.modules.sellerCheckouts.update(id, body),
    onSuccess: () => invalidate(),
  });

  return {
    checkouts: (query.data ?? []) as ISellerCheckoutDto[],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    createMutation,
    updateMutation,
  };
}

export function useSellerCheckoutDetailQuery(id: number | null) {
  const user = useUserContext();
  const apiService = useApiService();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...SELLER_CHECKOUTS_QUERY_KEY, id],
    queryFn: () => apiService.modules.sellerCheckouts.get(id!),
    enabled: !!user?.id && !!id,
  });

  const paymentsQuery = useQuery({
    queryKey: [...SELLER_CHECKOUTS_QUERY_KEY, id, "payments"],
    queryFn: () => apiService.modules.sellerCheckouts.listPayments(id!),
    enabled: !!user?.id && !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (body: IUpdateCheckoutBody) =>
      apiService.modules.sellerCheckouts.update(id!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SELLER_CHECKOUTS_QUERY_KEY });
    },
  });

  return {
    checkout: query.data ?? null,
    isLoading: query.isLoading,
    payments: paymentsQuery.data ?? [],
    paymentsLoading: paymentsQuery.isLoading,
    updateMutation,
    refetch: query.refetch,
  };
}
