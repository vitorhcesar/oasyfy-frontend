import { AdminLayout } from "@/presentation/components/admin/AdminLayout";
import {
  Activity,
  Ban,
  BarChart3,
  Clock,
  DollarSign,
  Loader2,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompact } from "../utils/format-compact";
import { formatCurrency } from "../utils/format-currency";
import AdminDashboardPageHeader from "./components/AdminDashboardPageHeader";
import ChangeIndicator from "./components/ChangeIndicator";
import FeesChart from "./components/FeesChart";
import FinancialCards from "./components/FinancialCards";
import PeakHour from "./components/PeakHour";
import QuickActions from "./components/QuickActions";
import StatusCards from "./components/StatusCards";
import TopSellers from "./components/TopSellers";
import usePlatformMetricsQuery from "./hooks/use-platform-metrics-query";
import { useAdminDashboardPageStore } from "./stores/admin-dashboard-page.store";

export default function AdminDashboardPage() {
  const { data: metrics, isLoading } = usePlatformMetricsQuery();

  const { period, customFrom, customTo } = useAdminDashboardPageStore();

  const { transactions, sellerProfiles } = metrics;

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
  const avgTicket =
    completedTx.length > 0 ? Math.round(totalVolume / completedTx.length) : 0;
  const refundRate =
    completedTx.length > 0
      ? Math.round((refundedTx.length / completedTx.length) * 100)
      : 0;

  const txCountChange =
    prevCompleted.length > 0
      ? Math.round(
          ((completedTx.length - prevCompleted.length) / prevCompleted.length) *
            100,
        )
      : 0;

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

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-4 max-w-7xl mx-auto w-full">
        {/* Header */}
        <AdminDashboardPageHeader />

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <StatusCards metrics={metrics} />

            {/* Financial cards with comparison */}
            <FinancialCards />

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <FeesChart chartData={chartData} />
              <PeakHour completedTx={completedTx} />
              <TopSellers
                completedTx={completedTx}
                sellerProfiles={sellerProfiles}
              />
            </div>

            <QuickActions />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
