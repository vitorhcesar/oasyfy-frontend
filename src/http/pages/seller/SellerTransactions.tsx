import { SellerLayout } from "@/http/components/seller/SellerLayout";
import { Dialog, DialogContent } from "@/http/components/ui/dialog";
import { useAuthStore } from "@/http/stores/useAuthStore";
import { cn } from "@/http/utils/cn";
import { supabase } from "@/infra/integrations/supabase/client";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Loader2,
  Receipt,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface Transaction {
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
  fee_amount: number;
  net_amount: number;
  pix_code: string | null;
  acquirer: string | null;
  metadata: Record<string, unknown> | null;
  refund_reason: string | null;
  lock_reason: string | null;
  is_locked: boolean;
  is_fake_refund: boolean;
}

type StatusFilter =
  | "all"
  | "pending"
  | "completed"
  | "failed"
  | "refunded"
  | "cancelled";
type MethodFilter = "all" | "pix" | "card" | "boleto" | "crypto";

const PER_PAGE = 15;

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
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

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  pending: {
    label: "Pendente",
    bg: "bg-amber-500/8",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  completed: {
    label: "Aprovada",
    bg: "bg-primary/8",
    text: "text-primary",
    dot: "bg-primary",
  },
  paid: {
    label: "Aprovada",
    bg: "bg-primary/8",
    text: "text-primary",
    dot: "bg-primary",
  },
  failed: {
    label: "Falhou",
    bg: "bg-destructive/8",
    text: "text-destructive",
    dot: "bg-destructive",
  },
  refunded: {
    label: "Estornada",
    bg: "bg-amber-500/8",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  cancelled: {
    label: "Cancelada",
    bg: "bg-muted",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground/40",
  },
};

const methodLabels: Record<string, string> = {
  pix: "Pix",
  card: "Cartão",
  boleto: "Boleto",
  crypto: "Crypto",
  withdrawal: "Saque",
};

export default function SellerTransactions() {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");
  const [page, setPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchTx = async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("seller_id", user.id)
        .neq("method", "withdrawal")
        .neq("customer_name", "Ajuste administrativo")
        .order("created_at", { ascending: false });
      setTransactions((data as Transaction[]) ?? []);
      setLoading(false);
    };
    fetchTx();
  }, [user]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (methodFilter !== "all" && t.method !== methodFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.customer_name.toLowerCase().includes(q) ||
          t.id.includes(q) ||
          (t.customer_email || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [transactions, search, statusFilter, methodFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, methodFilter]);

  const totalAmount = filtered
    .filter((t) => t.status === "paid" || t.status === "completed")
    .reduce((s, t) => s + t.amount, 0);
  const totalCount = filtered.length;
  const paidCount = filtered.filter(
    (t) => t.status === "paid" || t.status === "completed"
  ).length;

  const StatusBadge = ({ status }: { status: string }) => {
    const s = statusConfig[status] || {
      label: status,
      bg: "bg-muted",
      text: "text-muted-foreground",
      dot: "bg-muted-foreground/40",
    };
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium",
          s.bg,
          s.text
        )}
      >
        <span className={cn("w-1 h-1 rounded-full", s.dot)} />
        {s.label}
      </span>
    );
  };

  return (
    <SellerLayout>
      <div className="w-full max-w-5xl mx-auto px-3 md:px-6 py-6">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-lg font-semibold text-foreground">Transações</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Histórico completo de movimentações
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="p-3.5 rounded-xl bg-card border border-border/40">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-sm font-semibold text-foreground">
              {totalCount}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-card border border-border/40">
            <p className="text-xs text-muted-foreground">Aprovadas</p>
            <p className="text-sm font-semibold text-primary">{paidCount}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-card border border-border/40">
            <p className="text-xs text-muted-foreground">Valor aprovado</p>
            <p className="text-sm font-semibold text-foreground">
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente, email ou ID..."
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-card border border-border/40 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/30 transition-all placeholder:text-muted-foreground/40"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-2.5 py-2 rounded-lg bg-card border border-border/40 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
          >
            <option value="all">Todos status</option>
            <option value="pending">Pendente</option>
            <option value="completed">Aprovada</option>
            <option value="failed">Falhou</option>
            <option value="refunded">Estornada</option>
            <option value="cancelled">Cancelada</option>
          </select>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as MethodFilter)}
            className="px-2.5 py-2 rounded-lg bg-card border border-border/40 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
          >
            <option value="all">Todos métodos</option>
            <option value="pix">Pix</option>
            <option value="card">Cartão</option>
            <option value="boleto">Boleto</option>
            <option value="crypto">Crypto</option>
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={18} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border/40 bg-card p-12 text-center">
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <Receipt className="text-muted-foreground/40" size={18} />
            </div>
            <p className="text-xs font-medium text-foreground mb-0.5">
              Nenhuma transação
            </p>
            <p className="text-xs text-muted-foreground">
              As transações aparecerão aqui.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block rounded-xl bg-card border border-border/40 overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-2.5 border-b border-border/30">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Cliente
                </span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider w-24 text-right">
                  Valor
                </span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider w-16">
                  Método
                </span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider w-20">
                  Status
                </span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider w-28 text-right">
                  Data
                </span>
                <span className="w-7" />
              </div>
              <div className="divide-y divide-border/20">
                {paginated.map((tx) => {
                  const isWithdrawal = tx.method === "withdrawal";
                  return (
                    <div
                      key={tx.id}
                      className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-3 items-center hover:bg-muted/10 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                            isWithdrawal
                              ? "bg-amber-500/8 text-amber-500"
                              : "bg-primary/8 text-primary"
                          )}
                        >
                          {isWithdrawal ? (
                            <ArrowUpRight size={12} strokeWidth={2} />
                          ) : (
                            <ArrowDownLeft size={12} strokeWidth={2} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs md:text-sm font-medium text-foreground truncate">
                            {tx.customer_name}
                          </p>
                          {tx.customer_email && (
                            <p className="text-[11px] md:text-xs text-muted-foreground truncate">
                              {tx.customer_email}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-xs font-semibold w-24 text-right tabular-nums",
                          isWithdrawal ? "text-amber-500" : "text-foreground"
                        )}
                      >
                        {isWithdrawal ? "- " : ""}
                        {formatCurrency(Math.abs(tx.amount))}
                      </span>
                      <span className="text-xs text-muted-foreground w-16 font-medium">
                        {methodLabels[tx.method] || tx.method}
                      </span>
                      <span className="w-20">
                        <StatusBadge status={tx.status} />
                      </span>
                      <span className="text-xs text-muted-foreground w-28 text-right tabular-nums">
                        {formatDateTime(tx.created_at)}
                      </span>
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden space-y-2">
              {paginated.map((tx) => {
                const isWithdrawal = tx.method === "withdrawal";
                return (
                  <div
                    key={tx.id}
                    className="rounded-xl bg-card border border-border/40 p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                            isWithdrawal
                              ? "bg-amber-500/8 text-amber-500"
                              : "bg-primary/8 text-primary"
                          )}
                        >
                          {isWithdrawal ? (
                            <ArrowUpRight size={12} strokeWidth={2} />
                          ) : (
                            <ArrowDownLeft size={12} strokeWidth={2} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs md:text-sm font-medium text-foreground truncate">
                            {tx.customer_name}
                          </p>
                          {tx.customer_email && (
                            <p className="text-[11px] md:text-xs text-muted-foreground truncate">
                              {tx.customer_email}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-xs font-semibold tabular-nums shrink-0",
                          isWithdrawal ? "text-amber-500" : "text-foreground"
                        )}
                      >
                        {isWithdrawal ? "- " : ""}
                        {formatCurrency(Math.abs(tx.amount))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium">
                          {methodLabels[tx.method] || tx.method}
                        </span>
                        <StatusBadge status={tx.status} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] md:text-xs text-muted-foreground tabular-nums">
                          {formatDateTime(tx.created_at)}
                        </span>
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                        >
                          <Eye size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-muted-foreground">
                  {(page - 1) * PER_PAGE + 1}–
                  {Math.min(page * PER_PAGE, filtered.length)} de{" "}
                  {filtered.length}
                </p>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-md hover:bg-muted/30 disabled:opacity-20 transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (page <= 3) pageNum = i + 1;
                    else if (page >= totalPages - 2)
                      pageNum = totalPages - 4 + i;
                    else pageNum = page - 2 + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={cn(
                          "w-7 h-7 rounded-md text-xs font-medium transition-colors",
                          page === pageNum
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted/30 text-muted-foreground"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-md hover:bg-muted/30 disabled:opacity-20 transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Transaction Detail Modal */}
      <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden border-border/60">
          {selectedTx &&
            (() => {
              const tx = selectedTx;
              const isWithdrawal = tx.method === "withdrawal";
              const meta = tx.metadata || {};
              const pixKey = tx.pix_code || (meta.pix_key as string) || null;
              const pixKeyType = (meta.pix_key_type as string) || null;
              const bankName = (meta.bank_name as string) || null;
              const balanceSource = (meta.balance_source as string) || null;

              const copyToClipboard = (text: string) => {
                navigator.clipboard.writeText(text);
                setCopied(true);
                toast.success("Copiado!");
                setTimeout(() => setCopied(false), 2000);
              };

              const DetailRow = ({
                label,
                value,
                mono,
              }: {
                label: string;
                value: string | null | undefined;
                mono?: boolean;
              }) => {
                if (!value) return null;
                return (
                  <div className="flex justify-between items-start px-4 py-2.5">
                    <span className="text-xs text-muted-foreground shrink-0">
                      {label}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-medium text-foreground text-right max-w-[60%] break-all",
                        mono && "font-mono text-[11px]"
                      )}
                    >
                      {value}
                    </span>
                  </div>
                );
              };

              return (
                <div>
                  {/* Header */}
                  <div
                    className={cn(
                      "px-6 pt-6 pb-4",
                      tx.status === "paid" || tx.status === "completed"
                        ? "bg-primary/5"
                        : tx.status === "failed" || tx.status === "cancelled"
                        ? "bg-destructive/5"
                        : tx.status === "pending"
                        ? "bg-amber-500/5"
                        : "bg-muted/20"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <StatusBadge status={tx.status} />
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {formatDateTime(tx.created_at)}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-foreground tabular-nums">
                      {isWithdrawal ? "- " : ""}
                      {formatCurrency(Math.abs(tx.amount))}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tx.customer_name}
                    </p>
                    {tx.customer_email && (
                      <p className="text-xs text-muted-foreground">
                        {tx.customer_email}
                      </p>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-4 space-y-3">
                    {/* Pix destination */}
                    {pixKey && (
                      <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
                        <p className="text-[11px] font-medium text-primary uppercase tracking-wider mb-2">
                          Chave Pix
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono text-foreground break-all">
                            {pixKey}
                          </span>
                          <button
                            onClick={() => copyToClipboard(pixKey)}
                            className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                          >
                            {copied ? (
                              <CheckCircle2
                                size={12}
                                className="text-primary"
                              />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                        {pixKeyType && (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Tipo: {pixKeyType}
                          </p>
                        )}
                        {bankName && (
                          <p className="text-[11px] text-muted-foreground capitalize">
                            Banco: {bankName}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Info rows */}
                    <div className="rounded-xl bg-muted/20 border border-border/40 divide-y divide-border/30">
                      <DetailRow label="ID" value={tx.id} mono />
                      <DetailRow
                        label="Método"
                        value={methodLabels[tx.method] || tx.method}
                      />
                      <DetailRow label="Descrição" value={tx.description} />
                      <DetailRow label="Adquirente" value={tx.acquirer} />
                      {balanceSource && (
                        <DetailRow
                          label="Origem"
                          value={
                            balanceSource === "card"
                              ? "Vendas Cartão"
                              : "Vendas PIX/Boleto"
                          }
                        />
                      )}
                      <DetailRow label="Moeda" value={tx.currency} />
                      <DetailRow
                        label="Atualizado em"
                        value={formatDateTime(tx.updated_at)}
                      />
                    </div>

                    {/* Financial summary */}
                    {(tx.fee_amount > 0 || tx.net_amount !== 0) && (
                      <div className="rounded-xl bg-muted/20 border border-border/40 divide-y divide-border/30">
                        <div className="flex justify-between px-4 py-2.5">
                          <span className="text-xs text-muted-foreground">
                            Valor bruto
                          </span>
                          <span className="text-xs font-semibold text-foreground tabular-nums">
                            {formatCurrency(Math.abs(tx.amount))}
                          </span>
                        </div>
                        {tx.fee_amount > 0 && (
                          <div className="flex justify-between px-4 py-2.5">
                            <span className="text-xs text-muted-foreground">
                              Taxa
                            </span>
                            <span className="text-xs font-semibold text-destructive tabular-nums">
                              - {formatCurrency(tx.fee_amount)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between px-4 py-2.5">
                          <span className="text-xs text-muted-foreground">
                            Valor líquido
                          </span>
                          <span className="text-xs font-bold text-primary tabular-nums">
                            {formatCurrency(
                              Math.abs(
                                tx.net_amount ||
                                  Math.abs(tx.amount) - tx.fee_amount
                              )
                            )}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Refund/lock reasons */}
                    {tx.refund_reason && (
                      <div className="rounded-xl bg-destructive/5 border border-destructive/10 p-3">
                        <p className="text-[11px] font-medium text-destructive uppercase tracking-wider mb-1">
                          Motivo do estorno
                        </p>
                        <p className="text-xs text-foreground">
                          {tx.refund_reason}
                        </p>
                      </div>
                    )}

                    {tx.lock_reason && (
                      <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-3">
                        <p className="text-[11px] font-medium text-amber-500 uppercase tracking-wider mb-1">
                          Motivo do bloqueio
                        </p>
                        <p className="text-xs text-foreground">
                          {tx.lock_reason}
                        </p>
                      </div>
                    )}

                    {/* Metadata */}
                    {meta && Object.keys(meta).length > 0 && (
                      <div className="rounded-xl bg-muted/20 border border-border/40 p-3">
                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          Metadados
                        </p>
                        <div className="space-y-1.5">
                          {Object.entries(meta)
                            .filter(
                              ([k]) =>
                                ![
                                  "pix_key",
                                  "pix_key_type",
                                  "bank_name",
                                  "balance_source",
                                  "approval_log",
                                ].includes(k)
                            )
                            .map(([key, val]) => (
                              <div
                                key={key}
                                className="flex justify-between items-start gap-3"
                              >
                                <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                                  {key}
                                </span>
                                <span className="text-[11px] text-foreground text-right break-all font-mono">
                                  {typeof val === "object"
                                    ? JSON.stringify(val)
                                    : String(val)}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Copy ID button */}
                    <button
                      onClick={() => copyToClipboard(tx.id)}
                      className="w-full py-2 rounded-lg bg-muted/30 border border-border/40 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Copy size={11} />
                      Copiar ID da transação
                    </button>
                  </div>
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>
    </SellerLayout>
  );
}
