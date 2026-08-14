import { Transaction } from "@/domain/entities/transaction.entity";
import KycWithdrawalDetails from "@/presentation/components/KycOnboarding/KycWithdrawalDetails";
import PageHeader from "@/presentation/components/PageHeader";
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
      className: "bg-warning/10 text-warning",
    },
    paid: {
      label: "Concluído",
      icon: CheckCircle2,
      className: "bg-success/10 text-success",
    },
    completed: {
      label: "Concluído",
      icon: CheckCircle2,
      className: "bg-success/10 text-success",
    },
    failed: {
      label: "Falhou",
      icon: XCircle,
      className: "bg-destructive/10 text-destructive",
    },
    rejected: {
      label: "Negado",
      icon: XCircle,
      className: "bg-destructive/10 text-destructive",
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
        "inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium",
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
        "Confirme endereço e dados bancários para sacar.",
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
      color: "text-warning",
    },
    {
      label: "Total sacado",
      value: formatCurrency(totalCompleted),
      color: "text-success",
    },
  ];

  return (
    <SellerLayout>
      <div className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-9">
        <PageHeader
          eyebrow="Financeiro"
          title="Transferências"
          description="Gerencie seus saques e acompanhe o histórico"
          actions={
            <button
              onClick={handleRequestWithdrawal}
              disabled={withdrawalBlocked || !canSell}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {withdrawalBlocked ? (
                <Lock size={14} />
              ) : (
                <ArrowUpRight size={14} />
              )}
              {withdrawalBlocked
                ? "Saque bloqueado"
                : needsWithdrawalDetails
                  ? "Completar dados para saque"
                  : awaitingWithdrawalApproval
                    ? "Aguardando aprovação"
                    : "Solicitar saque"}
            </button>
          }
        />

        {withdrawalBlocked && (
          <div className="admin-surface mb-6 flex items-start gap-3 border-destructive/30 p-4 md:p-5">
            <Lock size={16} className="mt-0.5 flex-shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">
                Saques bloqueados
              </p>
              {blockReason && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Motivo: {blockReason}
                </p>
              )}
            </div>
          </div>
        )}

        {!withdrawalBlocked && needsWithdrawalDetails && (
          <div className="admin-surface mb-6 flex items-start gap-3 border-primary/20 p-4 md:p-5">
            <Lock size={16} className="mt-0.5 flex-shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Complete endereço e dados bancários
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                As vendas já podem estar liberadas. Para sacar, informe
                endereço e conta/PIX e confirme que os dados estão corretos.
              </p>
            </div>
          </div>
        )}

        {!withdrawalBlocked && awaitingWithdrawalApproval && (
          <div className="admin-surface mb-6 flex items-start gap-3 p-4 md:p-5">
            <Clock
              size={16}
              className="mt-0.5 flex-shrink-0 text-muted-foreground"
            />
            <div>
              <p className="text-sm font-medium text-foreground">
                Dados de saque em análise
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Endereço e banco foram enviados. Assim que forem aprovados, os
                saques serão liberados.
              </p>
            </div>
          </div>
        )}

        <div className="mb-6 grid grid-cols-3 gap-3">
          {statCards.map((c) => (
            <div key={c.label} className="admin-surface p-4 md:p-5">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p
                className={cn(
                  "mt-1 text-xl font-bold tracking-tight tabular-nums md:text-2xl",
                  c.color,
                )}
              >
                {c.value}
              </p>
            </div>
          ))}
        </div>

        <div className="admin-surface mb-6 p-4 md:p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Filtros</h3>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50"
              />
              <input
                type="text"
                placeholder="Buscar por ID ou descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-border/60 bg-background py-2.5 pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-1">
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
                    "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    statusFilter === f.key
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
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
                    "flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                    dateFrom || dateTo
                      ? "border-primary/20 bg-primary/10 text-primary"
                      : "border-border/60 bg-background text-muted-foreground hover:text-foreground",
                  )}
                >
                  <CalendarIcon size={14} />
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
                <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">De</p>
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      disabled={(d) => d > new Date()}
                      className="rounded-xl border border-border/60 p-2"
                      locale={ptBR}
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Até</p>
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      disabled={(d) =>
                        d > new Date() || (dateFrom ? d < dateFrom : false)
                      }
                      className="rounded-xl border border-border/60 p-2"
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
                    className="mt-2 text-sm font-medium text-primary hover:underline"
                  >
                    Limpar filtro
                  </button>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-surface px-6 py-16 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50">
              <ArrowUpRight className="text-muted-foreground/40" size={18} />
            </div>
            <p className="mb-0.5 text-sm font-medium text-foreground">
              Nenhuma transferência encontrada
            </p>
            <p className="text-sm text-muted-foreground">
              Solicite seu primeiro saque para começar.
            </p>
          </div>
        ) : (
          <>
            <div className="admin-surface hidden overflow-hidden md:block">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-border/40 px-5 py-3">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Descrição
                </span>
                <span className="w-24 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Valor
                </span>
                <span className="w-20 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </span>
                <span className="w-28 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Data
                </span>
                <span className="w-9" />
              </div>
              <div className="divide-y divide-border/40">
                {filtered.map((w) => (
                  <div
                    key={w.id}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/10"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
                        <ArrowUpRight size={16} strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {w.description || "Saque"}
                        </p>
                        <p className="truncate font-mono text-xs text-muted-foreground">
                          {w.id.slice(0, 8)}...
                        </p>
                        {w.status === "rejected" &&
                          w.metadata?.denial_reason && (
                            <p className="mt-0.5 truncate text-sm text-destructive">
                              Motivo: {w.metadata.denial_reason}
                            </p>
                          )}
                      </div>
                    </div>
                    <span className="w-24 text-right text-sm font-semibold tabular-nums text-warning">
                      - {formatCurrency(w.amount)}
                    </span>
                    <span className="w-20">
                      <StatusBadge status={w.status} />
                    </span>
                    <span className="w-28 text-right text-sm tabular-nums text-muted-foreground">
                      {formatDateTime(w.created_at)}
                    </span>
                    <button
                      onClick={() => setDetailW(w)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 md:hidden">
              {filtered.map((w) => (
                <div
                  key={w.id}
                  className="admin-surface p-4"
                  onClick={() => setDetailW(w)}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
                        <ArrowUpRight size={16} strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {w.description || "Saque"}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {w.id.slice(0, 8)}...
                        </p>
                        {w.status === "rejected" &&
                          w.metadata?.denial_reason && (
                            <p className="mt-0.5 truncate text-sm text-destructive">
                              Motivo: {w.metadata.denial_reason}
                            </p>
                          )}
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-warning">
                      - {formatCurrency(w.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <StatusBadge status={w.status} />
                    <span className="text-sm tabular-nums text-muted-foreground">
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
                          : "bg-gradient-to-b from-warning/8 to-transparent",
                    )}
                  >
                    <div
                      className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm",
                        isRejected
                          ? "bg-destructive/10 text-destructive"
                          : isPaidW
                            ? "bg-primary/10 text-primary"
                            : "bg-warning/10 text-warning",
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
                            : "text-warning",
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
