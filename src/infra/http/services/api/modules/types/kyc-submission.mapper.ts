import { normalizeKycDocumentKey } from "./kyc-submission-document-keys";
import type {
  IKycSubmissionDocumentsDto,
  IKycSubmissionDto,
  ISellerKycSubmissionResponseDto,
  TSellerKycDocReviewEntry,
  TSellerKycDocumentsReview,
} from "./kyc-submission.types";

function isReviewEntry(value: unknown): value is TSellerKycDocReviewEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    typeof (value as TSellerKycDocReviewEntry).status === "string"
  );
}

function mapDocuments(raw: unknown): IKycSubmissionDocumentsDto | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const source = raw as Record<string, unknown>;

  return {
    documentFrontUrl:
      (source.documentFrontUrl as string | null | undefined) ?? null,
    documentBackUrl:
      (source.documentBackUrl as string | null | undefined) ?? null,
    selfieUrl: (source.selfieUrl as string | null | undefined) ?? null,
    proofOfAddressUrl:
      (source.proofOfAddressUrl as string | null | undefined) ?? null,
    companyContractUrl:
      (source.companyContractUrl as string | null | undefined) ?? null,
  };
}

export function normalizeDocumentsReview(
  raw: Record<string, unknown> | null | undefined,
): TSellerKycDocumentsReview {
  if (!raw) return {};

  const normalized: TSellerKycDocumentsReview = {};

  for (const [key, value] of Object.entries(raw)) {
    const documentKey = normalizeKycDocumentKey(key);
    if (!documentKey || !isReviewEntry(value)) continue;
    normalized[documentKey] = value;
  }

  return normalized;
}

function mapSubmission(raw: unknown): IKycSubmissionDto | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const source = raw as Record<string, unknown>;
  const documents = mapDocuments(source.documents);

  const legacyDocuments: IKycSubmissionDocumentsDto | null =
    documents ??
    (source.documentFrontUrl ||
    source.documentBackUrl ||
    source.selfieUrl ||
    source.proofOfAddressUrl ||
    source.companyContractUrl
      ? {
          documentFrontUrl:
            (source.documentFrontUrl as string | null | undefined) ?? null,
          documentBackUrl:
            (source.documentBackUrl as string | null | undefined) ?? null,
          selfieUrl: (source.selfieUrl as string | null | undefined) ?? null,
          proofOfAddressUrl:
            (source.proofOfAddressUrl as string | null | undefined) ?? null,
          companyContractUrl:
            (source.companyContractUrl as string | null | undefined) ?? null,
        }
      : null);

  const { documents: _documents, ...rest } = source;

  return {
    ...(rest as Omit<IKycSubmissionDto, "documents" | "documentsReview">),
    documents: legacyDocuments,
    documentsReview: normalizeDocumentsReview(
      (source.documentsReview as Record<string, unknown> | undefined) ??
        (source.documents_review as Record<string, unknown> | undefined),
    ),
  };
}

export function mapSellerKycSubmissionResponse(
  raw: ISellerKycSubmissionResponseDto,
): ISellerKycSubmissionResponseDto {
  return {
    fullyApproved: raw.fullyApproved,
    submission: mapSubmission(raw.submission),
  };
}
