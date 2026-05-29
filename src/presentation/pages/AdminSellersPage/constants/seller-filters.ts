import { TFilterKey } from "../types/filter-key.type";

export const SELLER_FILTERS: { key: TFilterKey; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "sem_kyc", label: "Pendentes" },
  { key: "under_review", label: "Com documento" },
  { key: "approved", label: "Aprovados" },
  { key: "rejected", label: "Banidos" },
];
