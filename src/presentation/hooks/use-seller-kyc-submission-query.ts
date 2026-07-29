import type {
  IKycSubmissionDto,
  TSellerDashboardKycStatus,
  TSellerKycDocumentsReview,
} from "@/infra/http/services/api/modules/kyc-submission.module";
import { useUserContext } from "@/presentation/context/UserContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiService } from "./use-api-service";

export const SELLER_KYC_SUBMISSION_QUERY_KEY = ["seller-kyc-submission"] as const;

export interface IUseSellerKycSubmissionResult {
  kycStatus: TSellerDashboardKycStatus;
  submission: IKycSubmissionDto | null;
  documentsApproved: boolean;
  canSell: boolean;
  canWithdraw: boolean;
  fullyApproved: boolean;
  documentsReview: TSellerKycDocumentsReview;
  isLoading: boolean;
  invalidateQuery: () => Promise<void>;
}

export function useSellerKycSubmissionQuery(): IUseSellerKycSubmissionResult {
  const user = useUserContext();

  const apiService = useApiService();

  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: SELLER_KYC_SUBMISSION_QUERY_KEY,
    queryFn: () => apiService.modules.kycSubmission.getSellerSubmission(),
    enabled: !!user?.id,
  });

  const submission = query.data?.submission ?? null;
  const documentsApproved = query.data?.documentsApproved ?? false;
  const canSell = query.data?.canSell ?? false;
  const canWithdraw = query.data?.canWithdraw ?? false;
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
    documentsApproved,
    canSell,
    canWithdraw,
    fullyApproved,
    documentsReview,
    isLoading: query.isLoading,
    invalidateQuery,
  };
}
