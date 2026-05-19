import { useHideBalance } from "@/http/hooks/use-hide-balance";
import { cn } from "@/http/utils/cn";
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
      color: "text-primary",
      bg: "bg-primary/8",
    },
    {
      label: "Saldo pendente",
      value: formatCurrency(stats.totalPending),
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/8",
    },
    {
      label: "Saldo retido",
      value: formatCurrency(stats.retainedBalance),
      icon: ShieldCheck,
      color: "text-blue-500",
      bg: "bg-blue-500/8",
    },
    {
      label: "Lucro líquido",
      value: formatCurrency(Math.max(0, stats.netProfit)),
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/8",
    },
    {
      label: "Transações",
      value: stats.transactionsCount.toString(),
      icon: ArrowLeftRight,
      color: "text-primary",
      bg: "bg-primary/8",
    },
    {
      label: "Ticket médio",
      value: formatCurrency(stats.averageTicket),
      icon: Percent,
      color: "text-primary",
      bg: "bg-primary/8",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-5">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className="group p-3.5 rounded-xl bg-card border border-border/40 hover:border-border/70 transition-all flex items-center gap-3"
        >
          <div
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
              stat.bg,
              stat.color
            )}
          >
            <stat.icon size={16} strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">
              {stat.label}
            </p>
            <p
              className={cn(
                "text-sm font-semibold text-foreground truncate transition-all",
                hideBalance && "blur-md select-none"
              )}
            >
              {stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
