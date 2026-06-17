import type {
  IKycDocumentReviewEntry,
  TKycDocumentKey,
  TKycDocumentReviewStatus,
  TKycDocumentsReview,
  TKycDocumentsSectionStatus,
} from "../types/kyc-documents-review.type";

const DOCUMENT_REVIEW_STATUSES: readonly TKycDocumentReviewStatus[] = [
  "pending",
  "approved",
  "rejected",
];

const DOCUMENT_KEYS: readonly TKycDocumentKey[] = [
  "document_front",
  "document_back",
  "selfie",
  "proof_of_address",
  "company_contract",
];

function isDocumentReviewStatus(
  value: unknown,
): value is TKycDocumentReviewStatus {
  return (
    typeof value === "string" &&
    DOCUMENT_REVIEW_STATUSES.includes(value as TKycDocumentReviewStatus)
  );
}

function isDocumentKey(value: string): value is TKycDocumentKey {
  return DOCUMENT_KEYS.includes(value as TKycDocumentKey);
}

function parseDocumentReviewEntry(
  value: unknown,
): IKycDocumentReviewEntry | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const entry = value as Record<string, unknown>;
  const status = entry.status;

  if (!isDocumentReviewStatus(status)) {
    return undefined;
  }

  const reason =
    typeof entry.reason === "string" ? entry.reason : undefined;

  return reason ? { status, reason } : { status };
}

export function parseKycDocumentsReview(
  raw: Record<string, unknown> | null | undefined,
): TKycDocumentsReview {
  if (!raw) {
    return {};
  }

  const review: TKycDocumentsReview = {};

  for (const [key, value] of Object.entries(raw)) {
    if (!isDocumentKey(key)) {
      continue;
    }

    const entry = parseDocumentReviewEntry(value);
    if (entry) {
      review[key] = entry;
    }
  }

  return review;
}

export function getKycDocumentKeys(
  personType: "pf" | "pj",
): readonly TKycDocumentKey[] {
  const base: TKycDocumentKey[] = [
    "document_front",
    "document_back",
    "selfie",
    "proof_of_address",
  ];

  if (personType === "pj") {
    return [...base, "company_contract"];
  }

  return base;
}

export function checkAndUpdateDocumentsStatus(
  updatedReview: TKycDocumentsReview,
  personType: "pf" | "pj",
): TKycDocumentsSectionStatus {
  const docKeys = getKycDocumentKeys(personType);
  const allDocsApproved = docKeys.every(
    (key) => updatedReview[key]?.status === "approved",
  );
  const anyRejected = docKeys.some(
    (key) => updatedReview[key]?.status === "rejected",
  );

  return allDocsApproved
    ? "approved"
    : anyRejected
      ? "rejected"
      : "pending";
}
