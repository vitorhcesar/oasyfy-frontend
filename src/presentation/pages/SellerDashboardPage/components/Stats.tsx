import { useHideBalance } from "@/presentation/hooks/use-hide-balance";
import { cn } from "@/presentation/utils/cn";
import {
  ArrowLeftRight,
  Clock,
  DollarSign,
  Percent,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import useSellerStatsQuery from "../hooks/use-seller-stats-query";
import { formatCurrency } from "../utils/format-currency";

export default function Stats() {
  const { hideBalance } = useHideBalance();

  const { data: stats } = useSellerStatsQuery();

  const statCards = [
    {
      label: "Saldo disponível",
      value: formatCurrency(Math.max(0, stats.availableBalance)),
      icon: DollarSign,
      accent: "bg-primary/10 text-primary",
      featured: true,
    },
    {
      label: "Saldo pendente",
      value: formatCurrency(stats.totalPending),
      icon: Clock,
      accent: "bg-warning/10 text-warning",
    },
    {
      label: "Saldo retido",
      value: formatCurrency(stats.retainedBalance),
      icon: ShieldCheck,
      accent: "bg-primary/10 text-primary",
    },
    {
      label: "Lucro líquido",
      value: formatCurrency(Math.max(0, stats.netProfit)),
      icon: TrendingUp,
      accent: "bg-success/10 text-success",
    },
    {
      label: "Transações",
      value: stats.transactionsCount.toString(),
      icon: ArrowLeftRight,
      accent: "bg-primary/10 text-primary",
    },
    {
      label: "Ticket médio",
      value: formatCurrency(stats.averageTicket),
      icon: Percent,
      accent: "bg-primary/10 text-primary",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
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
              hideBalance && "blur-md select-none",
            )}
          >
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
