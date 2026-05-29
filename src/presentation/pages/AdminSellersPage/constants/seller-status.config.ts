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
    cls: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground/40",
  },
  pending: {
    label: "Pendente",
    cls: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    dot: "bg-yellow-500",
  },
  under_review: {
    label: "Em análise",
    cls: "bg-blue-500/10 text-blue-600 border-blue-200",
    dot: "bg-blue-500",
  },
  approved: {
    label: "Aprovado",
    cls: "bg-primary/10 text-primary border-primary/20",
    dot: "bg-primary",
  },
  rejected: {
    label: "Banido",
    cls: "bg-destructive/10 text-destructive border-destructive/20",
    dot: "bg-destructive",
  },
};
