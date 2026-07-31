import { Progress } from "@/presentation/components/ui/progress";
import { useHideBalance } from "@/presentation/hooks/use-hide-balance";
import { cn } from "@/presentation/utils/cn";
import {
  ArrowLeftRight,
  Clock,
  DollarSign,
  Percent,
  ShieldCheck,
  Ticket,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import useSellerStatsQuery from "../hooks/use-seller-stats-query";
import { useSellerDashboardStore } from "../stores/seller-dashboard.store";
import { formatCurrency } from "../utils/format-currency";

export default function Stats() {
  const { hideBalance } = useHideBalance();
  const { timeRange, dateRange } = useSellerDashboardStore();

  const now = useMemo(() => new Date(), []);

  const rangeStart = useMemo(() => {
    if (timeRange === "custom" && dateRange?.from) return dateRange.from;
    const rangeMs = timeRange === "30d" ? 30 * 86400000 : 7 * 86400000;
    return new Date(now.getTime() - rangeMs);
  }, [timeRange, dateRange, now]);

  const rangeEnd = useMemo(() => {
    if (timeRange === "custom" && dateRange?.to) {
      const end = new Date(dateRange.to);
      end.setHours(23, 59, 59, 999);
      return end;
    }
    return now;
  }, [timeRange, dateRange, now]);

  const { data: stats } = useSellerStatsQuery({ rangeStart, rangeEnd });

  const statCards = [
    {
      label: "Saldo disponível",
      value: formatCurrency(Math.max(0, stats.availableBalance)),
      icon: DollarSign,
      accent: "bg-primary/10 text-primary",
      featured: true,
      hideable: true,
    },
    {
      label: "Saldo pendente",
      value: formatCurrency(stats.totalPending),
      icon: Clock,
      accent: "bg-warning/10 text-warning",
      hideable: true,
    },
    {
      label: "Saldo retido",
      value: formatCurrency(stats.retainedBalance),
      icon: ShieldCheck,
      accent: "bg-primary/10 text-primary",
      hideable: true,
    },
    {
      label: "Lucro líquido",
      value: formatCurrency(Math.max(0, stats.netProfit)),
      icon: TrendingUp,
      accent: "bg-success/10 text-success",
      hideable: true,
    },
    {
      label: "Transações",
      value: stats.transactionsCount.toString(),
      icon: ArrowLeftRight,
      accent: "bg-primary/10 text-primary",
      hideable: false,
    },
    {
      label: "Ticket médio",
      value: formatCurrency(stats.averageTicket),
      icon: Ticket,
      accent: "bg-primary/10 text-primary",
      hideable: true,
    },
    {
      label: "Taxa de conversão",
      value: `${stats.conversionRate}%`,
      icon: Percent,
      accent: "bg-primary/10 text-primary",
      hideable: false,
      progress: stats.conversionRate,
      meta: `${stats.completedTransactionsCount}/${stats.transactionsCount}`,
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className={cn(
            "admin-surface p-4 md:p-5",
            stat.featured && "admin-surface-featured",
          )}
        >
          <div className="mb-3 flex items-center gap-2">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl",
                stat.accent,
              )}
            >
              <stat.icon size={16} />
            </div>
            <span className="text-sm text-muted-foreground">{stat.label}</span>
          </div>
          <p
            className={cn(
              "font-bold tracking-tight text-foreground tabular-nums transition-all",
              stat.featured ? "text-2xl md:text-3xl" : "text-xl md:text-2xl",
              stat.hideable && hideBalance && "blur-md select-none",
            )}
          >
            {stat.value}
          </p>
          {stat.progress != null && (
            <Progress value={stat.progress} className="mt-3 h-2 bg-muted/60" />
          )}
          {stat.meta && (
            <span className="mt-2 block text-xs text-muted-foreground">
              {stat.meta}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
