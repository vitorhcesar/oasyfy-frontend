import { useApiService } from "@/presentation/hooks/use-api-service";
import { useUserContext } from "@/presentation/context/UserContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const SELLER_PARTNERS_QUERY_KEY = ["seller-partners"] as const;

export default function useSellerPartnersQuery() {
  const user = useUserContext();
  const apiService = useApiService();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: SELLER_PARTNERS_QUERY_KEY,
    queryFn: () => apiService.modules.sellerPortal.listPartners(),
    enabled: !!user?.id,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: SELLER_PARTNERS_QUERY_KEY });

  const inviteMutation = useMutation({
    mutationFn: (body: {
      email: string;
      percentage: number;
      note?: string | null;
    }) => apiService.modules.sellerPortal.invitePartner(body),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: (input: {
      id: number;
      body: { percentage?: number; action?: "pause" | "resume" | "revoke" };
    }) => apiService.modules.sellerPortal.updatePartner(input.id, input.body),
    onSuccess: invalidate,
  });

  const acceptMutation = useMutation({
    mutationFn: (id: number) =>
      apiService.modules.sellerPortal.acceptPartnerInvite(id),
    onSuccess: invalidate,
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) =>
      apiService.modules.sellerPortal.rejectPartnerInvite(id),
    onSuccess: invalidate,
  });

  return {
    ...query,
    inviteMutation,
    updateMutation,
    acceptMutation,
    rejectMutation,
    invalidate,
    searchPartnerByEmail: (email: string) =>
      apiService.modules.sellerPortal.searchPartnerByEmail(email),
  };
}
