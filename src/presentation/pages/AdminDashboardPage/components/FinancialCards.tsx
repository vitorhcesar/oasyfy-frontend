import {
  ArrowDownRight,
  DollarSign,
  Loader2,
  Percent,
  TrendingUp,
  Wallet,
} from "lucide-react";
import useAdminFinanceMetricsQuery from "../hooks/use-admin-finance-metrics-query";
import { formatCompact } from "../utils/format-compact";
import ChangeIndicator from "./ChangeIndicator";

export default function FinancialCards() {
  const { data, isLoading } = useAdminFinanceMetricsQuery();

  if (isLoading) {
    return (
      <div className="mb-5 flex items-center justify-center py-10">
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
    <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-border/50 bg-card p-4"
        >
          <div className="mb-2 flex items-center gap-2">
            <card.icon size={16} className={card.iconClass} />
            <span className="text-sm text-muted-foreground">{card.label}</span>
          </div>
          <p className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
            {card.value}
          </p>
          {card.change != null && (
            <div className="mt-1.5">
              <ChangeIndicator value={card.change} />
            </div>
          )}
          {card.meta && (
            <span className="mt-1.5 block text-xs text-muted-foreground">
              {card.meta}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
