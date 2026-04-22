import { supabase } from "@/infrastructure/integrations/supabase/client";
import { AdminLayout } from "@/presentation/components/admin/AdminLayout";
import { Calendar } from "@/presentation/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/presentation/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/presentation/components/ui/popover";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/presentation/components/ui/tabs";
import { cn } from "@/presentation/utils/cn";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  DollarSign,
  Eye,
  Lock,
  RotateCcw,
  Search,
  Unlock,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { type DateRange } from "react-day-picker";
import { toast } from "sonner";

type Transaction = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  customer_name: string;
  customer_email: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  seller_id: string | null;
  metadata: Record<string, unknown> | null;
  pix_code: string | null;
  is_locked: boolean;
  is_fake_refund: boolean;
  lock_reason: string | null;
  refund_reason: string | null;
  acquirer: string | null;
  fee_amount: number;
  net_amount: number;
};

type SellerInfo = {
  full_name: string | null;
  account_id: string;
  email?: string;
};

const methodOptions = [
  { value: "", label: "Todos" },
  { value: "pix", label: "PIX" },
  { value: "card", label: "Cartão" },
  { value: "boleto", label: "Boleto" },
  { value: "crypto", label: "Crypto" },
  { value: "withdrawal", label: "Saque" },
];

const acquirerOptions = [
  { value: "", label: "Todas" },
  { value: "Gateway interno", label: "Gateway interno" },
  { value: "Cielo", label: "Cielo" },
  { value: "Rede", label: "Rede" },
  { value: "Stone", label: "Stone" },
  { value: "Cartwave", label: "Cartwave" },
];

