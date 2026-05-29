import { TKycFilter } from "../types/kyc-filter.type";

export const KYC_FILTERS: { key: TKycFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "registered", label: "Cadastrados" },
  { key: "pending", label: "Pendentes" },
  { key: "approved", label: "Aprovados" },
  { key: "rejected", label: "Recusados" },
];
