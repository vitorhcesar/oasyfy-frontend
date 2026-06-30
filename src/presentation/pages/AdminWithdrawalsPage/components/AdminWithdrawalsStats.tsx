import { cn } from "@/presentation/utils/cn";
import { formatCurrency } from "../utils/format-currency";
import type { WithdrawalStat } from "../hooks/use-withdrawal-stats";

interface AdminWithdrawalsStatsProps {
  stats: WithdrawalStat[];
  activeStatFilter: string | null;
  onStatFilterChange: (key: string | null) => void;
}

export default function AdminWithdrawalsStats({
  stats,
  activeStatFilter,
  onStatFilterChange,
}: AdminWithdrawalsStatsProps) {
  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 animate-fade-in"
      style={{ animationDelay: "100ms" }}
    >
      {stats.map((stat) => {
        const isActive = activeStatFilter === stat.key;
        return (
          <button
            key={stat.label}
            onClick={() =>
              onStatFilterChange(activeStatFilter === stat.key ? null : stat.key)
            }
            className={cn(
              "p-4 rounded-xl bg-card border text-left transition-all hover:shadow-sm",
              isActive
                ? `${stat.border} ring-1 ring-offset-0`
                : "border-border/40",
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center",
                  stat.bg,
                )}
              >
                <stat.icon size={14} className={stat.color} />
              </div>
              <span className="text-xs md:text-sm font-medium text-muted-foreground">
                {stat.label}
              </span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(stat.value)}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {stat.count} solicitações
            </p>
          </button>
        );
      })}
    </div>
  );
}
