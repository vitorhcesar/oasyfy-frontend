import ConversionGauge from "@/presentation/components/ConversionGauge";
import { useHideBalance } from "@/presentation/hooks/use-hide-balance";
import { cn } from "@/presentation/utils/cn";
import {
  ArrowLeftRight,
  DollarSign,
  Percent,
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
      order: "order-1",
    },
    {
      label: "Ticket médio",
      value: formatCurrency(stats.averageTicket),
      icon: Ticket,
      accent: "bg-primary/10 text-primary",
      hideable: true,
      order: "order-2",
    },
    {
      label: "Transações",
      value: stats.transactionsCount.toString(),
      icon: ArrowLeftRight,
      accent: "bg-primary/10 text-primary",
      hideable: false,
      order: "order-3 md:order-4",
    },
    {
      label: "Lucro líquido",
      value: formatCurrency(Math.max(0, stats.netProfit)),
      icon: TrendingUp,
      accent: "bg-success/10 text-success",
      hideable: true,
      order: "order-4 md:order-5",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 md:grid-rows-2">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className={cn(
            "admin-surface flex h-full w-full flex-col p-4 md:p-5",
            stat.featured && "admin-surface-featured",
            stat.order,
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
              "mt-auto font-bold tracking-tight text-foreground tabular-nums transition-all",
              stat.featured ? "text-2xl md:text-3xl" : "text-xl md:text-2xl",
              stat.hideable && hideBalance && "blur-md select-none",
            )}
          >
            {stat.value}
          </p>
        </div>
      ))}

      <div
        className={cn(
          "admin-surface order-5 flex h-full w-full flex-col p-5 md:order-3 md:col-start-3 md:row-span-2 md:p-6",
          "col-span-2 md:col-span-1",
        )}
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Percent size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground md:text-lg">
              Taxa de conversão
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Transações aprovadas
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-2">
          <ConversionGauge
            value={stats.conversionRate}
            size="lg"
            className="pr-14"
          />
          <p className="text-center text-sm text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">
              {stats.completedTransactionsCount.toLocaleString("pt-BR")}
            </span>{" "}
            pagos de{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {stats.transactionsCount.toLocaleString("pt-BR")}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
