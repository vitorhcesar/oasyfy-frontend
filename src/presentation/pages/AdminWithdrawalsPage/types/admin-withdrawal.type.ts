import type { TAdminWithdrawalView } from "@/presentation/hooks/use-admin-withdrawals-query";

export type { TAdminWithdrawalView };

export type BankData = {
  bank_name?: string;
  bankName?: string;
  bank_code?: string;
  agency?: string;
  agencyDigit?: string;
  account?: string;
  accountDigit?: string;
  account_type?: string;
  accountType?: string;
  pix_key?: string;
  pixKey?: string;
  pix_key_type?: string;
  pixKeyType?: string;
  holder_name?: string;
  holder_document?: string;
};

export type ApprovalModalData = {
  withdrawal: TAdminWithdrawalView;
  bankData: BankData | null;
  sellerIps: string[];
  balance: number;
  accountId: string;
  cpf: string | null;
  cnpj: string | null;
  withdrawalFee: number;
} | null;
