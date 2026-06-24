import { useUserContext } from "@/presentation/context/UserContext";
import { useSellerKycSubmissionQuery } from "./use-seller-kyc-submission-query";

export function useKycStatus() {
  const user = useUserContext();
  const { fullyApproved, submission, isLoading } = useSellerKycSubmissionQuery();

  if (!user) {
    return { kycApproved: null, loading: false };
  }

  const kycApproved =
    !isLoading && submission
      ? fullyApproved || submission.status === "approved"
      : !isLoading
        ? false
        : null;

  return { kycApproved, loading: isLoading };
}
