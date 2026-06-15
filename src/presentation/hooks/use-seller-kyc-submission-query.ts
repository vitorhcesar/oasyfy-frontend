import type {
  IKycSubmissionDto,
  TSellerDashboardKycStatus,
  TSellerKycDocumentsReview,
} from "@/infra/http/services/api/modules/kyc-submission.module";
import { useAuthStore } from "@/presentation/stores/useAuthStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiService } from "./use-api-service";

export const SELLER_KYC_SUBMISSION_QUERY_KEY = ["seller-kyc-submission"] as const;

export interface IUseSellerKycSubmissionResult {
  kycStatus: TSellerDashboardKycStatus;
  /** Resumo quando existe envio em `kyc_submissions`; `null` se ainda não houver registro */
  submission: IKycSubmissionDto | null;
  fullyApproved: boolean;
  documentsReview: TSellerKycDocumentsReview;
  isLoading: boolean;
  /** Invalida cache em memória e refaz GET (ex.: após fluxo paralelo atualizar só no Supabase) */
  invalidateQuery: () => Promise<void>;
}

export function useSellerKycSubmissionQuery(): IUseSellerKycSubmissionResult {
  const { user } = useAuthStore();

  const apiService = useApiService();

  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: SELLER_KYC_SUBMISSION_QUERY_KEY,
    queryFn: () => apiService.modules.kycSubmission.getSellerSubmission(),
    enabled: !!user?.id,
  });

  const submission = query.data?.submission ?? null;
  const fullyApproved = query.data?.fullyApproved ?? false;
  const kycStatus: TSellerDashboardKycStatus = submission?.status ?? "none";
  const documentsReview: TSellerKycDocumentsReview =
    submission?.documentsReview ?? {};

  const invalidateQuery = async () => {
    await queryClient.invalidateQueries({
      queryKey: SELLER_KYC_SUBMISSION_QUERY_KEY,
    });
  };

  return {
    kycStatus,
    submission,
    fullyApproved,
    documentsReview,
    isLoading: query.isLoading,
    invalidateQuery,
  };
}
