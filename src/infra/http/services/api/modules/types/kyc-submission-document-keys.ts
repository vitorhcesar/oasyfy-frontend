import type { IKycSubmissionDocumentsDto } from "./kyc-submission.types";

/** Chaves de documentos alinhadas ao backend (`TKycSubmissionDocumentsField`). */
export const KYC_SUBMISSION_DOCUMENT_KEYS = [
  "documentFront",
  "documentBack",
  "selfie",
  "proofOfAddress",
  "companyContract",
] as const;

export type TKycSubmissionDocumentKey =
  (typeof KYC_SUBMISSION_DOCUMENT_KEYS)[number];

/** Chaves legadas (Supabase / `documents_review` antigo). */
const LEGACY_DOCUMENT_KEY_MAP: Record<string, TKycSubmissionDocumentKey> = {
  document_front: "documentFront",
  document_back: "documentBack",
  proof_of_address: "proofOfAddress",
  company_contract: "companyContract",
};

export function normalizeKycDocumentKey(
  key: string,
): TKycSubmissionDocumentKey | null {
  if ((KYC_SUBMISSION_DOCUMENT_KEYS as readonly string[]).includes(key)) {
    return key as TKycSubmissionDocumentKey;
  }

  return LEGACY_DOCUMENT_KEY_MAP[key] ?? null;
}

export const KYC_DOCUMENT_URL_FIELD: Record<
  TKycSubmissionDocumentKey,
  keyof IKycSubmissionDocumentsDto
> = {
  documentFront: "documentFrontUrl",
  documentBack: "documentBackUrl",
  selfie: "selfieUrl",
  proofOfAddress: "proofOfAddressUrl",
  companyContract: "companyContractUrl",
};

export function getKycDocumentUrl(
  documents: IKycSubmissionDocumentsDto | null | undefined,
  key: TKycSubmissionDocumentKey,
): string | null {
  if (!documents) return null;
  return documents[KYC_DOCUMENT_URL_FIELD[key]] ?? null;
}
