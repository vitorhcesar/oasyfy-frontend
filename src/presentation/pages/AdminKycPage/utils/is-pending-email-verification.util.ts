import type { IKycSubmissionView } from "../types/kyc-submission-view.type";
import type { IRegisteredSellerView } from "../types/kyc-submission-view.type";

export function isPendingEmailVerification(
  seller: Pick<
    IKycSubmissionView | IRegisteredSellerView,
    "email_verified" | "email_manually_approved"
  >,
): boolean {
  return seller.email_verified === false && !seller.email_manually_approved;
}
