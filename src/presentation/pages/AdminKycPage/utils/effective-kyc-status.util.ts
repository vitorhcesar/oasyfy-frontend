export type TEffectiveKycStatus =
  | "approved"
  | "partially_approved"
  | "rejected"
  | "pending";

export function effectiveKycStatus(submission: {
  status: string;
  documents_status: string;
  bank_status: string;
  address_status: string;
}): TEffectiveKycStatus {
  if (submission.status === "rejected") {
    return "rejected";
  }

  const allSectionsApproved =
    submission.documents_status === "approved" &&
    submission.bank_status === "approved" &&
    submission.address_status === "approved";

  if (allSectionsApproved && submission.status === "approved") {
    return "approved";
  }

  if (submission.documents_status === "approved") {
    return "partially_approved";
  }

  return "pending";
}
