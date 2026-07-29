export type TKycDocumentReviewStatus = "pending" | "approved" | "rejected";

export type TKycDocumentKey =
  | "document_front"
  | "document_back"
  | "selfie"
  | "company_contract";

export interface IKycDocumentReviewEntry {
  status: TKycDocumentReviewStatus;
  reason?: string;
}

export type TKycDocumentsReview = Partial<
  Record<TKycDocumentKey, IKycDocumentReviewEntry>
>;

export type TKycDocumentsSectionStatus = TKycDocumentReviewStatus;
