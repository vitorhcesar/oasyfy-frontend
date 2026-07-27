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
      <div className="mb-5 flex items-center justify-center py-8">
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

  return (
    <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
      <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4">
        <Activity size={18} className="flex-shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Ticket Médio</p>
          <p className="mt-0.5 text-lg font-bold text-foreground">
            {formatCurrency(averageTicket)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4">
        <RefreshCcw size={18} className="flex-shrink-0 text-destructive" />
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Taxa Estorno</p>
          <p className="mt-0.5 text-lg font-bold text-foreground">
            {refundRate}%
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4">
        <BarChart3 size={18} className="flex-shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Tx Aprovadas</p>
          <div className="mt-0.5 flex items-center gap-2">
            <p className="text-lg font-bold text-foreground">
              {completedTransactionsCount}
            </p>
            <ChangeIndicator value={transactionsCountChange} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4">
        <DollarSign size={18} className="flex-shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Margem (Taxas/Vol)</p>
          <p className="mt-0.5 text-lg font-bold text-foreground">
            {feeMarginRate.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}
