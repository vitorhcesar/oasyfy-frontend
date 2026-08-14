import type { IKycSubmissionView } from "../types/kyc-submission-view.type";
import type { IRegisteredSellerView } from "../types/kyc-submission-view.type";

export function isPendingEmailVerification(
  seller: Pick<
    IKycSubmissionView | IRegisteredSellerView,
    | "email_verified"
    | "email_manually_approved"
    | "pending_email_code"
  >,
): boolean {
  if (seller.email_manually_approved) {
    return false;
  }

  if (seller.pending_email_code) {
    return true;
  }

  return seller.email_verified === false;
}
