import type {
  IAdminKycSubmissionDto,
  IAdminRegisteredSellerDto,
} from "@/infra/http/services/api/modules/admin-kyc-submissions.module";
import type {
  IKycSubmissionView,
  IRegisteredSellerView,
} from "../types/kyc-submission-view.type";
import { parseKycDocumentsReview } from "./check-and-update-documents-status.util";

export function mapAdminKycSubmissionToView(
  submission: IAdminKycSubmissionDto,
): IKycSubmissionView {
  return {
    id: String(submission.id),
    user_id: String(submission.userId),
    account_id: submission.accountId ?? undefined,
    full_name: submission.fullName,
    person_type: submission.personType,
    cpf: submission.cpf,
    cnpj: submission.cnpj,
    company_name: submission.companyName,
    company_type: submission.companyType,
    phone: submission.phone,
    email: submission.email,
    status: submission.status,
    created_at: submission.createdAt,
    city: submission.city,
    state: submission.state,
    street: submission.street,
    number: submission.number,
    neighborhood: submission.neighborhood,
    zip_code: submission.zipCode,
    complement: submission.complement,
    bank_data: submission.bankData,
    address_status: submission.addressStatus,
    bank_status: submission.bankStatus,
    documents_status: submission.documentsStatus,
    documents_review: parseKycDocumentsReview(submission.documentsReview),
    rejection_reason: submission.rejectionReason,
    document_front_url: submission.documentFrontUrl,
    document_back_url: submission.documentBackUrl,
    selfie_url: submission.selfieUrl,
    proof_of_address_url: submission.proofOfAddressUrl,
    company_contract_url: submission.companyContractUrl,
    is_banned: submission.isBanned,
    withdrawals_blocked: submission.withdrawalsBlocked,
    withdrawal_block_reason: submission.withdrawalBlockReason,
    api_access_enabled: submission.apiAccessEnabled ?? false,
    email_manually_approved: submission.emailManuallyApproved,
    email_verified: submission.emailVerified,
  };
}

export function mapRegisteredSellerToView(
  seller: IAdminRegisteredSellerDto,
): IRegisteredSellerView {
  return {
    user_id: String(seller.userId),
    full_name: seller.fullName,
    email: seller.email,
    account_id: seller.accountId ?? undefined,
    created_at: seller.createdAt,
    email_manually_approved: seller.emailManuallyApproved,
    email_verified: seller.emailVerified,
  };
}

export function mapRegisteredSellerToKycView(
  seller: IRegisteredSellerView,
): IKycSubmissionView {
  return {
    id: "",
    user_id: seller.user_id,
    account_id: seller.account_id,
    full_name: seller.full_name || "Sem nome",
    person_type: "pf",
    cpf: null,
    cnpj: null,
    company_name: null,
    company_type: null,
    phone: null,
    email: seller.email,
    status: "pending",
    created_at: seller.created_at,
    city: "",
    state: "",
    street: "",
    number: "",
    neighborhood: "",
    zip_code: "",
    complement: null,
    bank_data: null,
    address_status: "pending",
    bank_status: "pending",
    documents_status: "pending",
    documents_review: null,
    rejection_reason: null,
    document_front_url: null,
    document_back_url: null,
    selfie_url: null,
    proof_of_address_url: null,
    company_contract_url: null,
    is_banned: false,
    withdrawals_blocked: false,
    withdrawal_block_reason: null,
    api_access_enabled: false,
    email_manually_approved: seller.email_manually_approved,
    email_verified: seller.email_verified,
  };
}
