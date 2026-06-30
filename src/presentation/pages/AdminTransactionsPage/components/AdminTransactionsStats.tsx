import { cn } from "@/presentation/utils/cn";
import { formatCurrency } from "../utils/format-currency";
import type { TransactionStat } from "../hooks/use-transaction-stats";

interface IAdminTransactionsStatsProps {
  stats: TransactionStat[];
  activeStatFilter: string | null;
  onStatFilterChange: (statusKey: string | null) => void;
}

function statLabelToStatusKey(label: string): string {
  if (label === "Pago") return "completed";
  if (label === "Pendente") return "pending";
  if (label === "Falhou") return "failed";
  if (label === "Chargeback") return "chargeback";
  return "refunded";
}

export default function AdminTransactionsStats({
  stats,
  activeStatFilter,
  onStatFilterChange,
}: IAdminTransactionsStatsProps) {
  return (
    <div className="grid grid-cols-5 gap-2 mb-3">
      {stats.map((stat) => {
        const statusKey = statLabelToStatusKey(stat.label);
        const isActive = activeStatFilter === statusKey;
        return (
          <button
            key={stat.label}
            onClick={() =>
              onStatFilterChange(isActive ? null : statusKey)
            }
            className={cn(
              "p-2.5 rounded-lg bg-card border text-left transition-all",
              isActive
                ? `${stat.border} ring-1 ring-offset-0`
                : "border-border/40 hover:border-border/60",
            )}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <stat.icon size={12} className={stat.color} />
              <span className="text-[10px] font-medium text-muted-foreground">
                {stat.label}
              </span>
            </div>
            <p className="text-sm font-bold text-foreground leading-none">
              {formatCurrency(stat.value)}
            </p>
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">
              {stat.count}/{stat.total}
            </p>
          </button>
        );
      })}
    </div>
  );
}
