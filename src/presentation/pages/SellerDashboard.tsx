import { supabase } from "@/infra/integrations/supabase/client";
import { SellerLayout } from "@/presentation/components/seller/SellerLayout";
import { WithdrawalModal } from "@/presentation/components/seller/WithdrawalModal";
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
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CalendarIcon,
  Clock,
  DollarSign,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Percent,
  QrCode,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
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
import KycOnboarding from "./KycOnboarding";

type KycStatus = "none" | "pending" | "under_review" | "approved" | "rejected";
type DocReview = Record<string, { status: string; reason?: string }>;

interface Transaction {
  id: string;
  amount: number;
  method: string;
  status: string;
  customer_name: string;
  created_at: string;
}

interface SellerFees {
  pix_retention_days: number;
  card_retention_days: number;
  boleto_retention_days: number;
  crypto_retention_days: number;
}

type TimeRange = "7d" | "30d" | "custom";

function isPaid(status: string) {
  return status === "paid" || status === "completed";
}

function formatCurrency(cents: number) {
  return `R$ ${(cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
  })}`;
}

function formatDateTime(date: string) {
  const d = new Date(date);
  return `${d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  })}, ${d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function getMethodLabel(method: string) {
  switch (method) {
    case "pix":
      return "Pix";
    case "card":
      return "Cartão";
    case "boleto":
      return "Boleto";
    case "crypto":
      return "Crypto";
    case "withdrawal":
      return "Saque";
    default:
      return method;
  }
}

function getMethodColor(method: string) {
  switch (method) {
    case "pix":
      return "text-primary";
    case "card":
      return "text-blue-500";
    case "boleto":
      return "text-amber-500";
    case "crypto":
      return "text-purple-500";
    default:
      return "text-primary";
  }
}

export default function SellerDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const name =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Seller";

  const [kycStatus, setKycStatus] = useState<KycStatus>("none");
  const [kycLoading, setKycLoading] = useState(true);
  const [fullyApproved, setFullyApproved] = useState(false);
  const [documentsReview, setDocumentsReview] = useState<DocReview>({});

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fees, setFees] = useState<SellerFees | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [dataLoading, setDataLoading] = useState(true);
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [banners, setBanners] = useState<
    { id: string; image_url: string; link_url: string | null }[]
  >([]);
  const [hideBalance, setHideBalance] = useState(
    () => localStorage.getItem("hideBalance") === "true"
  );

  useEffect(() => {
    if (!user) return;
    supabase
      .from("kyc_submissions")
      .select(
        "id, status, rejection_reason, documents_status, bank_status, documents_review, address_status"
      )
      .eq("user_id", user.id)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setKycStatus(data[0].status as KycStatus);
          setDocumentsReview((data[0].documents_review as DocReview) || {});
          setFullyApproved(
            data[0].status === "approved" &&
              data[0].documents_status === "approved" &&
              data[0].bank_status === "approved" &&
              data[0].address_status === "approved"
          );
        } else {
          setKycStatus("none");
        }
        setKycLoading(false);
      });
  }, [user]);

  useEffect(() => {
    supabase
      .from("banners")
      .select("id, image_url, link_url")
      .eq("is_active", true)
      .order("display_order")
      .then(({ data }) => {
        setBanners((data as any[]) ?? []);
      });
  }, []);

  const fetchData = async () => {
    if (!user) return;
    setDataLoading(true);
    const [txRes, feeRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("*")
        .eq("seller_id", user.id)
        .neq("customer_name", "Ajuste administrativo")
        .order("created_at", { ascending: false }),
      supabase
        .from("seller_fees")
        .select(
          "pix_retention_days, card_retention_days, boleto_retention_days, crypto_retention_days"
        )
        .eq("seller_id", user.id)
        .limit(1),
    ]);
    setTransactions((txRes.data as Transaction[]) || []);
    setFees((feeRes.data?.[0] as SellerFees) || null);
    setDataLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

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

  const now = new Date();
  const rangeStart = useMemo(() => {
    if (timeRange === "custom" && dateRange?.from) return dateRange.from;
    const rangeMs = timeRange === "30d" ? 30 * 86400000 : 7 * 86400000;
    return new Date(now.getTime() - rangeMs);
  }, [timeRange, dateRange]);
  const rangeEnd = useMemo(() => {
    if (timeRange === "custom" && dateRange?.to) {
      const end = new Date(dateRange.to);
      end.setHours(23, 59, 59, 999);
      return end;
    }
    return now;
  }, [timeRange, dateRange]);

  const filteredTx = useMemo(
    () =>
      transactions.filter((t) => {
        const d = new Date(t.created_at);
        return d >= rangeStart && d <= rangeEnd && t.method !== "withdrawal";
      }),
    [transactions, timeRange, dateRange]
  );

  const paidTx = useMemo(
    () => filteredTx.filter((t) => isPaid(t.status)),
    [filteredTx]
  );
  const allPositiveTx = useMemo(
    () => transactions.filter((t) => t.amount > 0),
    [transactions]
  );

  const totalPaid = useMemo(
    () =>
      allPositiveTx
        .filter((t) => isPaid(t.status))
        .reduce((s, t) => s + t.amount, 0),
    [allPositiveTx]
  );
  const totalPending = useMemo(
    () =>
      allPositiveTx
        .filter((t) => t.status === "pending")
        .reduce((s, t) => s + t.amount, 0),
    [allPositiveTx]
  );
  const totalWithdrawn = useMemo(
    () =>
      Math.abs(
        transactions
          .filter((t) => t.method === "withdrawal" && isPaid(t.status))
          .reduce((s, t) => s + t.amount, 0)
      ),
    [transactions]
  );

  const retainedBalance = useMemo(() => {
    if (!fees) return 0;
    return allPositiveTx
      .filter((t) => {
        if (!isPaid(t.status)) return false;
        const retentionDays =
          t.method === "pix"
            ? fees.pix_retention_days
            : t.method === "card"
            ? fees.card_retention_days
            : t.method === "boleto"
            ? fees.boleto_retention_days
            : fees.crypto_retention_days;
        if (!retentionDays) return false;
        const txDate = new Date(t.created_at);
        const releaseDate = new Date(
          txDate.getTime() + retentionDays * 86400000
        );
        return releaseDate > now;
      })
      .reduce((s, t) => s + t.amount, 0);
  }, [allPositiveTx, fees]);

  const availableBalance = totalPaid - totalWithdrawn - retainedBalance;
  const netProfit = totalPaid - totalWithdrawn;

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
          fees.card_retention_days > 0 &&
          new Date(
            new Date(t.created_at).getTime() +
              fees.card_retention_days * 86400000
          ) > now
      )
      .reduce((s, t) => s + t.amount, 0);
  }, [allPositiveTx, fees]);
  const pixBoletoRetained = useMemo(() => {
    if (!fees) return 0;
    return allPositiveTx
      .filter((t) => {
        if (!isPaid(t.status)) return false;
        if (t.method === "pix")
          return (
            fees.pix_retention_days > 0 &&
            new Date(
              new Date(t.created_at).getTime() +
                fees.pix_retention_days * 86400000
            ) > now
          );
        if (t.method === "boleto")
          return (
            fees.boleto_retention_days > 0 &&
            new Date(
              new Date(t.created_at).getTime() +
                fees.boleto_retention_days * 86400000
            ) > now
          );
        return false;
      })
      .reduce((s, t) => s + t.amount, 0);
  }, [allPositiveTx, fees]);

  // Use total available balance and distribute proportionally between card and pix/boleto
  const cardGross = Math.max(0, cardPaid - cardRetained);
  const pixBoletoGross = Math.max(0, pixBoletoPaid - pixBoletoRetained);
  const grossTotal = cardGross + pixBoletoGross;
  const finalAvailable = Math.max(0, availableBalance);
  const cardBalance =
    grossTotal > 0 ? Math.round(finalAvailable * (cardGross / grossTotal)) : 0;
  const pixBoletoBalance = grossTotal > 0 ? finalAvailable - cardBalance : 0;

  const totalTransactions = filteredTx.length;
  const ticketMedio =
    paidTx.length > 0
      ? Math.round(paidTx.reduce((s, t) => s + t.amount, 0) / paidTx.length)
      : 0;

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
        const td = new Date(t.created_at);
        return td >= dayStart && td < dayEnd;
      });
      const dayTotal = dayTx.reduce((s, t) => s + t.amount, 0);
      data.push({ date: dayStr, amount: dayTotal / 100, count: dayTx.length });
    }
    return data;
  }, [paidTx, timeRange, dateRange]);

  const chartTotal = useMemo(
    () => chartData.reduce((s, d) => s + d.amount, 0),
    [chartData]
  );
  const chartTxCount = useMemo(
    () => chartData.reduce((s, d) => s + d.count, 0),
    [chartData]
  );

  const recentTx = useMemo(
    () => transactions.filter((t) => t.amount > 0).slice(0, 5),
    [transactions]
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

  const statCards = [
    {
      label: "Saldo disponível",
      value: formatCurrency(Math.max(0, availableBalance)),
      icon: DollarSign,
      color: "text-primary",
      bg: "bg-primary/8",
    },
    {
      label: "Saldo pendente",
      value: formatCurrency(totalPending),
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/8",
    },
    {
      label: "Saldo retido",
      value: formatCurrency(retainedBalance),
      icon: ShieldCheck,
      color: "text-blue-500",
      bg: "bg-blue-500/8",
    },
    {
      label: "Lucro líquido",
      value: formatCurrency(Math.max(0, netProfit)),
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/8",
    },
    {
      label: "Transações",
      value: totalTransactions.toString(),
      icon: ArrowLeftRight,
      color: "text-primary",
      bg: "bg-primary/8",
    },
    {
      label: "Ticket médio",
      value: formatCurrency(ticketMedio),
      icon: Percent,
      color: "text-primary",
      bg: "bg-primary/8",
    },
  ];

  return (
    <SellerLayout>
      <div
        className={`w-full max-w-4xl mx-auto px-4 md:px-8 lg:px-10 py-6 ${
          dashboardBlocked ? "blur-sm pointer-events-none select-none" : ""
        }`}
      >
        {/* Banners */}
        {banners.length > 0 && (
          <div className="space-y-2.5 mb-6">
            {banners.map((b) =>
              b.link_url ? (
                <a
                  key={b.id}
                  href={b.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl overflow-hidden hover:opacity-95 transition-opacity"
                >
                  <img
                    src={b.image_url}
                    alt="Banner"
                    className="w-full h-auto rounded-xl object-cover max-h-[180px] md:max-h-none"
                  />
                </a>
              ) : (
                <div key={b.id} className="rounded-xl overflow-hidden">
                  <img
                    src={b.image_url}
                    alt="Banner"
                    className="w-full h-auto rounded-xl object-cover max-h-[180px] md:max-h-none"
                  />
                </div>
              )
            )}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Olá, {name.split(" ")[0]}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              Painel de controle da sua empresa
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = !hideBalance;
                setHideBalance(next);
                localStorage.setItem("hideBalance", String(next));
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border/50 text-muted-foreground text-xs md:text-sm font-medium hover:text-foreground hover:border-border transition-all"
              title={hideBalance ? "Mostrar saldo" : "Ocultar saldo"}
            >
              {hideBalance ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
            <button
              onClick={() => setWithdrawalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs md:text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <ArrowUpRight size={12} />
              Solicitar saque
            </button>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all",
                    timeRange === "custom"
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <CalendarIcon size={12} />
                  {timeRange === "custom" && dateRange?.from && dateRange?.to
                    ? `${format(dateRange.from, "dd/MM", {
                        locale: ptBR,
                      })} - ${format(dateRange.to, "dd/MM", { locale: ptBR })}`
                    : "Filtrar"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="end">
                <div className="space-y-3">
                  <p className="text-xs font-medium text-foreground">
                    Selecione o período
                  </p>
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range) => {
                      setDateRange(range);
                      if (range?.from) setTimeRange("custom");
                    }}
                    disabled={(date) => date > new Date()}
                    numberOfMonths={2}
                    className="p-2 pointer-events-auto rounded-lg border border-border/40"
                    locale={ptBR}
                  />
                  {dateRange && (
                    <button
                      onClick={() => {
                        setDateRange(undefined);
                        setTimeRange("7d");
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Limpar filtro
                    </button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Stats */}
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

        {/* Conversion - only show if there are transactions */}
        {filteredTx.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
            <div className="p-3 rounded-xl bg-card border border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center text-primary">
                  <QrCode size={13} strokeWidth={1.8} />
                </div>
                <span className="text-xs md:text-sm font-medium text-foreground">
                  Conversão PIX
                </span>
              </div>
              <span
                className={cn(
                  "text-xs md:text-sm font-bold text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md transition-all",
                  hideBalance && "blur-md select-none"
                )}
              >
                {pixRate}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center text-primary">
                  <FileText size={13} strokeWidth={1.8} />
                </div>
                <span className="text-xs md:text-sm font-medium text-foreground">
                  Conversão Boleto
                </span>
              </div>
              <span
                className={cn(
                  "text-xs md:text-sm font-bold text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md transition-all",
                  hideBalance && "blur-md select-none"
                )}
              >
                {boletoRate}%
              </span>
            </div>
          </div>
        )}

        {/* Chart */}
        {
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
        }

        {/* Recent transactions */}
        <div className="rounded-xl bg-card border border-border/40 p-4">
          <h3 className="text-xs font-semibold text-foreground mb-3">
            Últimas transações
          </h3>

          {dataLoading ? (
            <div className="flex justify-center py-4">
              <Loader2
                size={16}
                className="animate-spin text-muted-foreground"
              />
            </div>
          ) : recentTx.length === 0 ? (
            <p className="text-xs md:text-sm text-muted-foreground text-center py-4">
              Nenhuma transação encontrada.
            </p>
          ) : (
            <div className="divide-y divide-border/30">
              {recentTx.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center",
                        getMethodColor(tx.method)
                      )}
                    >
                      <ArrowDownLeft size={12} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm font-medium text-foreground">
                        {getMethodLabel(tx.method)}
                      </p>
                      <p className="text-[11px] md:text-xs text-muted-foreground">
                        {formatDateTime(tx.created_at)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold text-foreground transition-all",
                      hideBalance && "blur-md select-none"
                    )}
                  >
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {recentTx.length > 0 && (
            <button
              onClick={() => navigate("/seller/transactions")}
              className="w-full mt-3 py-2 rounded-lg bg-primary/10 text-primary text-xs md:text-sm font-medium hover:bg-primary/15 transition-colors"
            >
              Ver todas as transações
            </button>
          )}
        </div>
      </div>

      {showKycForm && (
        <KycOnboarding
          onComplete={() => {
            setKycStatus("under_review");
          }}
        />
      )}

      {user && (
        <WithdrawalModal
          open={withdrawalOpen}
          onOpenChange={setWithdrawalOpen}
          availableBalance={Math.max(0, availableBalance)}
          cardBalance={cardBalance}
          pixBoletoBalance={pixBoletoBalance}
          userId={user.id}
          onSuccess={fetchData}
        />
      )}
    </SellerLayout>
  );
}
