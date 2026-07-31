import {
  ArrowDownRight,
  Banknote,
  DollarSign,
  Loader2,
  Percent,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { cn } from "@/presentation/utils/cn";
import useAdminFinanceMetricsQuery from "../hooks/use-admin-finance-metrics-query";
import usePlatformAvailableBalanceQuery from "../hooks/use-platform-available-balance-query";
import { formatCompact } from "../utils/format-compact";
import ChangeIndicator from "./ChangeIndicator";

export default function FinancialCards() {
  const { data, isLoading } = useAdminFinanceMetricsQuery();
  const {
    data: platformBalance,
    isLoading: isPlatformBalanceLoading,
  } = usePlatformAvailableBalanceQuery();

  if (isLoading || isPlatformBalanceLoading) {
    return (
      <div className="mb-6 flex items-center justify-center py-10">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const {
    totalVolume,
    volumeChange,
    totalFees,
    feesChange,
    totalNet,
    conversionRate,
    completedTransactionsCount,
    filteredTransactionsCount,
    withdrawalVolume,
  } = data;

  const cards = [
    {
      label: "Saldo Disponível",
      value: formatCompact(platformBalance.totalAvailable),
      icon: Banknote,
      iconClass: "text-success",
      meta: "Soma de todas as contas",
      featured: true,
    },
    {
      label: "Volume Total",
      value: formatCompact(totalVolume),
      icon: DollarSign,
      iconClass: "text-primary",
      change: volumeChange,
    },
    {
      label: "Taxas Arrecadadas",
      value: formatCompact(totalFees),
      icon: TrendingUp,
      iconClass: "text-success",
      change: feesChange,
    },
    {
      label: "Líquido Sellers",
      value: formatCompact(totalNet),
      icon: Wallet,
      iconClass: "text-primary",
    },
    {
      label: "Taxa Conversão",
      value: `${conversionRate}%`,
      icon: Percent,
      iconClass: "text-primary",
      meta: `${completedTransactionsCount}/${filteredTransactionsCount}`,
    },
    {
      label: "Saques Realizados",
      value: formatCompact(withdrawalVolume),
      icon: ArrowDownRight,
      iconClass: "text-warning",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={cn(
            "admin-surface p-4 md:p-5",
            card.featured && "admin-surface-featured col-span-2 md:col-span-1",
          )}
        >
          <div className="mb-3 flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg bg-muted/40",
                card.featured && "bg-primary/15",
              )}
            >
              <card.icon size={15} className={card.iconClass} />
            </div>
            <span className="text-sm text-muted-foreground">{card.label}</span>
          </div>
          <p
            className={cn(
              "font-bold tracking-tight text-foreground tabular-nums",
              card.featured
                ? "text-2xl md:text-3xl"
                : "text-xl md:text-2xl",
            )}
          >
            {card.value}
          </p>
          {card.change != null && (
            <div className="mt-2">
              <ChangeIndicator value={card.change} />
            </div>
          )}
          {card.meta && (
            <span className="mt-2 block text-xs text-muted-foreground">
              {card.meta}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
