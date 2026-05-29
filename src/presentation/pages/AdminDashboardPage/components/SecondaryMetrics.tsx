import { Activity, BarChart3, DollarSign, Loader2, RefreshCcw } from "lucide-react";
import { formatCurrency } from "../../utils/format-currency";
import useAdminSecondaryMetricsQuery from "../hooks/use-admin-secondary-metrics-query";
import ChangeIndicator from "./ChangeIndicator";

export default function SecondaryMetrics() {
  const { data, isLoading } = useAdminSecondaryMetricsQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6 mb-4">
        <Loader2 size={18} className="animate-spin text-muted-foreground" />
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

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-4">
      <div className="p-2.5 rounded-lg bg-card border border-border/50 flex items-center gap-2.5">
        <Activity size={12} className="text-primary flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-[9px] text-muted-foreground leading-none">
            Ticket Médio
          </p>
          <p className="text-xs font-bold text-foreground mt-0.5">
            {formatCurrency(averageTicket)}
          </p>
        </div>
      </div>
      <div className="p-2.5 rounded-lg bg-card border border-border/50 flex items-center gap-2.5">
        <RefreshCcw size={12} className="text-destructive flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-[9px] text-muted-foreground leading-none">
            Taxa Estorno
          </p>
          <p className="text-xs font-bold text-foreground mt-0.5">
            {refundRate}%
          </p>
        </div>
      </div>
      <div className="p-2.5 rounded-lg bg-card border border-border/50 flex items-center gap-2.5">
        <BarChart3 size={12} className="text-primary flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-[9px] text-muted-foreground leading-none">
            Tx Aprovadas
          </p>
          <div className="flex items-center gap-1">
            <p className="text-xs font-bold text-foreground mt-0.5">
              {completedTransactionsCount}
            </p>
            <ChangeIndicator value={transactionsCountChange} />
          </div>
        </div>
      </div>
      <div className="hidden md:flex p-2.5 rounded-lg bg-card border border-border/50 items-center gap-2.5">
        <DollarSign size={12} className="text-primary flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-[9px] text-muted-foreground leading-none">
            Margem (Taxas/Vol)
          </p>
          <p className="text-xs font-bold text-foreground mt-0.5">
            {feeMarginRate.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}