const statusOptions = [
  { value: "", label: "Todos" },
  { value: "completed", label: "Pago" },
  { value: "pending", label: "Pendente" },
  { value: "failed", label: "Falhou" },
  { value: "refunded", label: "Reembolsado" },
  { value: "chargeback", label: "Chargeback" },
];

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [sellerInfo, setSellerInfo] = useState<SellerInfo | null>(null);
  const [sellerKyc, setSellerKyc] = useState<{
    email?: string;
    cpf?: string;
    cnpj?: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [lockReason, setLockReason] = useState("");
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [showFakeRefundForm, setShowFakeRefundForm] = useState(false);
  const [showLockForm, setShowLockForm] = useState(false);

  // Filters
  const [filterId, setFilterId] = useState("");
  const [filterPixCode, setFilterPixCode] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [filterAcquirer, setFilterAcquirer] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTimeRange, setFilterTimeRange] = useState("7d");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [pixSearchResults, setPixSearchResults] = useState<
    Transaction[] | null
  >(null);
  const [pixSearchLoading, setPixSearchLoading] = useState(false);

  const searchByPixCode = async (code: string) => {
    if (code.trim().length < 3) {
      setPixSearchResults(null);
      return;
    }
    setPixSearchLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-pix", {
        body: { pix_code: code.trim() },
      });
      if (error) throw error;
      setPixSearchResults((data?.transactions as Transaction[]) ?? []);
    } catch {
      setPixSearchResults([]);
    }
    setPixSearchLoading(false);
  };

  const fetchTransactions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    setTransactions((data as Transaction[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Fetch seller info when a transaction is selected
  useEffect(() => {
    if (!selectedTx?.seller_id) {
      setSellerInfo(null);
      setSellerKyc(null);
      return;
    }
    const fetchSeller = async () => {
      const [profileRes, kycRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, account_id")
          .eq("user_id", selectedTx.seller_id!)
          .single(),
        supabase
          .from("kyc_submissions")
          .select("email, cpf, cnpj")
          .eq("user_id", selectedTx.seller_id!)
          .single(),
      ]);
      setSellerInfo(
        profileRes.data
          ? { ...profileRes.data, email: kycRes.data?.email || undefined }
          : null
      );
      setSellerKyc(
        kycRes.data
          ? {
              email: kycRes.data.email ?? undefined,
              cpf: kycRes.data.cpf ?? undefined,
              cnpj: kycRes.data.cnpj ?? undefined,
            }
          : null
      );
    };
    fetchSeller();
  }, [selectedTx?.seller_id]);

  // Actions
  const handleRefund = async (fake: boolean) => {
    if (!selectedTx || !refundReason.trim()) return;
    setActionLoading(true);
    try {
      const updates = {
        status: "refunded",
        refund_reason: refundReason.trim(),
        is_fake_refund: fake,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", selectedTx.id);
      if (error) throw error;

      // Also create refund_request record
      await supabase.from("refund_requests").insert({
        transaction_id: selectedTx.id,
        seller_id: selectedTx.seller_id!,
        amount: selectedTx.amount,
        reason: refundReason.trim(),
        status: "approved",
        admin_note: fake
          ? "Reembolso fake - saldo não devolvido"
          : "Reembolso real aprovado pelo admin",
        reviewed_at: new Date().toISOString(),
      });

      toast.success(fake ? "Reembolso fake aplicado" : "Reembolso realizado");
      setSelectedTx({ ...selectedTx, ...updates } as Transaction);
      setShowRefundForm(false);
      setShowFakeRefundForm(false);
      setRefundReason("");
      fetchTransactions();
    } catch (err) {
      toast.error("Erro ao processar reembolso");
      console.error(err);
    }
    setActionLoading(false);
  };

  const handleLockToggle = async () => {
    if (!selectedTx) return;
    const isLocking = !selectedTx.is_locked;
    if (isLocking && !lockReason.trim()) return;
    setActionLoading(true);
    try {
      const updates = {
        is_locked: isLocking,
        lock_reason: isLocking ? lockReason.trim() : null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", selectedTx.id);
      if (error) throw error;
      toast.success(isLocking ? "Venda travada" : "Venda destravada");
      setSelectedTx({ ...selectedTx, ...updates } as Transaction);
      setShowLockForm(false);
      setLockReason("");
      fetchTransactions();
    } catch {
      toast.error("Erro ao alterar status");
    }
    setActionLoading(false);
  };

  const filtered = useMemo(() => {
    const now = new Date();

    let cutoff: Date | null = null;
    if (filterTimeRange === "7d") {
      cutoff = new Date(now.getTime() - 7 * 86400000);
    } else if (filterTimeRange === "30d") {
      cutoff = new Date(now.getTime() - 30 * 86400000);
    } else if (filterTimeRange === "90d") {
      cutoff = new Date(now.getTime() - 90 * 86400000);
    }

    return transactions.filter((t) => {
      if (filterId && !t.id.toLowerCase().includes(filterId.toLowerCase()))
        return false;
      if (
        filterCustomer &&
        !t.customer_name.toLowerCase().includes(filterCustomer.toLowerCase()) &&
        !(t.customer_email || "")
          .toLowerCase()
          .includes(filterCustomer.toLowerCase())
      )
        return false;
      if (filterMethod) {
        if (t.method !== filterMethod) return false;
      } else {
        if (t.method === "withdrawal") return false;
      }
      if (
        filterAcquirer &&
        (t.acquirer || "Gateway interno") !== filterAcquirer
      )
        return false;
      if (filterStatus && t.status !== filterStatus) return false;
      if (dateRange?.from) {
        const txDate = new Date(t.created_at);
        if (txDate < dateRange.from) return false;
        if (dateRange.to) {
          const endOfDay = new Date(dateRange.to);
          endOfDay.setHours(23, 59, 59, 999);
          if (txDate > endOfDay) return false;
        }
      } else if (cutoff && new Date(t.created_at) < cutoff) return false;
      return true;
    });
  }, [
    transactions,
    filterId,
    filterCustomer,
    filterMethod,
    filterAcquirer,
    filterStatus,
    filterTimeRange,
    dateRange,
  ]);

  const stats = useMemo(() => {
    const paid = filtered.filter(
      (t) => t.status === "completed" && t.method !== "withdrawal"
    );
    const pending = filtered.filter((t) => t.status === "pending");
    const failed = filtered.filter((t) => t.status === "failed");
    const refunded = filtered.filter((t) => t.status === "refunded");
    const chargeback = filtered.filter((t) => t.status === "chargeback");
    const total = filtered.length;
    const sum = (arr: Transaction[]) => arr.reduce((a, t) => a + t.amount, 0);
    return [
      {
        label: "Pago",
        value: sum(paid),
        count: paid.length,
        total,
        icon: DollarSign,
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/30",
      },
      {
        label: "Pendente",
        value: sum(pending),
        count: pending.length,
        total,
        icon: Clock,
        color: "text-yellow-600",
        bg: "bg-yellow-500/10",
        border: "border-yellow-200",
      },
      {
        label: "Falhou",
        value: sum(failed),
        count: failed.length,
        total,
        icon: XCircle,
        color: "text-destructive",
        bg: "bg-destructive/10",
        border: "border-destructive/20",
      },
      {
        label: "Chargeback",
        value: sum(chargeback),
        count: chargeback.length,
        total,
        icon: XCircle,
        color: "text-destructive",
        bg: "bg-destructive/10",
        border: "border-destructive/20",
      },
      {
        label: "Reembolsado",
        value: sum(refunded),
        count: refunded.length,
        total,
        icon: RotateCcw,
        color: "text-destructive",
        bg: "bg-destructive/10",
        border: "border-destructive/20",
      },
    ];
  }, [filtered]);

  const [activeStatFilter, setActiveStatFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  const baseFiltered = useMemo(() => {
    if (pixSearchResults !== null) return pixSearchResults;
    if (!activeStatFilter) return filtered;
    return filtered.filter((t) => t.status === activeStatFilter);
  }, [filtered, activeStatFilter, pixSearchResults]);

  const displayFiltered = baseFiltered;
  const totalPages = Math.max(1, Math.ceil(displayFiltered.length / perPage));
  const paginatedData = displayFiltered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filtered, activeStatFilter]);

  const statusConfig: Record<
    string,
    { label: string; cls: string; dot: string }
  > = {
    pending: {
      label: "Pendente",
      cls: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
      dot: "bg-yellow-500",
    },
    completed: {
      label: "Completa",
      cls: "bg-primary/10 text-primary border-primary/20",
      dot: "bg-primary",
    },
    failed: {
      label: "Falhou",
      cls: "bg-destructive/10 text-destructive border-destructive/20",
      dot: "bg-destructive",
    },
    cancelled: {
      label: "Cancelada",
      cls: "bg-muted text-muted-foreground border-border",
      dot: "bg-muted-foreground/40",
    },
    refunded: {
      label: "Reembolsado",
      cls: "bg-orange-500/10 text-orange-600 border-orange-200",
      dot: "bg-orange-500",
    },
    chargeback: {
      label: "Chargeback",
      cls: "bg-destructive/10 text-destructive border-destructive/20",
      dot: "bg-destructive",
    },
  };

  const statusBadge = (status: string) => {
    const s = statusConfig[status] || {
      label: status,
      cls: "bg-muted text-muted-foreground",
      dot: "bg-muted-foreground/40",
    };
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs md:text-sm font-medium border ${s.cls}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        {s.label}
      </span>
    );
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount / 100);

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";
  const selectClass =
    "w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all appearance-none cursor-pointer";

  const resetDetailForms = () => {
    setShowRefundForm(false);
    setShowFakeRefundForm(false);
    setShowLockForm(false);
    setRefundReason("");
    setLockReason("");
  };

  const openDetail = (tx: Transaction) => {
    resetDetailForms();
    setSelectedTx(tx);
  };

  const methodLabel: Record<string, string> = {
    pix: "PIX",
    card: "Cartão de Crédito",
    boleto: "Boleto",
    crypto: "Crypto",
    withdrawal: "Saque",
  };

  return (
    <AdminLayout>
      <div className="px-4 md:px-6 py-4 max-w-6xl mx-auto w-full">
        {/* Header + Stats inline */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Vendas</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gerencie todas as transações do gateway
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border",
                    dateRange?.from
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-card border-border/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <CalendarIcon size={11} />
                  {dateRange?.from && dateRange?.to
                    ? `${format(dateRange.from, "dd/MM", {
                        locale: ptBR,
                      })} - ${format(dateRange.to, "dd/MM", { locale: ptBR })}`
                    : "Período"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    setDateRange(range);
                    if (range?.from) setFilterTimeRange("custom");
                  }}
                  numberOfMonths={2}
                  locale={ptBR}
                  className="pointer-events-auto"
                  initialFocus
                />
                {dateRange && (
                  <button
                    onClick={() => {
                      setDateRange(undefined);
                      setFilterTimeRange("7d");
                    }}
                    className="text-xs text-primary hover:underline mt-2"
                  >
                    Limpar
                  </button>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Stat Cards - compact row */}
        <div className="grid grid-cols-5 gap-2 mb-3">
          {stats.map((stat) => {
            const statusKey =
              stat.label === "Pago"
                ? "completed"
                : stat.label === "Pendente"
                ? "pending"
                : stat.label === "Falhou"
                ? "failed"
                : stat.label === "Chargeback"
                ? "chargeback"
                : "refunded";
            const isActive = activeStatFilter === statusKey;
            return (
              <button
                key={stat.label}
                onClick={() =>
                  setActiveStatFilter((prev) =>
                    prev === statusKey ? null : statusKey
                  )
                }
                className={cn(
                  "p-2.5 rounded-lg bg-card border text-left transition-all",
                  isActive
                    ? `${stat.border} ring-1 ring-offset-0`
                    : "border-border/40 hover:border-border/60"
                )}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <stat.icon size={12} className={stat.color} />
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {stat.label}
                  </span>
                </div>
                <p className="text-sm font-bold text-foreground leading-none">
                  {formatCurrency(stat.value)}
                </p>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                  {stat.count}/{stat.total}
                </p>
              </button>
            );
          })}
        </div>

        {/* Compact Filters */}
        <div className="rounded-lg bg-card border border-border/40 p-3 mb-3">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 items-end">
            <div>
              <input
                type="text"
                value={filterId}
                onChange={(e) => setFilterId(e.target.value)}
                placeholder="ID transação"
                className={inputClass}
              />
            </div>
            <div className="relative">
              <input
                type="text"
                value={filterPixCode}
                onChange={(e) => {
                  setFilterPixCode(e.target.value);
                  if (!e.target.value.trim()) setPixSearchResults(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") searchByPixCode(filterPixCode);
                }}
                placeholder="PIX / End2End"
                className={inputClass}
              />
              {filterPixCode.trim().length >= 3 && (
                <button
                  onClick={() => searchByPixCode(filterPixCode)}
                  disabled={pixSearchLoading}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium"
                >
                  {pixSearchLoading ? "..." : "⏎"}
                </button>
              )}
            </div>
            <div className="relative">
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className={selectClass}
              >
                {methodOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={10}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none"
              />
            </div>
            <div className="relative">
              <select
                value={filterAcquirer}
                onChange={(e) => setFilterAcquirer(e.target.value)}
                className={selectClass}
              >
                {acquirerOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={10}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none"
              />
            </div>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={selectClass}
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={10}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none"
              />
            </div>
            <div>
              <input
                type="text"
                value={filterCustomer}
                onChange={(e) => setFilterCustomer(e.target.value)}
                placeholder="Cliente"
                className={inputClass}
              />
            </div>
            <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all">
              <Search size={12} />
              Buscar
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full border-2 border-muted" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
            </div>
          </div>
        ) : displayFiltered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/50 bg-muted/10 p-12 text-center">
            <CreditCard
              className="text-muted-foreground/30 mx-auto mb-3"
              size={20}
            />
            <p className="text-sm font-medium text-foreground mb-0.5">
              Nenhuma transação
            </p>
            <p className="text-xs text-muted-foreground">
              As transações aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/40 bg-card overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border/30 bg-muted/20">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">
                    Método
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">
                    Data
                  </th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wider w-16"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-border/10 last:border-0 hover:bg-muted/10 transition-colors cursor-pointer"
                    onClick={() => openDetail(tx)}
                  >
                    <td className="px-3 py-2">
                      <p className="font-medium text-foreground text-xs">
                        {tx.customer_name || "Cliente padrão"}
                      </p>
                      {tx.customer_email && (
                        <p className="text-[10px] text-muted-foreground/50 truncate max-w-[160px]">
                          {tx.customer_email}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2 font-semibold text-foreground text-xs">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[10px] uppercase font-medium text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                        {tx.method}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        {(() => {
                          const s = statusConfig[tx.status] || {
                            label: tx.status,
                            dot: "bg-muted-foreground/40",
                          };
                          return (
                            <span className="flex items-center gap-1">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${s.dot}`}
                              />
                              <span className="text-[11px] font-medium text-foreground">
                                {s.label}
                              </span>
                            </span>
                          );
                        })()}
                        {tx.is_locked && (
                          <Lock size={10} className="text-destructive" />
                        )}
                        {tx.is_fake_refund && (
                          <Eye size={10} className="text-orange-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-[11px]">
                      {format(new Date(tx.created_at), "dd/MM/yy HH:mm", {
                        locale: ptBR,
                      })}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetail(tx);
                        }}
                        className="text-[10px] font-medium text-primary hover:underline"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-3 py-2 border-t border-border/20 bg-muted/10">
                <p className="text-[10px] text-muted-foreground">
                  {(currentPage - 1) * perPage + 1}–
                  {Math.min(currentPage * perPage, displayFiltered.length)} de{" "}
                  {displayFiltered.length}
                </p>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-30"
                  >
                    <ChevronLeft size={12} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page: number;
                    if (totalPages <= 5) page = i + 1;
                    else if (currentPage <= 3) page = i + 1;
                    else if (currentPage >= totalPages - 2)
                      page = totalPages - 4 + i;
                    else page = currentPage - 2 + i;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "w-6 h-6 rounded text-[10px] font-medium transition-all",
                          currentPage === page
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted/30"
                        )}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-30"
                  >
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      <Dialog
        open={!!selectedTx}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTx(null);
            resetDetailForms();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Detalhes da Transação
              {selectedTx?.is_locked && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
                  <Lock size={10} />
                  Travada
                </span>
              )}
              {selectedTx?.is_fake_refund && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 text-xs font-medium">
                  <Eye size={10} />
                  Fake Refund
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedTx && (
            <Tabs defaultValue="venda" className="mt-2">
              <TabsList className="w-full">
                <TabsTrigger value="venda" className="flex-1 text-xs">
                  Venda
                </TabsTrigger>
                <TabsTrigger value="mais" className="flex-1 text-xs">
                  Mais Detalhes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="venda" className="space-y-5 mt-4">
                {/* ID & Status */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      ID da Transação
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs font-mono text-foreground break-all">
                        {selectedTx.id}
                      </p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedTx.id);
                          toast.success("ID copiado!");
                        }}
                        className="flex-shrink-0 p-1 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                        title="Copiar ID"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                  {statusBadge(selectedTx.status)}
                </div>

                <div className="h-px bg-border/40" />

                {/* Seller & Customer */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border/40 p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">
                      Seller / Produtor
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {sellerInfo?.full_name || "—"}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                      {sellerInfo?.account_id}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {sellerInfo?.email || sellerKyc?.email || "—"}
                    </p>
                    {sellerKyc?.cpf && (
                      <p className="text-xs md:text-sm text-muted-foreground">
                        CPF: {sellerKyc.cpf}
                      </p>
                    )}
                    {sellerKyc?.cnpj && (
                      <p className="text-xs md:text-sm text-muted-foreground">
                        CNPJ: {sellerKyc.cnpj}
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg border border-border/40 p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">
                      Cliente
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedTx.customer_name}
                    </p>
                    {selectedTx.customer_email && (
                      <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                        {selectedTx.customer_email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Payment Details */}
                <div className="rounded-lg border border-border/40 p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-medium">
                    Pagamento
                  </p>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                    <div>
                      <p className="text-xs text-muted-foreground">Método</p>
                      <p className="text-sm font-medium text-foreground">
                        {methodLabel[selectedTx.method] || selectedTx.method}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Adquirente
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {selectedTx.acquirer || "Gateway interno"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Data / Hora
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {format(
                          new Date(selectedTx.created_at),
                          "dd/MM/yyyy 'às' HH:mm:ss",
                          { locale: ptBR }
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Última atualização
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {format(
                          new Date(selectedTx.updated_at),
                          "dd/MM/yyyy 'às' HH:mm:ss",
                          { locale: ptBR }
                        )}
                      </p>
                    </div>
                    {selectedTx.pix_code && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">
                          PIX Copia e Cola
                        </p>
                        <p className="text-xs font-mono text-foreground break-all mt-0.5">
                          {selectedTx.pix_code}
                        </p>
                      </div>
                    )}
                    {selectedTx.description && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">
                          Descrição
                        </p>
                        <p className="text-sm text-foreground">
                          {selectedTx.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Values & Fees */}
                <div className="rounded-lg border border-border/40 p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-medium">
                    Valores e Taxas
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Valor bruto
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {formatCurrency(selectedTx.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Taxa cobrada
                      </span>
                      <span className="text-sm font-medium text-destructive">
                        -{formatCurrency(selectedTx.fee_amount)}
                      </span>
                    </div>
                    <div className="h-px bg-border/30" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-foreground">
                        Valor líquido
                      </span>
                      <span className="text-sm font-bold text-primary">
                        {formatCurrency(
                          selectedTx.net_amount ||
                            selectedTx.amount - selectedTx.fee_amount
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="mais" className="space-y-5 mt-4">
                {/* Lock reason / Refund reason */}
                {selectedTx.lock_reason && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                    <p className="text-xs text-destructive uppercase tracking-wider font-medium mb-1">
                      Motivo do bloqueio
                    </p>
                    <p className="text-sm text-foreground">
                      {selectedTx.lock_reason}
                    </p>
                  </div>
                )}
                {selectedTx.refund_reason && (
                  <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
                    <p className="text-xs text-orange-600 uppercase tracking-wider font-medium mb-1">
                      Motivo do reembolso{" "}
                      {selectedTx.is_fake_refund && "(FAKE)"}
                    </p>
                    <p className="text-sm text-foreground">
                      {selectedTx.refund_reason}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                <div className="rounded-lg border border-border/40 p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-medium">
                    Metadados
                  </p>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                    <div>
                      <p className="text-xs text-muted-foreground">Moeda</p>
                      <p className="text-sm font-medium text-foreground">
                        {selectedTx.currency?.toUpperCase() || "BRL"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="text-sm font-medium text-foreground">
                        {selectedTx.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Travada</p>
                      <p className="text-sm font-medium text-foreground">
                        {selectedTx.is_locked ? "Sim" : "Não"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Fake Refund
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {selectedTx.is_fake_refund ? "Sim" : "Não"}
                      </p>
                    </div>
                  </div>
                  {selectedTx.metadata && (
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        Payload
                      </p>
                      <pre className="text-xs font-mono bg-muted/50 rounded-lg p-3 overflow-x-auto text-foreground">
                        {JSON.stringify(selectedTx.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="h-px bg-border/40" />

                {/* Action Buttons */}
                {selectedTx.status !== "refunded" && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                      Ações
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          resetDetailForms();
                          setShowRefundForm(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-500/10 text-orange-600 text-xs font-medium hover:bg-orange-500/20 transition-colors border border-orange-500/20"
                      >
                        <RotateCcw size={12} /> Reembolsar
                      </button>
                      <button
                        onClick={() => {
                          resetDetailForms();
                          setShowFakeRefundForm(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-500/10 text-purple-600 text-xs font-medium hover:bg-purple-500/20 transition-colors border border-purple-500/20"
                      >
                        <AlertTriangle size={12} /> Reembolso Fake
                      </button>
                      <button
                        onClick={() => {
                          if (selectedTx.is_locked) {
                            handleLockToggle();
                          } else {
                            resetDetailForms();
                            setShowLockForm(true);
                          }
                        }}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors border",
                          selectedTx.is_locked
                            ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                            : "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
                        )}
                      >
                        {selectedTx.is_locked ? (
                          <>
                            <Unlock size={12} /> Destravar
                          </>
                        ) : (
                          <>
                            <Lock size={12} /> Travar Venda
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Refund Form */}
                {showRefundForm && (
                  <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4 space-y-3 animate-fade-in">
                    <p className="text-sm font-semibold text-orange-600">
                      Reembolsar Venda
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      O saldo será devolvido ao cliente e descontado do seller.
                    </p>
                    <textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Motivo do reembolso..."
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRefund(false)}
                        disabled={actionLoading || !refundReason.trim()}
                        className="px-4 py-2 rounded-lg bg-orange-500 text-white text-xs font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
                      >
                        {actionLoading
                          ? "Processando..."
                          : "Confirmar Reembolso"}
                      </button>
                      <button
                        onClick={() => setShowRefundForm(false)}
                        className="px-4 py-2 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Fake Refund Form */}
                {showFakeRefundForm && (
                  <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4 space-y-3 animate-fade-in">
                    <p className="text-sm font-semibold text-purple-600">
                      Reembolso Fake
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      A venda será marcada como reembolsada para o seller, mas o
                      saldo <b>NÃO</b> será devolvido.
                    </p>
                    <textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Motivo do reembolso fake..."
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRefund(true)}
                        disabled={actionLoading || !refundReason.trim()}
                        className="px-4 py-2 rounded-lg bg-purple-500 text-white text-xs font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
                      >
                        {actionLoading
                          ? "Processando..."
                          : "Confirmar Fake Refund"}
                      </button>
                      <button
                        onClick={() => setShowFakeRefundForm(false)}
                        className="px-4 py-2 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Lock Form */}
                {showLockForm && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-3 animate-fade-in">
                    <p className="text-sm font-semibold text-destructive">
                      Travar Venda
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      A venda será bloqueada e o seller não poderá sacar este
                      valor até ser destravada.
                    </p>
                    <textarea
                      value={lockReason}
                      onChange={(e) => setLockReason(e.target.value)}
                      placeholder="Motivo do bloqueio..."
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-destructive/20"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleLockToggle}
                        disabled={actionLoading || !lockReason.trim()}
                        className="px-4 py-2 rounded-lg bg-destructive text-white text-xs font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
                      >
                        {actionLoading
                          ? "Processando..."
                          : "Confirmar Bloqueio"}
                      </button>
                      <button
                        onClick={() => setShowLockForm(false)}
                        className="px-4 py-2 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
