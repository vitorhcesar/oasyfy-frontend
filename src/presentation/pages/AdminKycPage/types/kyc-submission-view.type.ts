import type { IKycSubmissionBankData } from "@/domain/types/kyc-submission-bank-data.type";
import type { TKycDocumentsReview } from "./kyc-documents-review.type";

export type { TKycDocumentsReview } from "./kyc-documents-review.type";

export interface IKycSubmissionView {
  id: string;
  user_id: string;
  account_id?: string;
  full_name: string;
  person_type: "pf" | "pj";
  cpf: string | null;
  cnpj: string | null;
  company_name: string | null;
  company_type: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  created_at: string;
  city: string | null;
  state: string | null;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  zip_code: string | null;
  complement: string | null;
  bank_data: IKycSubmissionBankData | null;
  address_status: string;
  bank_status: string;
  documents_status: string;
  documents_review: TKycDocumentsReview | null;
  rejection_reason: string | null;
  document_front_url: string | null;
  document_back_url: string | null;
  selfie_url: string | null;
  proof_of_address_url: string | null;
  company_contract_url: string | null;
  is_banned: boolean;
  withdrawals_blocked: boolean;
  withdrawal_block_reason: string | null;
  api_access_enabled: boolean;
  email_manually_approved?: boolean;
  email_verified?: boolean;
}

export interface IRegisteredSellerView {
  user_id: string;
  full_name: string | null;
  email: string | null;
  account_id?: string;
  created_at: string;
  email_manually_approved?: boolean;
  email_verified?: boolean;
}
