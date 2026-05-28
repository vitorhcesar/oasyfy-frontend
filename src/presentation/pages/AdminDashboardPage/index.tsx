import { AdminLayout } from "@/presentation/components/admin/AdminLayout";
import { Button } from "@/presentation/components/ui/button";
import { Calendar } from "@/presentation/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/presentation/components/ui/popover";
import { useAuthStore } from "@/presentation/stores/useAuthStore";
import { cn } from "@/presentation/utils/cn";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Activity,
  ArrowDownRight,
  Ban,
  BarChart3,
  CalendarIcon,
  Clock,
  CreditCard,
  DollarSign,
  FileCheck,
  Loader2,
  Percent,
  RefreshCcw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import usePlatformMetricsQuery from "./hooks/use-platform-metrics-query";

function formatCurrency(cents: number) {
  return `R$ ${(cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
  })}`;
}

function formatCompact(cents: number) {
  const val = cents / 100;
  if (val >= 1_000_000) return `R$ ${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `R$ ${(val / 1_000).toFixed(1)}k`;
  return formatCurrency(cents);
}

type TPeriod = "7d" | "30d" | "90d" | "custom";

export default function AdminDashboardPage() {
  const { user } = useAuthStore();

  const { data: metrics, isLoading } = usePlatformMetricsQuery();

  const navigate = useNavigate();
  const name = user?.name || user?.email || "Admin";

  const [period, setPeriod] = useState<TPeriod>("30d");
  const [customFrom, setCustomFrom] = useState<Date | undefined>(undefined);
  const [customTo, setCustomTo] = useState<Date | undefined>(undefined);

  const {
    sellersCount: sellers,
    pendingKycCount: pendingKyc,
    approvedKycCount: approvedKyc,
    rejectedKycCount: rejectedKyc,
    bannedSellersCount: bannedSellers,
    pendingWithdrawalsCount: pendingWithdrawals,
    pendingRefundsCount: pendingRefunds,
    transactions,
    sellerProfiles,
  } = metrics;

  const cutoff = useMemo(() => {
    if (period === "custom" && customFrom) return customFrom;
    const periodMs =
      period === "7d"
        ? 7 * 86400000
        : period === "30d"
          ? 30 * 86400000
          : 90 * 86400000;
    return new Date(Date.now() - periodMs);
  }, [period, customFrom]);

  const cutoffEnd = useMemo(() => {
    if (period === "custom" && customTo) {
      const end = new Date(customTo);
      end.setHours(23, 59, 59, 999);
      return end;
    }
    return new Date();
  }, [period, customTo]);

  // Previous period for comparison
  const prevCutoff = useMemo(() => {
    const diff = cutoffEnd.getTime() - cutoff.getTime();
    return new Date(cutoff.getTime() - diff);
  }, [cutoff, cutoffEnd]);

  const allNonWithdrawal = useMemo(
    () => transactions.filter((t) => t.method !== "withdrawal"),
    [transactions],
  );

  const filteredTx = useMemo(
    () =>
      allNonWithdrawal.filter((t) => {
        const d = new Date(t.createdAt);
        return d >= cutoff && d <= cutoffEnd;
      }),
    [allNonWithdrawal, cutoff, cutoffEnd],
  );

  const prevTx = useMemo(
    () =>
      allNonWithdrawal.filter((t) => {
        const d = new Date(t.createdAt);
        return d >= prevCutoff && d < cutoff;
      }),
    [allNonWithdrawal, prevCutoff, cutoff],
  );

  const completedTx = useMemo(
    () =>
      filteredTx.filter((t) => t.status === "completed" || t.status === "paid"),
    [filteredTx],
  );
  const pendingTx = useMemo(
    () => filteredTx.filter((t) => t.status === "pending"),
    [filteredTx],
  );
  const failedTx = useMemo(
    () =>
      filteredTx.filter(
        (t) => t.status === "failed" || t.status === "cancelled",
      ),
    [filteredTx],
  );
  const refundedTx = useMemo(
    () => filteredTx.filter((t) => t.status === "refunded"),
    [filteredTx],
  );

  const prevCompleted = useMemo(
    () => prevTx.filter((t) => t.status === "completed" || t.status === "paid"),
    [prevTx],
  );

  const totalVolume = completedTx.reduce((s, t) => s + t.amount, 0);
  const totalFees = completedTx.reduce((s, t) => s + t.feeAmount, 0);
  const totalNet = completedTx.reduce((s, t) => s + t.netAmount, 0);
  const avgTicket =
    completedTx.length > 0 ? Math.round(totalVolume / completedTx.length) : 0;
  const conversionRate =
    filteredTx.length > 0
      ? Math.round((completedTx.length / filteredTx.length) * 100)
      : 0;
  const refundRate =
    completedTx.length > 0
      ? Math.round((refundedTx.length / completedTx.length) * 100)
      : 0;

  // Previous period values
  const prevVolume = prevCompleted.reduce((s, t) => s + t.amount, 0);
  const prevFees = prevCompleted.reduce((s, t) => s + t.feeAmount, 0);

  const volumeChange =
    prevVolume > 0
      ? Math.round(((totalVolume - prevVolume) / prevVolume) * 100)
      : 0;
  const feesChange =
    prevFees > 0 ? Math.round(((totalFees - prevFees) / prevFees) * 100) : 0;
  const txCountChange =
    prevCompleted.length > 0
      ? Math.round(
          ((completedTx.length - prevCompleted.length) / prevCompleted.length) *
            100,
        )
      : 0;

  // Withdrawal volume
  const withdrawalTx = useMemo(
    () =>
      transactions.filter((t) => {
        const d = new Date(t.createdAt);
        return (
          t.method === "withdrawal" &&
          d >= cutoff &&
          d <= cutoffEnd &&
          (t.status === "completed" || t.status === "paid")
        );
      }),
    [transactions, cutoff, cutoffEnd],
  );
  const withdrawalVolume = withdrawalTx.reduce(
    (s, t) => s + Math.abs(t.amount),
    0,
  );

  // Chart data - daily revenue
  const chartData = useMemo(() => {
    const diffMs = cutoffEnd.getTime() - cutoff.getTime();
    const days = Math.max(1, Math.ceil(diffMs / 86400000));
    const data: {
      date: string;
      volume: number;
      fees: number;
      count: number;
    }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(cutoff.getTime() + i * 86400000);
      const dayStr = d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const dayTx = completedTx.filter((t) => {
        const td = new Date(t.createdAt);
        return td >= dayStart && td < dayEnd;
      });
      data.push({
        date: dayStr,
        volume: dayTx.reduce((s, t) => s + t.amount, 0) / 100,
        fees: dayTx.reduce((s, t) => s + t.feeAmount, 0) / 100,
        count: dayTx.length,
      });
    }
    return data;
  }, [completedTx, cutoff, cutoffEnd]);

  // Method breakdown
  const methodBreakdown = useMemo(() => {
    const methods: Record<
      string,
      { method: string; count: number; volume: number }
    > = {};
    completedTx.forEach((tx) => {
      if (!methods[tx.method])
        methods[tx.method] = { method: tx.method, count: 0, volume: 0 };
      methods[tx.method].count += 1;
      methods[tx.method].volume += tx.amount;
    });
    return Object.values(methods).sort((a, b) => b.volume - a.volume);
  }, [completedTx]);

  // Top sellers
  const topSellers = useMemo(() => {
    const map: Record<
      string,
      { sellerId: string; volume: number; count: number; fees: number }
    > = {};
    completedTx.forEach((tx) => {
      if (tx.sellerId == null) return;
      const sellerKey = String(tx.sellerId);
      if (!map[sellerKey])
        map[sellerKey] = {
          sellerId: sellerKey,
          volume: 0,
          count: 0,
          fees: 0,
        };
      map[sellerKey].volume += tx.amount;
      map[sellerKey].count += 1;
      map[sellerKey].fees += tx.feeAmount;
    });
    return Object.values(map)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);
  }, [completedTx]);

  // Status breakdown for pie chart
  const statusBreakdown = useMemo(() => {
    const data = [
      {
        name: "Aprovadas",
        value: completedTx.length,
        color: "hsl(var(--primary))",
      },
      {
        name: "Pendentes",
        value: pendingTx.length,
        color: "hsl(38, 90%, 50%)",
      },
      {
        name: "Falhadas",
        value: failedTx.length,
        color: "hsl(var(--destructive))",
      },
      {
        name: "Estornadas",
        value: refundedTx.length,
        color: "hsl(280, 60%, 55%)",
      },
    ].filter((d) => d.value > 0);
    return data;
  }, [
    completedTx.length,
    pendingTx.length,
    failedTx.length,
    refundedTx.length,
  ]);

  // Hourly distribution
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}h`,
      count: 0,
    }));
    completedTx.forEach((tx) => {
      const h = new Date(tx.createdAt).getHours();
      hours[h].count += 1;
    });
    return hours;
  }, [completedTx]);

  const methodLabels: Record<string, string> = {
    pix: "Pix",
    card: "Cartão",
    boleto: "Boleto",
    crypto: "Crypto",
  };
  const methodColors: Record<string, string> = {
    pix: "hsl(var(--primary))",
    card: "hsl(220, 70%, 55%)",
    boleto: "hsl(38, 90%, 50%)",
    crypto: "hsl(280, 60%, 55%)",
  };

  const getSellerName = (sellerId: string) => {
    const p = sellerProfiles.find((s) => String(s.userId) === sellerId);
    return p?.fullName || sellerId.slice(0, 8);
  };

  const ChangeIndicator = ({ value }: { value: number }) => {
    if (value === 0) return null;
    const isPositive = value > 0;
    return (
      <span
        className={cn(
          "inline-flex items-center gap-0.5 text-[9px] font-semibold",
          isPositive ? "text-emerald-500" : "text-destructive",
        )}
      >
        {isPositive ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
        {isPositive ? "+" : ""}
        {value}%
      </span>
    );
  };

  const statCards = [
    {
      label: "Total de Sellers",
      value: sellers,
      icon: Users,
      accent: "bg-primary/10 text-primary",
      link: "/admin/sellers",
    },
    {
      label: "KYC Pendentes",
      value: pendingKyc,
      icon: FileCheck,
      accent: "bg-warning/10 text-warning",
      link: "/admin/kyc",
    },
    {
      label: "KYC Aprovados",
      value: approvedKyc,
      icon: ShieldCheck,
      accent: "bg-success/10 text-success",
      link: "/admin/kyc",
    },
    {
      label: "KYC Rejeitados",
      value: rejectedKyc,
      icon: Ban,
      accent: "bg-destructive/10 text-destructive",
      link: "/admin/kyc",
    },
    {
      label: "Sellers Banidos",
      value: bannedSellers,
      icon: Ban,
      accent: "bg-destructive/10 text-destructive",
      link: "/admin/sellers",
    },
    {
      label: "Saques Pendentes",
      value: pendingWithdrawals,
      icon: Wallet,
      accent: "bg-warning/10 text-warning",
      link: "/admin/withdrawals",
    },
    {
      label: "Estornos Pendentes",
      value: pendingRefunds,
      icon: RefreshCcw,
      accent: "bg-primary/10 text-primary",
      link: "/admin/refunds",
    },
    {
      label: "Total Transações",
      value: filteredTx.length,
      icon: CreditCard,
      accent: "bg-primary/10 text-primary",
      link: "/admin/transactions",
    },
  ];

  const quickActions = [
    {
      label: "Revisar KYCs",
      description: "Aprovar ou rejeitar verificações",
      icon: FileCheck,
      link: "/admin/kyc",
    },
    {
      label: "Ver Sellers",
      description: "Gerenciar contas de sellers",
      icon: Users,
      link: "/admin/sellers",
    },
    {
      label: "Transações",
      description: "Visualizar pagamentos",
      icon: CreditCard,
      link: "/admin/transactions",
    },
    {
      label: "Saques",
      description: "Gerenciar saques pendentes",
      icon: Wallet,
      link: "/admin/withdrawals",
    },
    {
      label: "Estornos",
      description: "Analisar solicitações",
      icon: RefreshCcw,
      link: "/admin/refunds",
    },
    {
      label: "Configurações",
      description: "Personalizar gateway",
      icon: Activity,
      link: "/admin/general",
    },
  ];

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-4 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 animate-fade-in">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                Painel Administrativo
              </span>
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Olá, {name.split(" ")[0]}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-0.5">
              {(["7d", "30d", "90d"] as TPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPeriod(p);
                    setCustomFrom(undefined);
                    setCustomTo(undefined);
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all",
                    period === p
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-7 text-[11px] gap-1.5 font-medium",
                    period === "custom" && "border-primary text-primary",
                  )}
                >
                  <CalendarIcon size={12} />
                  {period === "custom" && customFrom && customTo
                    ? `${format(customFrom, "dd/MM", {
                        locale: ptBR,
                      })} - ${format(customTo, "dd/MM", { locale: ptBR })}`
                    : "Período"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="end">
                <p className="text-xs font-medium text-foreground mb-2">
                  Selecione o período
                </p>
                <Calendar
                  mode="range"
                  selected={
                    customFrom && customTo
                      ? { from: customFrom, to: customTo }
                      : undefined
                  }
                  onSelect={(range) => {
                    if (range?.from) {
                      setCustomFrom(range.from);
                      setCustomTo(range.to);
                      if (range.from && range.to) setPeriod("custom");
                    }
                  }}
                  disabled={(date) => date > new Date()}
                  numberOfMonths={2}
                  locale={ptBR}
                  className="pointer-events-auto"
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Status cards */}
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-4">
              {statCards.map((card) => (
                <button
                  key={card.label}
                  onClick={() => navigate(card.link)}
                  className="group p-2.5 rounded-lg bg-card border border-border/50 hover:border-border transition-all text-left"
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center mb-1.5",
                      card.accent,
                    )}
                  >
                    <card.icon size={12} />
                  </div>
                  <p className="text-base font-bold text-foreground leading-none">
                    {card.value}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">
                    {card.label}
                  </p>
                </button>
              ))}
            </div>

            {/* Financial cards with comparison */}
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
                <p className="text-sm font-bold text-foreground">
                  {conversionRate}%
                </p>
                <span className="text-[9px] text-muted-foreground">
                  {completedTx.length}/{filteredTx.length}
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

            {/* Secondary metrics row */}
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-4">
              <div className="p-2.5 rounded-lg bg-card border border-border/50 flex items-center gap-2.5">
                <Activity size={12} className="text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] text-muted-foreground leading-none">
                    Ticket Médio
                  </p>
                  <p className="text-xs font-bold text-foreground mt-0.5">
                    {formatCurrency(avgTicket)}
                  </p>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-card border border-border/50 flex items-center gap-2.5">
                <RefreshCcw
                  size={12}
                  className="text-destructive flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-[9px] text-muted-foreground leading-none">
                    Taxa Estorno
                  </p>
                  <p className="text-xs font-bold text-foreground mt-0.5">
                    {refundRate}%
                  </p>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-card border border-border/50 flex items-center gap-2.5">
                <BarChart3 size={12} className="text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] text-muted-foreground leading-none">
                    Tx Aprovadas
                  </p>
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-bold text-foreground mt-0.5">
                      {completedTx.length}
                    </p>
                    <ChangeIndicator value={txCountChange} />
                  </div>
                </div>
              </div>
              <div className="hidden md:flex p-2.5 rounded-lg bg-card border border-border/50 items-center gap-2.5">
                <DollarSign size={12} className="text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] text-muted-foreground leading-none">
                    Margem (Taxas/Vol)
                  </p>
                  <p className="text-xs font-bold text-foreground mt-0.5">
                    {totalVolume > 0
                      ? ((totalFees / totalVolume) * 100).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>

            {/* Revenue chart + Status breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="md:col-span-2 rounded-xl bg-card border border-border/50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-foreground">
                    Faturamento
                  </h3>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={10} className="text-success" />
                      {completedTx.length} aprovadas
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} className="text-warning" />
                      {pendingTx.length} pendentes
                    </span>
                    <span className="flex items-center gap-1">
                      <Ban size={10} className="text-destructive" />
                      {failedTx.length} falhadas
                    </span>
                  </div>
                </div>
                {chartData.length > 0 ? (
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="adminFill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="hsl(var(--primary))"
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="60%"
                              stopColor="hsl(var(--primary))"
                              stopOpacity={0.05}
                            />
                            <stop
                              offset="100%"
                              stopColor="hsl(var(--primary))"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="4 4"
                          stroke="hsl(var(--border))"
                          opacity={0.25}
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          tick={{
                            fontSize: 9,
                            fill: "hsl(var(--muted-foreground))",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{
                            fontSize: 9,
                            fill: "hsl(var(--muted-foreground))",
                          }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) =>
                            v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "10px",
                            fontSize: "10px",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                            padding: "8px 12px",
                          }}
                          formatter={(value: number, name: string) => {
                            if (name === "volume")
                              return [
                                `R$ ${value.toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                })}`,
                                "Volume",
                              ];
                            return [value, name];
                          }}
                          cursor={{
                            stroke: "hsl(var(--primary))",
                            strokeWidth: 1,
                            strokeDasharray: "4 4",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="volume"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fill="url(#adminFill)"
                          dot={false}
                          activeDot={{
                            r: 4,
                            fill: "hsl(var(--primary))",
                            stroke: "hsl(var(--background))",
                            strokeWidth: 2,
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Sem dados no período
                  </p>
                )}
              </div>

              {/* Status + Method */}
              <div className="rounded-xl bg-card border border-border/50 p-3 flex flex-col gap-4">
                {/* Pie chart */}
                {statusBreakdown.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-foreground mb-1">
                      Status das transações
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-20">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={statusBreakdown}
                              dataKey="value"
                              cx="50%"
                              cy="50%"
                              innerRadius={18}
                              outerRadius={36}
                              strokeWidth={0}
                            >
                              {statusBreakdown.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-1">
                        {statusBreakdown.map((s) => (
                          <div
                            key={s.name}
                            className="flex items-center gap-1.5"
                          >
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: s.color }}
                            />
                            <span className="text-[10px] text-muted-foreground">
                              {s.name}
                            </span>
                            <span className="text-[10px] font-semibold text-foreground">
                              {s.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Method breakdown */}
                <div>
                  <h3 className="text-xs font-semibold text-foreground mb-2">
                    Por método
                  </h3>
                  {methodBreakdown.length > 0 ? (
                    <div className="space-y-2">
                      {methodBreakdown.map((m) => {
                        const pct =
                          completedTx.length > 0
                            ? Math.round((m.count / completedTx.length) * 100)
                            : 0;
                        return (
                          <div key={m.method}>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[11px] font-medium text-foreground">
                                {methodLabels[m.method] || m.method}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {formatCompact(m.volume)} ({pct}%)
                              </span>
                            </div>
                            <div className="h-1 bg-muted/50 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor:
                                    methodColors[m.method] ||
                                    "hsl(var(--primary))",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Sem dados
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Fees chart + Horário pico + Top sellers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {/* Fees chart */}
              <div className="rounded-xl bg-card border border-border/50 p-3">
                <h3 className="text-xs font-semibold text-foreground mb-2">
                  Taxas arrecadadas
                </h3>
                {chartData.length > 0 ? (
                  <div className="h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                          opacity={0.3}
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          tick={{
                            fontSize: 8,
                            fill: "hsl(var(--muted-foreground))",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{
                            fontSize: 8,
                            fill: "hsl(var(--muted-foreground))",
                          }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `R$${v}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "10px",
                          }}
                          formatter={(value: number) => [
                            `R$ ${value.toFixed(2)}`,
                            "Taxas",
                          ]}
                        />
                        <Bar
                          dataKey="fees"
                          fill="hsl(var(--primary))"
                          radius={[3, 3, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    Sem dados
                  </p>
                )}
              </div>

              {/* Horário de pico */}
              <div className="rounded-xl bg-card border border-border/50 p-3">
                <h3 className="text-xs font-semibold text-foreground mb-2">
                  Horário de pico
                </h3>
                {completedTx.length > 0 ? (
                  <div className="h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={hourlyData}
                        margin={{ top: 5, right: 2, left: -20, bottom: 0 }}
                      >
                        <XAxis
                          dataKey="hour"
                          tick={{
                            fontSize: 7,
                            fill: "hsl(var(--muted-foreground))",
                          }}
                          axisLine={false}
                          tickLine={false}
                          interval={2}
                        />
                        <YAxis
                          tick={{
                            fontSize: 7,
                            fill: "hsl(var(--muted-foreground))",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "10px",
                          }}
                          formatter={(value: number) => [value, "Transações"]}
                        />
                        <Bar
                          dataKey="count"
                          fill="hsl(var(--primary))"
                          radius={[2, 2, 0, 0]}
                          opacity={0.7}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    Sem dados
                  </p>
                )}
              </div>

              {/* Top Sellers */}
              <div className="rounded-xl bg-card border border-border/50 p-3">
                <h3 className="text-xs font-semibold text-foreground mb-2">
                  Top Sellers
                </h3>
                {topSellers.length > 0 ? (
                  <div className="space-y-2">
                    {topSellers.map((s, i) => (
                      <div key={s.sellerId} className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0",
                            i === 0
                              ? "bg-primary/15 text-primary"
                              : "bg-muted/60 text-muted-foreground",
                          )}
                        >
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-foreground truncate">
                            {getSellerName(s.sellerId)}
                          </p>
                          <p className="text-[9px] text-muted-foreground">
                            {s.count} tx · {formatCompact(s.volume)}
                          </p>
                        </div>
                        <span className="text-[9px] text-muted-foreground">
                          {formatCompact(s.fees)} tax
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    Sem dados
                  </p>
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div className="rounded-xl bg-card border border-border/50 p-3">
              <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Activity size={11} className="text-primary" /> Ações rápidas
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.link)}
                    className="group flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-all text-left"
                  >
                    <div className="w-6 h-6 rounded-md bg-muted/60 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                      <action.icon
                        size={11}
                        className="text-muted-foreground group-hover:text-primary transition-colors"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-foreground leading-none">
                        {action.label}
                      </p>
                      <p className="text-[9px] text-muted-foreground truncate mt-0.5">
                        {action.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
