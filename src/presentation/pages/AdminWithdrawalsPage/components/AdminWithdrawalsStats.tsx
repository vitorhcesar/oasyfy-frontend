import { cn } from "@/presentation/utils/cn";
import type { WithdrawalStat } from "../hooks/use-withdrawal-stats";
import { formatCurrency } from "../utils/format-currency";

interface AdminWithdrawalsStatsProps {
  stats: WithdrawalStat[];
  activeStatFilter: string | null;
  onStatFilterChange: (key: string | null) => void;
}

function activeSurface(statusKey: string) {
  if (statusKey === "completed") {
    return "border-success/45 !bg-success/20";
  }
  if (statusKey === "pending") {
    return "border-warning/45 !bg-warning/20";
  }
  if (statusKey === "transferring") {
    return "border-primary/45 !bg-primary/20";
  }
  return "border-destructive/45 !bg-destructive/20";
}

export default function AdminWithdrawalsStats({
  stats,
  activeStatFilter,
  onStatFilterChange,
}: AdminWithdrawalsStatsProps) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => {
        const isActive = activeStatFilter === stat.key;

        return (
          <button
            key={stat.key}
            type="button"
            aria-pressed={isActive}
            onClick={() =>
              onStatFilterChange(isActive ? null : stat.key)
            }
            className={cn(
              "admin-surface admin-surface-interactive group p-3.5 text-left",
              isActive && activeSurface(stat.key),
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
              {stat.count} solicitações
            </p>
          </button>
        );
      })}
    </div>
  );
}
