import type { TAdminTransactionView } from "@/presentation/hooks/use-admin-transactions-query";

export type Transaction = TAdminTransactionView;

export type SellerInfo = {
  full_name: string | null;
  account_id: string;
  email?: string;
};

export type SellerKyc = {
  email?: string;
  cpf?: string;
  cnpj?: string;
};
