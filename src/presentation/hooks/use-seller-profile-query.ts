import type { ISellerProfileDto } from "@/infra/http/services/api/modules/seller-portal.module";
import { useUserContext } from "@/presentation/context/UserContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiService } from "./use-api-service";

export const SELLER_PROFILE_QUERY_KEY = ["seller-profile"] as const;

export default function useSellerProfileQuery() {
  const user = useUserContext();
  const apiService = useApiService();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: SELLER_PROFILE_QUERY_KEY,
    queryFn: () => apiService.modules.sellerPortal.getProfile(),
    enabled: !!user?.id,
  });

  const invalidateQuery = async () => {
    await queryClient.invalidateQueries({
      queryKey: SELLER_PROFILE_QUERY_KEY,
    });
  };

  const setAvatarUrl = (avatarUrl: string | null) => {
    queryClient.setQueryData<ISellerProfileDto>(
      SELLER_PROFILE_QUERY_KEY,
      (current) => (current ? { ...current, avatarUrl } : current),
    );
  };

  const setProfile = (profile: ISellerProfileDto) => {
    queryClient.setQueryData<ISellerProfileDto>(
      SELLER_PROFILE_QUERY_KEY,
      profile,
    );
  };

  return {
    ...query,
    data: query.data ?? null,
    invalidateQuery,
    setAvatarUrl,
    setProfile,
  };
}
