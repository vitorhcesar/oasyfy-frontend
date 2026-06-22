import { useApiService } from "@/presentation/hooks/use-api-service";
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
import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import { cn } from "@/presentation/utils/cn";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeftRight,
  ArrowUpRight,
  CalendarIcon,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Globe,
  Landmark,
  Send,
  User,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { type DateRange } from "react-day-picker";
import { toast } from "sonner";

type Withdrawal = {
  id: string;
  amount: number;
  status: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  seller_id: string | null;
  seller_name?: string;
  seller_email?: string;
  pix_key?: string;
};

type BankData = {
  bank_name?: string;
  bankName?: string;
  bank_code?: string;
  agency?: string;
  agencyDigit?: string;
  account?: string;
  accountDigit?: string;
  account_type?: string;
  accountType?: string;
  pix_key?: string;
  pixKey?: string;
  pix_key_type?: string;
  pixKeyType?: string;
  holder_name?: string;
  holder_document?: string;
};

type ApprovalModalData = {
  withdrawal: Withdrawal;
  bankData: BankData | null;
  sellerIps: string[];
  balance: number;
  accountId: string;
  cpf: string | null;
  cnpj: string | null;
  withdrawalFee: number;
} | null;

export default function AdminWithdrawals() {
  const apiService = useApiService();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeller, setFilterSeller] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [approvalModal, setApprovalModal] = useState<ApprovalModalData>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [showDenyInput, setShowDenyInput] = useState(false);
  const [denyReason, setDenyReason] = useState("");
  const [modalTab, setModalTab] = useState<"info" | "history">("info");

  const perPage = 20;

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const data = await apiService.modules.adminFinance.listWithdrawals();
      setWithdrawals(data as Withdrawal[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const openApprovalModal = async (w: Withdrawal) => {
    if (!w.seller_id) return;
    setModalLoading(true);
    setModalTab("info");
    setApprovalModal({
      withdrawal: w,
      bankData: null,
      sellerIps: [],
      balance: 0,
      accountId: "",
      cpf: null,
      cnpj: null,
      withdrawalFee: 0,
    });

    try {
      const ctx = await apiService.modules.adminFinance.getWithdrawalContext(
        Number(w.id),
      );
      setApprovalModal({
        withdrawal: w,
        bankData: (ctx.bankData as BankData) || null,
        sellerIps: ctx.sellerIps,
        balance: ctx.balance,
        accountId: ctx.accountId,
        cpf: ctx.cpf,
        cnpj: ctx.cnpj,
        withdrawalFee: ctx.withdrawalFee,
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleApprove = async (type: "manual" | "api") => {
    if (!approvalModal) return;
    setActionLoading(approvalModal.withdrawal.id);

    const bd = approvalModal.bankData;
    const pixKey = bd?.pixKey || bd?.pix_key || null;
    const bankName = bd?.bankName || bd?.bank_name || null;

    try {
      await apiService.modules.adminFinance.approveWithdrawal(
        Number(approvalModal.withdrawal.id),
        {
          type,
          feeAmount: approvalModal.withdrawalFee,
          pixKey,
          bankName,
        },
      );
      toast.success(
        type === "manual"
          ? "Saque aprovado manualmente"
          : "Saque enviado para API",
      );
      setApprovalModal(null);
      fetchWithdrawals();
    } catch {
      toast.error("Erro ao processar");
    }
    setActionLoading(null);
  };

  const filtered = useMemo(() => {
    return withdrawals.filter((w) => {
      if (filterSeller) {
        const q = filterSeller.toLowerCase().trim();
        const matchName = w.seller_name?.toLowerCase().includes(q);
        const matchEmail = w.seller_email?.toLowerCase().includes(q);
        const matchId = w.id.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchId) return false;
      }
      if (filterStatus && w.status !== filterStatus) return false;
      if (dateRange?.from) {
        const d = new Date(w.created_at);
        if (d < dateRange.from) return false;
        if (dateRange.to) {
          const end = new Date(dateRange.to);
          end.setHours(23, 59, 59, 999);
          if (d > end) return false;
        }
      }
      return true;
    });
  }, [withdrawals, filterSeller, filterStatus, dateRange]);

  const stats = useMemo(() => {
    const sum = (arr: Withdrawal[]) =>
      arr.reduce((a, w) => a + Math.abs(w.amount), 0);
    const pending = filtered.filter((w) => w.status === "pending");
    const completed = filtered.filter((w) => w.status === "completed");
    const cancelled = filtered.filter(
      (w) => w.status === "cancelled" || w.status === "failed",
    );
    const transferring = filtered.filter((w) => w.status === "transferring");
    return [
      {
        label: "Pendentes",
        value: sum(pending),
        count: pending.length,
        icon: Clock,
        color: "text-yellow-600",
        bg: "bg-yellow-500/10",
        border: "border-yellow-200",
        key: "pending",
      },
      {
        label: "Aprovados",
        value: sum(completed),
        count: completed.length,
        icon: CheckCircle,
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
        key: "completed",
      },
      {
        label: "Transferindo",
        value: sum(transferring),
        count: transferring.length,
        icon: Send,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-200",
        key: "transferring",
      },
      {
        label: "Cancelados",
        value: sum(cancelled),
        count: cancelled.length,
        icon: XCircle,
        color: "text-destructive",
        bg: "bg-destructive/10",
        border: "border-destructive/20",
        key: "cancelled",
      },
    ];
  }, [filtered]);

  const [activeStatFilter, setActiveStatFilter] = useState<string | null>(null);

  const displayFiltered = useMemo(() => {
    if (!activeStatFilter) return filtered;
    if (activeStatFilter === "cancelled")
      return filtered.filter(
        (w) => w.status === "cancelled" || w.status === "failed",
      );
    return filtered.filter((w) => w.status === activeStatFilter);
  }, [filtered, activeStatFilter]);

  const totalPages = Math.max(1, Math.ceil(displayFiltered.length / perPage));
  const paginatedData = displayFiltered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filtered, activeStatFilter]);

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Math.abs(cents) / 100);

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
      label: "Aprovado",
      cls: "bg-primary/10 text-primary border-primary/20",
      dot: "bg-primary",
    },
    transferring: {
      label: "Transferindo",
      cls: "bg-blue-500/10 text-blue-500 border-blue-200",
      dot: "bg-blue-500",
    },
    cancelled: {
      label: "Cancelado",
      cls: "bg-destructive/10 text-destructive border-destructive/20",
      dot: "bg-destructive",
    },
    failed: {
      label: "Cancelado",
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

  const statusFilterOptions = [
    { value: "", label: "Todos" },
    { value: "pending", label: "Pendente" },
    { value: "completed", label: "Aprovado" },
    { value: "transferring", label: "Transferindo" },
    { value: "cancelled", label: "Cancelado" },
  ];

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-lg bg-background border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";
  const selectClass =
    "w-full px-3.5 py-2.5 rounded-lg bg-background border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all appearance-none cursor-pointer";

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Saques
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as solicitações de saque dos produtores
          </p>
        </div>

        {/* Filter Panel */}
        <div
          className="rounded-xl bg-card border border-border/40 p-5 mb-6 animate-fade-in"
          style={{ animationDelay: "50ms" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Filtros</h3>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                    dateRange?.from
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-background border-border/50 text-muted-foreground hover:text-foreground hover:border-border",
                  )}
                >
                  <CalendarIcon size={12} />
                  {dateRange?.from && dateRange?.to
                    ? `${format(dateRange.from, "dd/MM/yy", {
                        locale: ptBR,
                      })} - ${format(dateRange.to, "dd/MM/yy", {
                        locale: ptBR,
                      })}`
                    : "Calendário"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end" sideOffset={8}>
                <div className="p-3 space-y-2">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    className="rounded-lg border border-border/40"
                    locale={ptBR}
                  />
                  {dateRange && (
                    <button
                      onClick={() => setDateRange(undefined)}
                      className="text-xs text-primary hover:underline"
                    >
                      Limpar filtro de data
                    </button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={filterSeller}
              onChange={(e) => setFilterSeller(e.target.value)}
              placeholder="Buscar por produtor ou ID do saque..."
              className={inputClass}
            />
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={selectClass}
              >
                {statusFilterOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none"
              />
            </div>
            <button
              onClick={() => {
                setFilterSeller("");
                setFilterStatus("");
                setDateRange(undefined);
                setActiveStatFilter(null);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border/50 text-sm text-muted-foreground hover:text-foreground hover:border-border transition-all"
            >
              Limpar filtros
            </button>
          </div>
        </div>

        {/* Stat Cards */}
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
                  setActiveStatFilter((prev) =>
                    prev === stat.key ? null : stat.key,
                  )
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

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-2 border-muted" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
            </div>
          </div>
        ) : displayFiltered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/50 bg-muted/10 p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-5">
              <ArrowLeftRight className="text-muted-foreground/40" size={24} />
            </div>
            <p className="text-foreground font-semibold mb-1">
              Nenhum saque encontrado
            </p>
            <p className="text-sm text-muted-foreground">
              Os saques aparecerão aqui.
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl border border-border/50 bg-card overflow-hidden animate-fade-in overflow-x-auto"
            style={{ animationDelay: "150ms" }}
          >
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left px-5 py-3.5 font-medium text-muted-foreground/60 text-xs md:text-sm uppercase tracking-wider">
                    Produtor
                  </th>
                  <th className="text-left px-5 py-3.5 font-medium text-muted-foreground/60 text-xs md:text-sm uppercase tracking-wider">
                    Valor do Saque
                  </th>
                  <th className="text-left px-5 py-3.5 font-medium text-muted-foreground/60 text-xs md:text-sm uppercase tracking-wider">
                    Chave PIX
                  </th>
                  <th className="text-left px-5 py-3.5 font-medium text-muted-foreground/60 text-xs md:text-sm uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-5 py-3.5 font-medium text-muted-foreground/60 text-xs md:text-sm uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((w, i) => (
                  <tr
                    key={w.id}
                    className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors animate-fade-in"
                    style={{ animationDelay: `${i * 20}ms` }}
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-foreground text-[13px]">
                        {w.seller_name || "Seller"}
                      </p>
                      {w.seller_email && (
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          {w.seller_email}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-foreground text-[13px]">
                      {formatCurrency(w.amount)}
                    </td>
                    <td className="px-5 py-3.5">
                      {w.pix_key ? (
                        <span className="text-xs font-mono text-foreground bg-muted/30 px-2 py-1 rounded">
                          {w.pix_key}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">{statusBadge(w.status)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openApprovalModal(w)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye size={14} />
                        </button>
                        {w.status === "transferring" && (
                          <button
                            onClick={() => openApprovalModal(w)}
                            disabled={actionLoading === w.id}
                            className="px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle size={10} className="inline mr-1" />
                            Aprovar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border/30">
                <p className="text-xs md:text-sm text-muted-foreground/60">
                  {(currentPage - 1) * perPage + 1}–
                  {Math.min(currentPage * perPage, displayFiltered.length)} de{" "}
                  {displayFiltered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-30"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let page: number;
                    if (totalPages <= 7) page = i + 1;
                    else if (currentPage <= 4) page = i + 1;
                    else if (currentPage >= totalPages - 3)
                      page = totalPages - 6 + i;
                    else page = currentPage - 3 + i;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "w-7 h-7 rounded-lg text-xs md:text-sm font-medium transition-all",
                          currentPage === page
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
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
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-30"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Approval Modal */}
      <Dialog
        open={!!approvalModal}
        onOpenChange={(open) => {
          if (!open) {
            setApprovalModal(null);
            setShowDenyInput(false);
            setDenyReason("");
            setModalTab("info");
          }
        }}
      >
        <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ArrowUpRight size={18} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-base font-semibold text-foreground">
                    Aprovar Saque
                  </DialogTitle>
                  {approvalModal && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {formatCurrency(approvalModal.withdrawal.amount)} ·{" "}
                      {approvalModal.withdrawal.seller_name || "—"}
                    </p>
                  )}
                </div>
              </div>
              {approvalModal && (
                <div className="flex-shrink-0">
                  {statusBadge(approvalModal.withdrawal.status)}
                </div>
              )}
            </div>
          </DialogHeader>

          {approvalModal && (
            <div className="px-6 pb-6">
              {/* Tabs */}
              <div className="flex gap-1 border-b border-border/40 -mx-6 px-6 mb-5">
                <button
                  onClick={() => setModalTab("info")}
                  className={cn(
                    "px-3 py-2.5 text-xs font-medium transition-colors relative",
                    modalTab === "info"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Informações
                  {modalTab === "info" && (
                    <span className="absolute bottom-0 left-0 right-0 h-px bg-primary" />
                  )}
                </button>
                <button
                  onClick={() => setModalTab("history")}
                  className={cn(
                    "px-3 py-2.5 text-xs font-medium transition-colors relative",
                    modalTab === "history"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Logs
                  {modalTab === "history" && (
                    <span className="absolute bottom-0 left-0 right-0 h-px bg-primary" />
                  )}
                </button>
              </div>

              {modalTab === "info" ? (
                <div className="space-y-3">
                  {/* Seller Info */}
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User size={13} className="text-muted-foreground" />
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        Produtor
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {approvalModal.withdrawal.seller_name || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {approvalModal.withdrawal.seller_email}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                      {approvalModal.accountId && (
                        <span>
                          ID:{" "}
                          <span className="font-mono text-foreground/80">
                            {approvalModal.accountId}
                          </span>
                        </span>
                      )}
                      {approvalModal.cpf && (
                        <span>
                          CPF:{" "}
                          <span className="font-mono text-foreground/80">
                            {approvalModal.cpf}
                          </span>
                        </span>
                      )}
                      {approvalModal.cnpj && (
                        <span>
                          CNPJ:{" "}
                          <span className="font-mono text-foreground/80">
                            {approvalModal.cnpj}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bank Data */}
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Landmark size={13} className="text-muted-foreground" />
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        Dados Bancários
                      </p>
                    </div>
                    {modalLoading ? (
                      <p className="text-xs text-muted-foreground">
                        Carregando...
                      </p>
                    ) : approvalModal.bankData ? (
                      (() => {
                        const b = approvalModal.bankData!;
                        const bankName = b.bankName || b.bank_name || "";
                        const agency = b.agency || "";
                        const agencyDigit = b.agencyDigit || "";
                        const account = b.account || "";
                        const accountDigit = b.accountDigit || "";
                        const accountType =
                          b.accountType || b.account_type || "";
                        const pixKey = b.pixKey || b.pix_key || "";
                        const pixKeyType = b.pixKeyType || b.pix_key_type || "";
                        const maskedAccount =
                          account.length > 4
                            ? `••${account.slice(-4)}`
                            : account;
                        return (
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-3 flex-wrap">
                              {bankName && (
                                <span className="text-xs font-semibold text-foreground capitalize">
                                  {bankName}
                                </span>
                              )}
                              {agency && (
                                <span className="text-xs text-muted-foreground">
                                  Ag:{" "}
                                  <span className="font-mono text-foreground/80">
                                    {agency}
                                    {agencyDigit ? `-${agencyDigit}` : ""}
                                  </span>
                                </span>
                              )}
                              {account && (
                                <span className="text-xs text-muted-foreground">
                                  Cc:{" "}
                                  <span className="font-mono text-foreground/80">
                                    {maskedAccount}
                                    {accountDigit ? `-${accountDigit}` : ""}
                                  </span>
                                </span>
                              )}
                              {accountType && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-background border border-border/50 text-muted-foreground uppercase font-medium">
                                  {accountType}
                                </span>
                              )}
                            </div>
                            {pixKey && (
                              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/15">
                                <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
                                  PIX{pixKeyType && ` · ${pixKeyType}`}
                                </span>
                                <span className="text-xs font-mono font-semibold text-foreground break-all">
                                  {pixKey}
                                </span>
                              </div>
                            )}
                            {b.holder_name && (
                              <p className="text-xs text-muted-foreground">
                                Titular:{" "}
                                <span className="text-foreground/80">
                                  {b.holder_name}
                                </span>
                              </p>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <p className="text-xs text-muted-foreground/60">
                        Nenhum dado bancário cadastrado
                      </p>
                    )}
                  </div>

                  {/* IP & Balance */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Globe size={13} className="text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                          IPs Autorizados
                        </p>
                      </div>
                      {approvalModal.sellerIps.length > 0 ? (
                        <div className="space-y-1">
                          {approvalModal.sellerIps.map((ip, i) => (
                            <p
                              key={i}
                              className="text-xs font-mono text-foreground"
                            >
                              {ip}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground/50">
                          Nenhum IP
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Wallet size={13} className="text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                          Saldo
                        </p>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Atual</span>
                          <span className="font-semibold text-foreground">
                            {formatCurrency(approvalModal.balance)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Saque</span>
                          <span className="font-semibold text-destructive">
                            -{formatCurrency(approvalModal.withdrawal.amount)}
                          </span>
                        </div>
                        {approvalModal.withdrawalFee > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Taxa</span>
                            <span className="font-semibold text-destructive">
                              -{formatCurrency(approvalModal.withdrawalFee)}
                            </span>
                          </div>
                        )}
                        <div className="h-px bg-border/50 my-1" />
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground font-medium">
                            Após
                          </span>
                          <span
                            className={cn(
                              "font-bold",
                              approvalModal.balance +
                                approvalModal.withdrawal.amount -
                                approvalModal.withdrawalFee >=
                                0
                                ? "text-primary"
                                : "text-destructive",
                            )}
                          >
                            {formatCurrency(
                              approvalModal.balance +
                                approvalModal.withdrawal.amount -
                                approvalModal.withdrawalFee,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Withdrawal details */}
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText size={13} className="text-muted-foreground" />
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        Detalhes do Saque
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-0.5">Valor</p>
                        <p className="font-semibold text-foreground">
                          {formatCurrency(approvalModal.withdrawal.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">Data</p>
                        <p className="font-medium text-foreground">
                          {format(
                            new Date(approvalModal.withdrawal.created_at),
                            "dd/MM/yy 'às' HH:mm",
                            { locale: ptBR },
                          )}
                        </p>
                      </div>
                      {approvalModal.withdrawal.description && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground mb-0.5">
                            Descrição
                          </p>
                          <p className="text-foreground">
                            {approvalModal.withdrawal.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="h-px bg-border/30" />

                  {/* Action Buttons - only for pending/transferring */}
                  {(approvalModal.withdrawal.status === "pending" ||
                    approvalModal.withdrawal.status === "transferring") && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                        Ação
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleApprove("manual")}
                          disabled={!!actionLoading}
                          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all disabled:opacity-50"
                        >
                          <CheckCircle size={20} className="text-primary" />
                          <span className="text-xs font-semibold text-primary">
                            Aprovar Manual
                          </span>
                          <span className="text-xs text-muted-foreground text-center">
                            Marca como aprovado sem enviar via API
                          </span>
                        </button>
                        <button
                          onClick={() => handleApprove("api")}
                          disabled={!!actionLoading}
                          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-all disabled:opacity-50"
                        >
                          <Zap size={20} className="text-blue-500" />
                          <span className="text-xs font-semibold text-blue-500">
                            Aprovar via API
                          </span>
                          <span className="text-xs text-muted-foreground text-center">
                            Envia para processamento automático
                          </span>
                        </button>
                      </div>
                      {!showDenyInput ? (
                        <button
                          onClick={() => setShowDenyInput(true)}
                          disabled={!!actionLoading}
                          className="w-full px-4 py-2.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors border border-destructive/20 disabled:opacity-50"
                        >
                          <XCircle size={12} className="inline mr-1" /> Negar
                          Saque
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <textarea
                            value={denyReason}
                            onChange={(e) => setDenyReason(e.target.value)}
                            placeholder="Informe o motivo da negação..."
                            className="w-full px-3 py-2 rounded-lg border border-destructive/20 bg-destructive/5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-destructive/30 resize-none"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setShowDenyInput(false);
                                setDenyReason("");
                              }}
                              className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground border border-border/40 transition-colors"
                            >
                              Voltar
                            </button>
                            <button
                              onClick={async () => {
                                if (!approvalModal || !denyReason.trim()) {
                                  toast.error("Informe o motivo");
                                  return;
                                }
                                setActionLoading(approvalModal.withdrawal.id);
                                try {
                                  await apiService.modules.adminFinance.denyWithdrawal(
                                    Number(approvalModal.withdrawal.id),
                                    {
                                      reason: denyReason.trim(),
                                      feeAmount: approvalModal.withdrawalFee,
                                    },
                                  );
                                  toast.success("Saque negado");
                                  setApprovalModal(null);
                                  setShowDenyInput(false);
                                  setDenyReason("");
                                  fetchWithdrawals();
                                } catch {
                                  toast.error("Erro ao negar saque");
                                }
                                setActionLoading(null);
                              }}
                              disabled={!!actionLoading || !denyReason.trim()}
                              className="flex-1 px-3 py-2 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
                            >
                              Confirmar Negação
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Logs Tab - show logs for the CURRENT withdrawal only */
                <div className="relative mt-2 max-h-[450px] overflow-y-auto pr-1">
                  {(() => {
                    const currentMeta =
                      (approvalModal.withdrawal as any).metadata || {};
                    const currentLogs: any[] = Array.isArray(currentMeta.logs)
                      ? currentMeta.logs
                      : [];

                    const eventLabels: Record<string, string> = {
                      created: "Saque solicitado",
                      approved_manual: "Aprovado manualmente",
                      sent_to_api: "Enviado para API",
                      api_success: "Transferência realizada",
                      api_error: "Erro na transferência",
                      denied: "Saque negado",
                      retry: "Tentativa de reenvio",
                    };

                    // Build entries: always start with a "created" entry, then append metadata logs
                    const entries: any[] = [
                      {
                        key: "created",
                        event: "created",
                        timestamp: approvalModal.withdrawal.created_at,
                      },
                      ...currentLogs.map((log: any, i: number) => ({
                        ...log,
                        key: `log-${i}`,
                      })),
                    ];

                    return entries.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-8">
                        Nenhum log encontrado
                      </p>
                    ) : (
                      <div className="relative">
                        <div className="absolute left-[15px] top-4 bottom-4 w-[3px] bg-border/40 rounded-full" />
                        <div className="space-y-0">
                          {entries.map((entry: any) => {
                            const evtSuccess =
                              entry.event === "approved_manual" ||
                              entry.event === "api_success";
                            const evtFailed =
                              entry.event === "denied" ||
                              entry.event === "api_error";

                            return (
                              <div
                                key={entry.key}
                                className="relative flex gap-3 pb-2"
                              >
                                <div className="relative z-10 flex-shrink-0 mt-0.5">
                                  <div
                                    className={cn(
                                      "w-[30px] h-[30px] rounded-full flex items-center justify-center border-2",
                                      evtSuccess
                                        ? "bg-primary/10 border-primary text-primary"
                                        : evtFailed
                                          ? "bg-destructive/10 border-destructive text-destructive"
                                          : "bg-muted border-border text-muted-foreground",
                                    )}
                                  >
                                    {evtSuccess ? (
                                      <CheckCircle size={14} />
                                    ) : evtFailed ? (
                                      <XCircle size={14} />
                                    ) : entry.event === "sent_to_api" ||
                                      entry.event === "retry" ? (
                                      <Send size={14} />
                                    ) : (
                                      <Clock size={14} />
                                    )}
                                  </div>
                                </div>
                                <div
                                  className={cn(
                                    "flex-1 rounded-lg border p-3 space-y-1",
                                    evtSuccess
                                      ? "border-primary/20 bg-primary/[0.02]"
                                      : evtFailed
                                        ? "border-destructive/20 bg-destructive/[0.02]"
                                        : "border-border/30 bg-muted/5",
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <span
                                      className={cn(
                                        "text-[12px] font-semibold",
                                        evtSuccess
                                          ? "text-primary"
                                          : evtFailed
                                            ? "text-destructive"
                                            : "text-foreground",
                                      )}
                                    >
                                      {eventLabels[entry.event] || entry.event}
                                    </span>
                                    {entry.timestamp && (
                                      <span className="text-xs text-muted-foreground/60">
                                        {format(
                                          new Date(entry.timestamp),
                                          "dd/MM/yyyy - HH:mm:ss",
                                          { locale: ptBR },
                                        )}
                                      </span>
                                    )}
                                  </div>
                                  {entry.approval_type && (
                                    <p className="text-xs text-muted-foreground">
                                      Via:{" "}
                                      <span className="font-medium text-foreground">
                                        {entry.approval_type === "manual"
                                          ? "Aprovação Manual"
                                          : "API Automática"}
                                      </span>
                                    </p>
                                  )}
                                  {entry.denial_reason && (
                                    <p className="text-xs text-destructive">
                                      Motivo:{" "}
                                      <span className="font-medium">
                                        {entry.denial_reason}
                                      </span>
                                    </p>
                                  )}
                                  {entry.error && (
                                    <p className="text-xs text-destructive">
                                      Erro:{" "}
                                      <span className="font-medium">
                                        {entry.error}
                                      </span>
                                    </p>
                                  )}
                                  {entry.api_response && (
                                    <div className="mt-1">
                                      <p className="text-[11px] text-muted-foreground mb-0.5">
                                        Retorno da adquirente:
                                      </p>
                                      <div className="px-2.5 py-1.5 rounded-md bg-muted/40 border border-border/30">
                                        <p className="text-xs font-mono text-foreground break-all leading-relaxed">
                                          {typeof entry.api_response ===
                                          "string"
                                            ? entry.api_response
                                            : JSON.stringify(
                                                entry.api_response,
                                              )}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                  {entry.withdrawal_fee > 0 &&
                                    entry.event !== "created" && (
                                      <p className="text-xs text-muted-foreground">
                                        Taxa descontada:{" "}
                                        <span className="font-medium text-foreground">
                                          {formatCurrency(entry.withdrawal_fee)}
                                        </span>
                                      </p>
                                    )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
