import { TAdminSellerKycStatus } from "@/infra/http/services/api/modules/admin-sellers.module";

export interface ISellerStatusConfig {
  label: string;
  cls: string;
  dot: string;
}

export const SELLER_STATUS_CONFIG: Record<
  TAdminSellerKycStatus,
  ISellerStatusConfig
> = {
  sem_kyc: {
    label: "Sem KYC",
    cls: "border-border bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/40",
  },
  pending: {
    label: "Pendente",
    cls: "border-warning/25 bg-warning/10 text-warning",
    dot: "bg-warning",
  },
  under_review: {
    label: "Em análise",
    cls: "border-primary/25 bg-primary/10 text-primary",
    dot: "bg-primary",
  },
  approved: {
    label: "Aprovado",
    cls: "border-success/25 bg-success/10 text-success",
    dot: "bg-success",
  },
  rejected: {
    label: "Banido",
    cls: "border-destructive/25 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
};
