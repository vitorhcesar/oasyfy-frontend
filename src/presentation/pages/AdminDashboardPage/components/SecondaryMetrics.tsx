import {
  Activity,
  BarChart3,
  DollarSign,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import useAdminSecondaryMetricsQuery from "../hooks/use-admin-secondary-metrics-query";
import { formatCurrency } from "../utils/format-currency";
import ChangeIndicator from "./ChangeIndicator";

export default function SecondaryMetrics() {
  const { data, isLoading } = useAdminSecondaryMetricsQuery();

  if (isLoading) {
    return (
      <div className="mb-6 flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const {
    averageTicket,
    refundRate,
    completedTransactionsCount,
    transactionsCountChange,
    feeMarginRate,
  } = data;

  const metrics = [
    {
      label: "Ticket Médio",
      value: formatCurrency(averageTicket),
      icon: Activity,
      iconClass: "text-primary",
    },
    {
      label: "Taxa Estorno",
      value: `${refundRate}%`,
      icon: RefreshCcw,
      iconClass: "text-destructive",
    },
    {
      label: "Tx Aprovadas",
      value: String(completedTransactionsCount),
      icon: BarChart3,
      iconClass: "text-primary",
      change: transactionsCountChange,
    },
    {
      label: "Margem (Taxas/Vol)",
      value: `${feeMarginRate.toFixed(1)}%`,
      icon: DollarSign,
      iconClass: "text-primary",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="admin-surface flex items-center gap-3.5 p-4"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-muted/40">
            <m.icon size={18} className={m.iconClass} />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{m.label}</p>
            <div className="mt-0.5 flex items-center gap-2">
              <p className="text-lg font-bold tabular-nums text-foreground">
                {m.value}
              </p>
              {m.change != null && <ChangeIndicator value={m.change} />}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
