import { Transaction } from "@/domain/entities/transaction.entity";
import KycWithdrawalDetails from "@/presentation/components/KycOnboarding/KycWithdrawalDetails";
import { SellerLayout } from "@/presentation/components/seller/SellerLayout";
import { WithdrawalModal } from "@/presentation/components/seller/WithdrawalModal";
import { Calendar } from "@/presentation/components/ui/calendar";
import { Dialog, DialogContent } from "@/presentation/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/presentation/components/ui/popover";
import useSellerFeeQuery from "@/presentation/hooks/use-seller-fee-query";
import { useSellerKycSubmissionQuery } from "@/presentation/hooks/use-seller-kyc-submission-query";
import useSellerTransactionsQuery from "@/presentation/hooks/use-seller-transactions-query";
import { useUserContext } from "@/presentation/context/UserContext";
import { cn } from "@/presentation/utils/cn";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowUpRight,
  CalendarIcon,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  Loader2,
  Lock,
  Search,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function isPaid(status: string) {
  return status === "paid" || status === "completed";
}

interface Withdrawal {
  id: string;
  amount: number;
  fee_amount: number;
  net_amount: number;
  status: string;
  description: string | null;
  pix_code: string | null;
  acquirer: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

interface SellerFee {
  pix_retention_days: number;
  card_retention_days: number;
  boleto_retention_days: number;
  crypto_retention_days: number;
}

function mapTransactionToWithdrawal(t: Transaction): Withdrawal {
  return {
    id: String(t.id),
    amount: t.amount,
    fee_amount: t.feeAmount,
    net_amount: t.netAmount,
    status: t.status,
    description: t.description,
    pix_code: t.pixCode,
    acquirer: t.acquirer,
    metadata: t.metadata as Record<string, any> | null,
    created_at:
      t.createdAt instanceof Date
        ? t.createdAt.toISOString()
        : String(t.createdAt),
    updated_at:
      t.updatedAt instanceof Date
        ? t.updatedAt.toISOString()
        : String(t.updatedAt),
  };
}

function formatCurrency(cents: number) {
  return `R$ ${(Math.abs(cents) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
  })}`;
}

function formatDateTime(date: string) {
  const d = new Date(date);
  return format(d, "dd/MM/yy, HH:mm", { locale: ptBR });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { label: string; icon: React.ElementType; className: string }
  > = {
    pending: {
      label: "Pendente",
      icon: Clock,
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    paid: {
      label: "Concluído",
      icon: CheckCircle2,
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    completed: {
      label: "Concluído",
      icon: CheckCircle2,
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    failed: {
      label: "Falhou",
      icon: XCircle,
      className: "bg-red-500/10 text-red-600 dark:text-red-400",
    },
    rejected: {
      label: "Negado",
      icon: XCircle,
      className: "bg-red-500/10 text-red-600 dark:text-red-400",
    },
    cancelled: {
      label: "Cancelado",
      icon: XCircle,
      className: "bg-muted text-muted-foreground",
    },
    refunded: {
      label: "Estornado",
      icon: XCircle,
      className: "bg-muted text-muted-foreground",
    },
  };
  const s = map[status] || map.pending;
  const Icon = s.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        s.className,
      )}
    >
      <Icon size={10} />
      {s.label}
    </span>
  );
}

export default function SellerTransfers() {
  const user = useUserContext();
  const {
    data: transactions,
    isLoading: txLoading,
    invalidateQuery: invalidateTransactions,
  } = useSellerTransactionsQuery();
  const { data: sellerFee, isLoading: feeLoading } = useSellerFeeQuery();
  const {
    submission,
    canSell,
    canWithdraw,
    isLoading: kycLoading,
    invalidateQuery: invalidateKyc,
  } = useSellerKycSubmissionQuery();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [withdrawalDetailsOpen, setWithdrawalDetailsOpen] = useState(false);
  const [detailW, setDetailW] = useState<Withdrawal | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const loading = txLoading || feeLoading || kycLoading;

  const withdrawals = useMemo(
    () =>
      transactions
        .filter((t) => t.method === "withdrawal")
        .map(mapTransactionToWithdrawal),
    [transactions],
  );

  const allTx = useMemo(
    () =>
      transactions
        .filter((t) => t.method !== "withdrawal")
        .map((t) => ({
          amount: t.amount,
          method: t.method,
          status: t.status,
          created_at:
            t.createdAt instanceof Date
              ? t.createdAt.toISOString()
              : String(t.createdAt),
        })),
    [transactions],
  );

  const fees = useMemo<SellerFee | null>(() => {
    if (!sellerFee) return null;
    return {
      pix_retention_days: sellerFee.pixRetentionDays,
      card_retention_days: sellerFee.cardRetentionDays,
      boleto_retention_days: sellerFee.boletoRetentionDays,
      crypto_retention_days: sellerFee.cryptoRetentionDays,
    };
  }, [sellerFee]);

  const withdrawalBlocked = submission?.withdrawalsBlocked ?? false;
  const blockReason = submission?.withdrawalBlockReason ?? null;
  const needsWithdrawalDetails =
    canSell &&
    (!submission?.zipCode ||
      !submission?.street ||
      !submission?.bankData);
  const awaitingWithdrawalApproval =
    canSell && !canWithdraw && !needsWithdrawalDetails && !withdrawalBlocked;

  const handleRequestWithdrawal = () => {
    if (withdrawalBlocked) return;
    if (needsWithdrawalDetails) {
      setWithdrawalDetailsOpen(true);
      return;
    }
    if (!canWithdraw) {
      toast.info(
        "Aguarde a aprovação do endereço e dos dados bancários para sacar.",
      );
      return;
    }
    setWithdrawalOpen(true);
  };

  const refetchData = () => {
    void invalidateTransactions();
  };

  // Balance calculations
  const now = new Date();
  const paidTx = useMemo(
    () => allTx.filter((t) => isPaid(t.status) && t.amount > 0),
    [allTx],
  );
  const totalPaid = useMemo(
    () => paidTx.reduce((s, t) => s + t.amount, 0),
    [paidTx],
  );
  const totalWithdrawn = useMemo(
    () =>
      Math.abs(
        withdrawals
          .filter((w) => isPaid(w.status))
          .reduce((s, w) => s + w.amount, 0),
      ),
    [withdrawals],
  );

  const retainedBalance = useMemo(() => {
    if (!fees) return 0;
    return paidTx
      .filter((t) => {
        const days =
          t.method === "pix"
            ? fees.pix_retention_days
            : t.method === "card"
              ? fees.card_retention_days
              : t.method === "boleto"
                ? fees.boleto_retention_days
                : fees.crypto_retention_days;
        if (!days) return false;
        return (
          new Date(new Date(t.created_at).getTime() + days * 86400000) > now
        );
      })
      .reduce((s, t) => s + t.amount, 0);
  }, [paidTx, fees]);

  const availableBalance = Math.max(
    0,
    totalPaid - totalWithdrawn - retainedBalance,
  );

  // Card vs PIX/Boleto balances
  const cardPaid = useMemo(
    () =>
      paidTx
        .filter((t) => t.method === "card")
        .reduce((s, t) => s + t.amount, 0),
    [paidTx],
  );
  const pixBoletoPaid = useMemo(
    () =>
      paidTx
        .filter((t) => t.method === "pix" || t.method === "boleto")
        .reduce((s, t) => s + t.amount, 0),
    [paidTx],
  );
  const cardRetained = useMemo(() => {
    if (!fees || !fees.card_retention_days) return 0;
    return paidTx
      .filter(
        (t) =>
          t.method === "card" &&
          new Date(
            new Date(t.created_at).getTime() +
              fees.card_retention_days * 86400000,
          ) > now,
      )
      .reduce((s, t) => s + t.amount, 0);
  }, [paidTx, fees]);
  const pixBoletoRetained = useMemo(() => {
    if (!fees) return 0;
    return paidTx
      .filter((t) => {
        if (t.method === "pix")
          return (
            fees.pix_retention_days > 0 &&
            new Date(
              new Date(t.created_at).getTime() +
                fees.pix_retention_days * 86400000,
            ) > now
          );
        if (t.method === "boleto")
          return (
            fees.boleto_retention_days > 0 &&
            new Date(
              new Date(t.created_at).getTime() +
                fees.boleto_retention_days * 86400000,
            ) > now
          );
        return false;
      })
      .reduce((s, t) => s + t.amount, 0);
  }, [paidTx, fees]);
  // Distribute available balance proportionally between card and pix/boleto
  const cardGross = Math.max(0, cardPaid - cardRetained);
  const pixBoletoGross = Math.max(0, pixBoletoPaid - pixBoletoRetained);
  const grossTotal = cardGross + pixBoletoGross;
  const cardBalance =
    grossTotal > 0
      ? Math.round(availableBalance * (cardGross / grossTotal))
      : 0;
  const pixBoletoBalance = grossTotal > 0 ? availableBalance - cardBalance : 0;

  // Summary stats
  const totalPending = useMemo(
    () =>
      withdrawals
        .filter((w) => w.status === "pending")
        .reduce((s, w) => s + Math.abs(w.amount), 0),
    [withdrawals],
  );
  const totalCompleted = useMemo(
    () =>
      withdrawals
        .filter((w) => isPaid(w.status))
        .reduce((s, w) => s + Math.abs(w.amount), 0),
    [withdrawals],
  );

  // Filtered list
  const filtered = useMemo(() => {
    let list = withdrawals;
    if (statusFilter !== "all") {
      if (statusFilter === "paid") {
        list = list.filter((w) => isPaid(w.status));
      } else if (statusFilter === "failed") {
        list = list.filter(
          (w) => w.status === "failed" || w.status === "cancelled",
        );
      } else if (statusFilter === "rejected") {
        list = list.filter((w) => w.status === "rejected");
      } else {
        list = list.filter((w) => w.status === statusFilter);
      }
    }
    if (search.trim())
      list = list.filter(
        (w) =>
          w.description?.toLowerCase().includes(search.toLowerCase()) ||
          w.id.includes(search),
      );
    if (dateFrom) list = list.filter((w) => new Date(w.created_at) >= dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      list = list.filter((w) => new Date(w.created_at) <= end);
    }
    return list;
  }, [withdrawals, statusFilter, search, dateFrom, dateTo]);

  const statCards = [
    {
      label: "Disponível para saque",
      value: formatCurrency(availableBalance),
      color: "text-primary",
    },
    {
      label: "Saques pendentes",
      value: formatCurrency(totalPending),
      color: "text-amber-500",
    },
    {
      label: "Total sacado",
      value: formatCurrency(totalCompleted),
      color: "text-emerald-500",
    },
  ];

  return (
    <SellerLayout>
      <div className="w-full max-w-4xl mx-auto px-4 md:px-8 lg:px-10 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Transferências
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              Gerencie seus saques e acompanhe o histórico
            </p>
          </div>
          <button
            onClick={handleRequestWithdrawal}
            disabled={withdrawalBlocked || !canSell}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs md:text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {withdrawalBlocked ? (
              <Lock size={13} />
            ) : (
              <ArrowUpRight size={13} />
            )}
            {withdrawalBlocked
              ? "Saque bloqueado"
              : needsWithdrawalDetails
                ? "Completar dados para saque"
                : awaitingWithdrawalApproval
                  ? "Aguardando aprovação"
                  : "Solicitar saque"}
          </button>
        </div>

        {withdrawalBlocked && (
          <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
            <Lock size={16} className="text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">
                Saques bloqueados
              </p>
              {blockReason && (
                <p className="text-xs text-muted-foreground mt-1">
                  Motivo: {blockReason}
                </p>
              )}
            </div>
          </div>
        )}

        {!withdrawalBlocked && needsWithdrawalDetails && (
          <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
            <Lock size={16} className="text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Complete endereço e dados bancários
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                As vendas já podem estar liberadas. Para sacar, envie endereço e
                conta/PIX para análise.
              </p>
            </div>
          </div>
        )}

        {!withdrawalBlocked && awaitingWithdrawalApproval && (
          <div className="mb-5 rounded-xl border border-border/60 bg-muted/20 p-4 flex items-start gap-3">
            <Clock size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Dados de saque em análise
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Endereço e banco foram enviados. Assim que forem aprovados, os
                saques serão liberados.
              </p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {statCards.map((c) => (
            <div
              key={c.label}
              className="p-3 rounded-xl bg-card border border-border/40"
            >
              <p className="text-xs text-muted-foreground mb-0.5">{c.label}</p>
              <p className={cn("text-sm font-bold tabular-nums", c.color)}>
                {c.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Buscar por ID ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-border/40 bg-background text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>
          <div className="flex gap-1">
            {[
              { key: "all", label: "Todos" },
              { key: "pending", label: "Pendente" },
              { key: "paid", label: "Concluído" },
              { key: "rejected", label: "Negado" },
              { key: "failed", label: "Falhou" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors",
                  statusFilter === f.key
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all",
                  dateFrom || dateTo
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-card border border-border/40 text-muted-foreground hover:text-foreground",
                )}
              >
                <CalendarIcon size={12} />
                {dateFrom && dateTo
                  ? `${format(dateFrom, "dd/MM", { locale: ptBR })} - ${format(
                      dateTo,
                      "dd/MM",
                      { locale: ptBR },
                    )}`
                  : "Período"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="end">
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">De</p>
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    disabled={(d) => d > new Date()}
                    className="p-2 rounded-lg border border-border/40"
                    locale={ptBR}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Até</p>
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    disabled={(d) =>
                      d > new Date() || (dateFrom ? d < dateFrom : false)
                    }
                    className="p-2 rounded-lg border border-border/40"
                    locale={ptBR}
                  />
                </div>
              </div>
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setDateFrom(undefined);
                    setDateTo(undefined);
                  }}
                  className="mt-2 text-xs text-primary hover:underline"
                >
                  Limpar filtro
                </button>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={18} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/50 bg-muted/10 py-12 text-center">
            <ArrowUpRight
              size={24}
              className="mx-auto text-muted-foreground/30 mb-3"
            />
            <p className="text-sm font-medium text-foreground mb-1">
              Nenhuma transferência encontrada
            </p>
            <p className="text-xs md:text-sm text-muted-foreground">
              Solicite seu primeiro saque para começar.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block rounded-xl bg-card border border-border/40 overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-2.5 border-b border-border/30">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Descrição
                </span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider w-24 text-right">
                  Valor
                </span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider w-20">
                  Status
                </span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider w-28 text-right">
                  Data
                </span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider w-8"></span>
              </div>
              <div className="divide-y divide-border/20">
                {filtered.map((w) => (
                  <div
                    key={w.id}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-3 items-center hover:bg-muted/10 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/8 text-amber-500 flex items-center justify-center shrink-0">
                        <ArrowUpRight size={12} strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm font-medium text-foreground truncate">
                          {w.description || "Saque"}
                        </p>
                        <p className="text-sm md:text-xs text-muted-foreground truncate font-mono">
                          {w.id.slice(0, 8)}...
                        </p>
                        {w.status === "rejected" &&
                          w.metadata?.denial_reason && (
                            <p className="text-sm text-destructive truncate mt-0.5">
                              Motivo: {w.metadata.denial_reason}
                            </p>
                          )}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-amber-500 w-24 text-right tabular-nums">
                      - {formatCurrency(w.amount)}
                    </span>
                    <span className="w-20">
                      <StatusBadge status={w.status} />
                    </span>
                    <span className="text-xs text-muted-foreground w-28 text-right tabular-nums">
                      {formatDateTime(w.created_at)}
                    </span>
                    <button
                      onClick={() => setDetailW(w)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/30 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile */}
            <div className="md:hidden space-y-2">
              {filtered.map((w) => (
                <div
                  key={w.id}
                  className="rounded-xl bg-card border border-border/40 p-3"
                  onClick={() => setDetailW(w)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/8 text-amber-500 flex items-center justify-center shrink-0">
                        <ArrowUpRight size={12} strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm font-medium text-foreground truncate">
                          {w.description || "Saque"}
                        </p>
                        <p className="text-sm md:text-xs text-muted-foreground font-mono">
                          {w.id.slice(0, 8)}...
                        </p>
                        {w.status === "rejected" &&
                          w.metadata?.denial_reason && (
                            <p className="text-sm text-destructive truncate mt-0.5">
                              Motivo: {w.metadata.denial_reason}
                            </p>
                          )}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-amber-500 tabular-nums shrink-0">
                      - {formatCurrency(w.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <StatusBadge status={w.status} />
                    <span className="text-sm md:text-xs text-muted-foreground tabular-nums">
                      {formatDateTime(w.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {user && (
        <WithdrawalModal
          open={withdrawalOpen}
          onOpenChange={setWithdrawalOpen}
          availableBalance={availableBalance}
          cardBalance={cardBalance}
          pixBoletoBalance={pixBoletoBalance}
          onSuccess={refetchData}
        />
      )}

      {withdrawalDetailsOpen && (
        <KycWithdrawalDetails
          onComplete={() => {
            setWithdrawalDetailsOpen(false);
            void invalidateKyc();
            toast.success("Dados enviados. Aguarde a aprovação para sacar.");
          }}
          onCancel={() => setWithdrawalDetailsOpen(false)}
        />
      )}

      {/* Withdrawal Detail Dialog */}
      <Dialog
        open={!!detailW}
        onOpenChange={(open) => {
          if (!open) setDetailW(null);
        }}
      >
        <DialogContent className="max-w-[420px] p-0 gap-0 overflow-hidden rounded-2xl border-border/30">
          {detailW &&
            (() => {
              const fee =
                detailW.metadata?.withdrawal_fee ?? detailW.fee_amount ?? 0;
              const net = detailW.net_amount || Math.abs(detailW.amount) - fee;
              const pixKey =
                detailW.pix_code || detailW.metadata?.pix_key || null;
              const pixKeyType = detailW.metadata?.pix_key_type || null;
              const acquirer =
                detailW.acquirer || detailW.metadata?.acquirer || null;
              const bankName = detailW.metadata?.bank_name || null;
              const balanceSource = detailW.metadata?.balance_source || null;
              const isRejected = detailW.status === "rejected";
              const isPaidW = isPaid(detailW.status);

              const copyToClipboard = (text: string, field: string) => {
                navigator.clipboard.writeText(text);
                setCopiedField(field);
                setTimeout(() => setCopiedField(null), 2000);
              };

              const InfoRow = ({
                label,
                value,
                mono,
                copyKey,
              }: {
                label: string;
                value: string;
                mono?: boolean;
                copyKey?: string;
              }) => (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <div className="flex items-center gap-1.5 max-w-[60%]">
                    <span
                      className={cn(
                        "text-xs font-medium text-foreground truncate",
                        mono && "font-mono text-sm",
                      )}
                    >
                      {value}
                    </span>
                    {copyKey && (
                      <button
                        onClick={() => copyToClipboard(value, copyKey)}
                        className="p-1 rounded-md hover:bg-muted/40 transition-colors text-muted-foreground hover:text-foreground shrink-0"
                      >
                        {copiedField === copyKey ? (
                          <Check size={11} className="text-primary" />
                        ) : (
                          <Copy size={11} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );

              return (
                <>
                  {/* Hero header */}
                  <div
                    className={cn(
                      "relative px-6 pt-8 pb-5 text-center",
                      isRejected
                        ? "bg-gradient-to-b from-destructive/8 to-transparent"
                        : isPaidW
                          ? "bg-gradient-to-b from-primary/8 to-transparent"
                          : "bg-gradient-to-b from-amber-500/8 to-transparent",
                    )}
                  >
                    <div
                      className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm",
                        isRejected
                          ? "bg-destructive/10 text-destructive"
                          : isPaidW
                            ? "bg-primary/10 text-primary"
                            : "bg-amber-500/10 text-amber-500",
                      )}
                    >
                      {isRejected ? (
                        <XCircle size={26} />
                      ) : isPaidW ? (
                        <CheckCircle2 size={26} />
                      ) : (
                        <Clock size={26} />
                      )}
                    </div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {isRejected
                        ? "Saque Negado"
                        : isPaidW
                          ? "Saque Concluído"
                          : "Saque Pendente"}
                    </p>
                    <p
                      className={cn(
                        "text-3xl font-bold tabular-nums tracking-tight",
                        isRejected
                          ? "text-destructive"
                          : isPaidW
                            ? "text-primary"
                            : "text-amber-500",
                      )}
                    >
                      {formatCurrency(Math.abs(detailW.amount))}
                    </p>
                    <p className="text-sm text-muted-foreground/60 mt-1.5 tabular-nums">
                      {formatDateTime(detailW.created_at)}
                    </p>
                  </div>

                  {/* Rejection reason */}
                  {isRejected && detailW.metadata?.denial_reason && (
                    <div className="mx-5 mb-1 px-3.5 py-3 rounded-xl bg-destructive/5 border border-destructive/10">
                      <p className="text-sm font-semibold text-destructive mb-1">
                        Motivo da rejeição
                      </p>
                      <p className="text-xs text-foreground leading-relaxed">
                        {detailW.metadata.denial_reason}
                      </p>
                    </div>
                  )}

                  {/* Pix destination card */}
                  {pixKey && (
                    <div className="mx-5 mt-3 mb-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                        Destino do Pix
                      </p>
                      <div className="rounded-xl border border-primary/15 bg-primary/[0.03] p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">
                              Chave {pixKeyType || "Pix"}
                            </p>
                            <p className="text-sm font-semibold text-foreground font-mono mt-0.5">
                              {pixKey}
                            </p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(pixKey, "pix")}
                            className="p-2 rounded-lg bg-primary/10 hover:bg-primary/15 transition-colors text-primary shrink-0"
                          >
                            {copiedField === "pix" ? (
                              <Check size={14} />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                        {bankName && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Banco:{" "}
                            <span className="font-medium text-foreground">
                              {bankName}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Info section */}
                  <div className="mx-5 mt-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                      Informações
                    </p>
                    <div className="rounded-xl border border-border/30 divide-y divide-border/15 overflow-hidden bg-card">
                      <InfoRow
                        label="ID"
                        value={detailW.id}
                        mono
                        copyKey="id"
                      />
                      {acquirer && (
                        <InfoRow label="Adquirente" value={acquirer} />
                      )}
                      {balanceSource && (
                        <InfoRow
                          label="Origem"
                          value={
                            balanceSource === "card"
                              ? "Vendas Cartão"
                              : "Vendas PIX/Boleto"
                          }
                        />
                      )}
                      {detailW.description && (
                        <InfoRow
                          label="Descrição"
                          value={detailW.description}
                        />
                      )}
                    </div>
                  </div>

                  {/* Financial summary */}
                  <div className="mx-5 mt-3 mb-6">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                      Resumo financeiro
                    </p>
                    <div className="rounded-xl border border-border/30 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border/15">
                        <span className="text-xs text-muted-foreground">
                          Valor bruto
                        </span>
                        <span className="text-xs font-semibold text-foreground tabular-nums">
                          {formatCurrency(Math.abs(detailW.amount))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border/15">
                        <span className="text-xs text-muted-foreground">
                          Taxa
                        </span>
                        <span className="text-xs font-semibold text-destructive tabular-nums">
                          - {formatCurrency(fee)}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "flex items-center justify-between px-4 py-3.5",
                          isPaidW ? "bg-primary/5" : "bg-muted/20",
                        )}
                      >
                        <span className="text-xs font-semibold text-foreground">
                          Valor líquido
                        </span>
                        <span
                          className={cn(
                            "text-base font-bold tabular-nums",
                            isPaidW ? "text-primary" : "text-foreground",
                          )}
                        >
                          {formatCurrency(net)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
        </DialogContent>
      </Dialog>
    </SellerLayout>
  );
}
