import {
  ArrowDownRight,
  DollarSign,
  Loader2,
  Percent,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { formatCompact } from "../../utils/format-compact";
import useAdminFinanceMetricsQuery from "../hooks/use-admin-finance-metrics-query";
import ChangeIndicator from "./ChangeIndicator";

export default function FinancialCards() {
  const { data, isLoading } = useAdminFinanceMetricsQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 mb-4">
        <Loader2 size={18} className="animate-spin text-muted-foreground" />
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

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
      <div className="p-3 rounded-lg bg-card border border-border/50">
        <div className="flex items-center gap-1.5 mb-1">
          <DollarSign size={12} className="text-primary" />
          <span className="text-[10px] text-muted-foreground">
            Volume Total
          </span>
        </div>
        <p className="text-sm font-bold text-foreground">
          {formatCompact(totalVolume)}
        </p>
        <ChangeIndicator value={volumeChange} />
      </div>
      <div className="p-3 rounded-lg bg-card border border-border/50">
        <div className="flex items-center gap-1.5 mb-1">
          <TrendingUp size={12} className="text-success" />
          <span className="text-[10px] text-muted-foreground">
            Taxas Arrecadadas
          </span>
        </div>
        <p className="text-sm font-bold text-foreground">
          {formatCompact(totalFees)}
        </p>
        <ChangeIndicator value={feesChange} />
      </div>
      <div className="p-3 rounded-lg bg-card border border-border/50">
        <div className="flex items-center gap-1.5 mb-1">
          <Wallet size={12} className="text-primary" />
          <span className="text-[10px] text-muted-foreground">
            Líquido Sellers
          </span>
        </div>
        <p className="text-sm font-bold text-foreground">
          {formatCompact(totalNet)}
        </p>
      </div>
      <div className="p-3 rounded-lg bg-card border border-border/50">
        <div className="flex items-center gap-1.5 mb-1">
          <Percent size={12} className="text-primary" />
          <span className="text-[10px] text-muted-foreground">
            Taxa Conversão
          </span>
        </div>
        <p className="text-sm font-bold text-foreground">{conversionRate}%</p>
        <span className="text-[9px] text-muted-foreground">
          {completedTransactionsCount}/{filteredTransactionsCount}
        </span>
      </div>
      <div className="p-3 rounded-lg bg-card border border-border/50">
        <div className="flex items-center gap-1.5 mb-1">
          <ArrowDownRight size={12} className="text-warning" />
          <span className="text-[10px] text-muted-foreground">
            Saques Realizados
          </span>
        </div>
        <p className="text-sm font-bold text-foreground">
          {formatCompact(withdrawalVolume)}
        </p>
      </div>
    </div>
  );
}
