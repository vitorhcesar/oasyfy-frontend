import { useUserContext } from "@/presentation/context/UserContext";
import { useSellerKycSubmissionQuery } from "./use-seller-kyc-submission-query";

export function useKycStatus() {
  const user = useUserContext();
  const { canSell, submission, isLoading } = useSellerKycSubmissionQuery();

  if (!user) {
    return { kycApproved: null, loading: false };
  }

  const kycApproved =
    !isLoading && submission ? canSell : !isLoading ? false : null;

  return { kycApproved, loading: isLoading };
}
