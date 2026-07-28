import { cn } from "@/presentation/utils/cn";
import type { TransactionStat } from "../hooks/use-transaction-stats";
import { formatCurrency } from "../utils/format-currency";

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

function activeSurface(statusKey: string) {
  if (statusKey === "completed") {
    return "border-success/45 !bg-success/20";
  }
  if (statusKey === "pending" || statusKey === "refunded") {
    return "border-warning/45 !bg-warning/20";
  }
  return "border-destructive/45 !bg-destructive/20";
}

export default function AdminTransactionsStats({
  stats,
  activeStatFilter,
  onStatFilterChange,
}: IAdminTransactionsStatsProps) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
      {stats.map((stat) => {
        const statusKey = statLabelToStatusKey(stat.label);
        const isActive = activeStatFilter === statusKey;

        return (
          <button
            key={stat.label}
            type="button"
            aria-pressed={isActive}
            onClick={() => onStatFilterChange(isActive ? null : statusKey)}
            className={cn(
              "admin-surface admin-surface-interactive group p-3.5 text-left",
              isActive && activeSurface(statusKey),
            )}
          >
            <div
              className={cn(
                "mb-3 flex h-9 w-9 items-center justify-center rounded-xl",
                isActive ? "bg-black/20" : stat.bg,
                stat.color,
              )}
            >
              <stat.icon size={16} />
            </div>
            <p className="text-xl font-bold leading-none tracking-tight text-foreground tabular-nums">
              {formatCurrency(stat.value)}
            </p>
            <p
              className={cn(
                "mt-1.5 text-xs leading-tight",
                isActive
                  ? cn("font-semibold", stat.color)
                  : "text-muted-foreground",
              )}
            >
              {stat.label}
            </p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {stat.count}/{stat.total}
            </p>
          </button>
        );
      })}
    </div>
  );
}
