import { IPlatformMetricsResponseDto } from "@/infra/http/services/api/modules/types/admin-platform-metrics.types";
import { cn } from "@/presentation/utils/cn";
import {
  Ban,
  CreditCard,
  FileCheck,
  RefreshCcw,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminDashboardPageStore } from "../stores/admin-dashboard-page.store";

interface IStatusCardsProps {
  metrics: IPlatformMetricsResponseDto;
}

export default function StatusCards({ metrics }: IStatusCardsProps) {
  const navigate = useNavigate();

  const {
    sellersCount: sellers,
    pendingKycCount: pendingKyc,
    approvedKycCount: approvedKyc,
    rejectedKycCount: rejectedKyc,
    bannedSellersCount: bannedSellers,
    pendingWithdrawalsCount: pendingWithdrawals,
    pendingRefundsCount: pendingRefunds,
    transactions,
  } = metrics;

  const { period, customFrom, customTo } = useAdminDashboardPageStore();

  const cutoff = useMemo(() => {
    if (period === "custom" && customFrom) return customFrom;
    const periodMs =
      period === "7d"
        ? 7 * 86400000
        : period === "30d"
          ? 30 * 86400000
          : 90 * 86400000;
    return new Date(Date.now() - periodMs);
  }, [period, customFrom]);

  const cutoffEnd = useMemo(() => {
    if (period === "custom" && customTo) {
      const end = new Date(customTo);
      end.setHours(23, 59, 59, 999);
      return end;
    }
    return new Date();
  }, [period, customTo]);

  const allNonWithdrawal = useMemo(
    () => transactions.filter((t) => t.method !== "withdrawal"),
    [transactions],
  );

  const filteredTx = useMemo(
    () =>
      allNonWithdrawal.filter((t) => {
        const d = new Date(t.createdAt);
        return d >= cutoff && d <= cutoffEnd;
      }),
    [allNonWithdrawal, cutoff, cutoffEnd],
  );

  const statCards = [
    {
      label: "Total de Sellers",
      value: sellers,
      icon: Users,
      accent: "bg-primary/10 text-primary",
      link: "/admin/sellers",
    },
    {
      label: "KYC Pendentes",
      value: pendingKyc,
      icon: FileCheck,
      accent: "bg-warning/10 text-warning",
      link: "/admin/kyc",
    },
    {
      label: "KYC Aprovados",
      value: approvedKyc,
      icon: ShieldCheck,
      accent: "bg-success/10 text-success",
      link: "/admin/kyc",
    },
    {
      label: "KYC Rejeitados",
      value: rejectedKyc,
      icon: Ban,
      accent: "bg-destructive/10 text-destructive",
      link: "/admin/kyc",
    },
    {
      label: "Sellers Banidos",
      value: bannedSellers,
      icon: Ban,
      accent: "bg-destructive/10 text-destructive",
      link: "/admin/sellers",
    },
    {
      label: "Saques Pendentes",
      value: pendingWithdrawals,
      icon: Wallet,
      accent: "bg-warning/10 text-warning",
      link: "/admin/withdrawals",
    },
    {
      label: "Estornos Pendentes",
      value: pendingRefunds,
      icon: RefreshCcw,
      accent: "bg-primary/10 text-primary",
      link: "/admin/refunds",
    },
    {
      label: "Total Transações",
      value: filteredTx.length,
      icon: CreditCard,
      accent: "bg-primary/10 text-primary",
      link: "/admin/transactions",
    },
  ];

  return (
    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-8">
      {statCards.map((card) => (
        <button
          key={card.label}
          onClick={() => navigate(card.link)}
          className="group rounded-xl border border-border/50 bg-card p-3.5 text-left transition-all hover:border-border"
        >
          <div
            className={cn(
              "mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg",
              card.accent,
            )}
          >
            <card.icon size={16} />
          </div>
          <p className="text-xl font-bold leading-none text-foreground">
            {card.value}
          </p>
          <p className="mt-1.5 text-xs leading-tight text-muted-foreground">
            {card.label}
          </p>
        </button>
      ))}
    </div>
  );
}
