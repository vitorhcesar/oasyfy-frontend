import { useAuthStore } from "@/http/stores/useAuthStore";
import { apiService } from "@/infra/http/services/api/api.service";
import type {
  IKycSubmissionSummaryDto,
  ISellerKycSubmissionResponseDto,
  TSellerDashboardKycStatus,
  TSellerKycDocumentsReview,
} from "@/infra/http/services/api/modules/kyc-submission.module";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export interface IUseSellerKycSubmissionResult {
  kycStatus: TSellerDashboardKycStatus;
  /** Resumo quando existe envio em `kyc_submissions`; `null` se ainda não houver registro */
  submission: IKycSubmissionSummaryDto | null;
  fullyApproved: boolean;
  documentsReview: TSellerKycDocumentsReview;
  isLoading: boolean;
  /** Invalida cache em memória e refaz GET (ex.: após fluxo paralelo atualizar só no Supabase) */
  invalidateQuery: () => Promise<void>;
}

export function useSellerKycSubmissionQuery(): IUseSellerKycSubmissionResult {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const QUERY_KEY = ["seller-kyc-submission"];

  const [kycStatus, setKycStatus] = useState<TSellerDashboardKycStatus>("none");
  const [submission, setSubmission] = useState<IKycSubmissionSummaryDto | null>(
    null
  );
  const [fullyApproved, setFullyApproved] = useState(false);
  const [documentsReview, setDocumentsReview] =
    useState<TSellerKycDocumentsReview>({});

  const extractDataFromQueryResponse = async (
    data: ISellerKycSubmissionResponseDto
  ) => {
    setSubmission(data.submission);
    setFullyApproved(data.fullyApproved);

    if (!data.submission) {
      setKycStatus("none");
      setDocumentsReview({});
    } else {
      setKycStatus(data.submission.status);
      setDocumentsReview(data.submission.documentsReview);
    }
  };

  const { isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const data = await apiService.modules.kycSubmission.getSellerSubmission();
      extractDataFromQueryResponse(data);
      return data;
    },
    enabled: !!user?.id,
  });

  const invalidateQuery = async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  };

  return {
    kycStatus,
    submission,
    fullyApproved,
    documentsReview,
    isLoading,
    invalidateQuery,
  };
}
