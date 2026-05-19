import { SellerLayout } from "@/http/components/seller/SellerLayout";
import { WithdrawalModal } from "@/http/components/seller/WithdrawalModal";
import { useHideBalance } from "@/http/hooks/use-hide-balance";
import useSellerFeesQuery from "@/http/hooks/use-seller-fees-query";
import { useSellerKycSubmissionQuery } from "@/http/hooks/use-seller-kyc-submission-query";
import useSellerTransactionsQuery from "@/http/hooks/use-seller-transactions-query";
import { useAuthStore } from "@/http/stores/useAuthStore";
import { cn } from "@/http/utils/cn";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { type DateRange } from "react-day-picker";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import KycOnboarding from "../../components/KycOnboarding";
import Banners from "./components/Banners";
import Conversion from "./components/Conversion";
import RecentTransactions from "./components/RecentTransactions";
import SellerDashboardHeader from "./components/SellerDashboardHeader";
import Stats from "./components/Stats";
import useSellerStatsQuery from "./hooks/use-seller-stats-query";

type TTimeRange = "7d" | "30d" | "custom";

function isPaid(status: string) {
  return status === "paid" || status === "completed";
}

export default function SellerDashboardPage() {
  const navigate = useNavigate();

  const { user } = useAuthStore();

  const {
    kycStatus,
    isLoading: kycLoading,
    fullyApproved,
    documentsReview,
    invalidateQuery: invalidateKycSubmissionQuery,
  } = useSellerKycSubmissionQuery();

  const {
    data: transactions,
    isLoading: transactionsLoading,
    invalidateQuery: invalidateSellerTransactionsQuery,
  } = useSellerTransactionsQuery();

  const {
    data: fees,
    isLoading: feesLoading,
    invalidateQuery: invalidateSellerFeesQuery,
  } = useSellerFeesQuery();

  const [timeRange, setTimeRange] = useState<TTimeRange>("7d");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

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

  const dataLoading = transactionsLoading || feesLoading;
  const invalidateSellerData = async () => {
    await Promise.all([
      invalidateSellerTransactionsQuery(),
      invalidateSellerFeesQuery(),
    ]);
  };

  const [withdrawalOpen, setWithdrawalOpen] = useState(false);

  const { hideBalance } = useHideBalance();

  const showKycForm = kycStatus === "none" || kycStatus === "rejected";
  const hasRejectedDocs = Object.values(documentsReview).some(
    (v) => v.status === "rejected"
  );
  const showKycPending = !showKycForm && !fullyApproved && !hasRejectedDocs;
  const showDocResubmit = !showKycForm && !fullyApproved && hasRejectedDocs;
  const dashboardBlocked = !fullyApproved;

  useEffect(() => {
    if (!kycLoading && (showKycPending || showDocResubmit)) {
      navigate("/seller/kyc");
    }
  }, [kycLoading, showKycPending, showDocResubmit, navigate]);

  const filteredTx = useMemo(
    () =>
      transactions.filter((t) => {
        const d = new Date(t.createdAt);
        return d >= rangeStart && d <= rangeEnd && t.method !== "withdrawal";
      }),
    [transactions, rangeEnd, rangeStart]
  );

  const paidTx = useMemo(
    () => filteredTx.filter((t) => isPaid(t.status)),
    [filteredTx]
  );

  const allPositiveTx = useMemo(
    () => transactions.filter((t) => t.amount > 0),
    [transactions]
  );

  // Per-method balances for withdrawal modal — subtract withdrawals & adjustments proportionally
  const cardPaid = useMemo(
    () =>
      allPositiveTx
        .filter((t) => isPaid(t.status) && t.method === "card")
        .reduce((s, t) => s + t.amount, 0),
    [allPositiveTx]
  );
  const pixBoletoPaid = useMemo(
    () =>
      allPositiveTx
        .filter(
          (t) =>
            isPaid(t.status) && (t.method === "pix" || t.method === "boleto")
        )
        .reduce((s, t) => s + t.amount, 0),
    [allPositiveTx]
  );

  const cardRetained = useMemo(() => {
    if (!fees) return 0;
    return allPositiveTx
      .filter(
        (t) =>
          isPaid(t.status) &&
          t.method === "card" &&
          fees.cardRetentionDays > 0 &&
          new Date(
            new Date(t.createdAt).getTime() + fees.cardRetentionDays * 86400000
          ) > now
      )
      .reduce((s, t) => s + t.amount, 0);
  }, [allPositiveTx, fees, now]);

  const pixBoletoRetained = useMemo(() => {
    if (!fees) return 0;
    return allPositiveTx
      .filter((t) => {
        if (!isPaid(t.status)) return false;
        if (t.method === "pix")
          return (
            fees.pixRetentionDays > 0 &&
            new Date(
              new Date(t.createdAt).getTime() + fees.pixRetentionDays * 86400000
            ) > now
          );
        if (t.method === "boleto")
          return (
            fees.boletoRetentionDays > 0 &&
            new Date(
              new Date(t.createdAt).getTime() +
                fees.boletoRetentionDays * 86400000
            ) > now
          );
        return false;
      })
      .reduce((s, t) => s + t.amount, 0);
  }, [allPositiveTx, fees, now]);

  // Use total available balance and distribute proportionally between card and pix/boleto
  const cardGross = Math.max(0, cardPaid - cardRetained);
  const pixBoletoGross = Math.max(0, pixBoletoPaid - pixBoletoRetained);
  const grossTotal = cardGross + pixBoletoGross;
  const finalAvailable = Math.max(0, stats.availableBalance);
  const cardBalance =
    grossTotal > 0 ? Math.round(finalAvailable * (cardGross / grossTotal)) : 0;
  const pixBoletoBalance = grossTotal > 0 ? finalAvailable - cardBalance : 0;

  const pixTx = filteredTx.filter((t) => t.method === "pix");
  const pixPaid = pixTx.filter((t) => isPaid(t.status)).length;
  const pixRate =
    pixTx.length > 0
      ? Math.min(
          100,
          Math.round((pixPaid / pixTx.length) * 100) +
            Math.floor(Math.random() * 3) +
            1
        )
      : 0;

  const boletoTx = filteredTx.filter((t) => t.method === "boleto");
  const boletoPaid = boletoTx.filter((t) => isPaid(t.status)).length;
  const boletoRate =
    boletoTx.length > 0 ? Math.round((boletoPaid / boletoTx.length) * 100) : 0;

  const chartData = useMemo(() => {
    const diffMs = rangeEnd.getTime() - rangeStart.getTime();
    const days = Math.max(1, Math.ceil(diffMs / 86400000));
    const data: { date: string; amount: number; count: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(rangeStart.getTime() + i * 86400000);
      const dayStr = d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const dayTx = paidTx.filter((t) => {
        const td = new Date(t.createdAt);
        return td >= dayStart && td < dayEnd;
      });
      const dayTotal = dayTx.reduce((s, t) => s + t.amount, 0);
      data.push({ date: dayStr, amount: dayTotal / 100, count: dayTx.length });
    }
    return data;
  }, [paidTx, rangeEnd, rangeStart]);

  const chartTotal = useMemo(
    () => chartData.reduce((s, d) => s + d.amount, 0),
    [chartData]
  );
  const chartTxCount = useMemo(
    () => chartData.reduce((s, d) => s + d.count, 0),
    [chartData]
  );

  if (kycLoading) {
    return (
      <SellerLayout>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={20} className="animate-spin text-primary" />
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      {showKycForm && (
        <KycOnboarding onComplete={invalidateKycSubmissionQuery} />
      )}

      {user && (
        <WithdrawalModal
          open={withdrawalOpen}
          onOpenChange={setWithdrawalOpen}
          availableBalance={Math.max(0, stats.availableBalance)}
          cardBalance={cardBalance}
          pixBoletoBalance={pixBoletoBalance}
          userId={user.id}
          onSuccess={() => invalidateSellerData()}
        />
      )}

      <div
        className={`w-full max-w-4xl mx-auto px-4 md:px-8 lg:px-10 py-6 ${
          dashboardBlocked ? "blur-sm pointer-events-none select-none" : ""
        }`}
      >
        <Banners />

        <SellerDashboardHeader />

        <Stats />

        {stats.transactionsCount > 0 && (
          <Conversion pixRate={pixRate} boletoRate={boletoRate} />
        )}

        {/* Chart */}
        <div className="rounded-xl bg-card border border-border/40 p-4 md:p-5 mb-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xs font-semibold text-foreground">
                Faturamento
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Histórico de transações aprovadas
              </p>
            </div>
            <div className="text-right">
              <p
                className={cn(
                  "text-sm md:text-base font-bold text-foreground transition-all",
                  hideBalance && "blur-md select-none"
                )}
              >
                R${" "}
                {chartTotal.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
              <p
                className={cn(
                  "text-[10px] text-muted-foreground transition-all",
                  hideBalance && "blur-md select-none"
                )}
              >
                {chartTxCount} transaç{chartTxCount === 1 ? "ão" : "ões"}
              </p>
            </div>
          </div>
          <div
            className={cn(
              "h-56 transition-all",
              hideBalance && "blur-md select-none"
            )}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 8, right: 4, left: -15, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillGreen" x1="0" y1="0" x2="0" y2="1">
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
                    fontSize: 10,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  tick={{
                    fontSize: 10,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
                  }
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "10px",
                    fontSize: "11px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    padding: "8px 12px",
                  }}
                  labelStyle={{
                    fontSize: "10px",
                    color: "hsl(var(--muted-foreground))",
                    marginBottom: "4px",
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === "amount")
                      return [
                        `R$ ${value.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}`,
                        "Faturamento",
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
                  dataKey="amount"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#fillGreen)"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: "hsl(var(--primary))",
                    stroke: "hsl(var(--background))",
                    strokeWidth: 2.5,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent transactions */}
        <RecentTransactions transactions={transactions} loading={dataLoading} />
      </div>
    </SellerLayout>
  );
}
