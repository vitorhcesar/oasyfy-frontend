import { Transaction } from "@/domain/entities/transaction.entity";
import PageHeader from "@/presentation/components/PageHeader";
import ListPagination from "@/presentation/components/ListPagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/presentation/components/Select";
import { displayedTransactionStatus } from "@/presentation/utils/transaction-status";
import { PixIcon } from "@/presentation/components/PixIcon";
import { SellerLayout } from "@/presentation/components/seller/SellerLayout";
import SellerTransactionDetailDialog from "@/presentation/pages/seller/components/SellerTransactionDetailDialog";
import useSellerTransactionsQuery from "@/presentation/hooks/use-seller-transactions-query";
import { cn } from "@/presentation/utils/cn";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  Loader2,
  Receipt,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface TransactionView {
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

function toTransactionView(tx: Transaction): TransactionView {
  return {
    id: String(tx.id),
    amount: tx.amount,
    currency: tx.currency,
    status: tx.status,
    method: tx.method,
    customer_name: tx.customerName,
    customer_email: tx.customerEmail,
    description: tx.description,
    created_at: new Date(tx.createdAt).toISOString(),
    updated_at: new Date(tx.updatedAt).toISOString(),
    fee_amount: tx.feeAmount,
    net_amount: tx.netAmount,
    pix_code: tx.pixCode,
    acquirer: tx.acquirer,
    metadata: tx.metadata,
    refund_reason: tx.refundReason,
    lock_reason: tx.lockReason,
    is_locked: tx.isLocked,
    is_fake_refund: tx.isFakeRefund,
  };
}

type StatusFilter =
  | "all"
  | "pending"
  | "completed"
  | "failed"
  | "refunded"
  | "cancelled";
type MethodFilter = "all" | "pix" | "card" | "boleto" | "crypto";
type SplitFilter = "all" | "with_split" | "split_credit";

const PER_PAGE = 15;

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function isSplitCredit(meta: Record<string, unknown> | null): boolean {
  return meta?.type === "split_credit";
}

function hasSaleSplit(meta: Record<string, unknown> | null): boolean {
  if (!meta || isSplitCredit(meta)) return false;
  const split = meta.split;
  return (
    !!split &&
    typeof split === "object" &&
    !Array.isArray(split) &&
    Array.isArray((split as { breakdown?: unknown }).breakdown)
  );
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
    bg: "bg-warning/10",
    text: "text-warning",
    dot: "bg-warning",
  },
  completed: {
    label: "Aprovada",
    bg: "bg-primary/10",
    text: "text-primary",
    dot: "bg-primary",
  },
  paid: {
    label: "Aprovada",
    bg: "bg-primary/10",
    text: "text-primary",
    dot: "bg-primary",
  },
  failed: {
    label: "Falhou",
    bg: "bg-destructive/10",
    text: "text-destructive",
    dot: "bg-destructive",
  },
  expired: {
    label: "Expirado",
    bg: "bg-destructive/10",
    text: "text-destructive",
    dot: "bg-destructive",
  },
  refunded: {
    label: "Estornada",
    bg: "bg-warning/10",
    text: "text-warning",
    dot: "bg-warning",
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

const saleSplitBadgeClass =
  "inline-flex items-center rounded px-1 py-px text-[9px] font-semibold uppercase leading-tight tracking-wide bg-primary/10 text-primary";

const filterSelectTriggerClass =
  "h-auto w-auto min-w-[9.5rem] cursor-pointer rounded-xl border-border/60 px-3.5 py-2.5 text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:ring-offset-0";

const statusFilterOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos status" },
  { value: "pending", label: "Pendente" },
  { value: "completed", label: "Aprovada" },
  { value: "failed", label: "Falhou" },
  { value: "refunded", label: "Estornada" },
  { value: "cancelled", label: "Cancelada" },
];

const methodFilterOptions: { value: MethodFilter; label: string }[] = [
  { value: "all", label: "Todos métodos" },
  { value: "pix", label: "Pix" },
  { value: "card", label: "Cartão" },
  { value: "boleto", label: "Boleto" },
  { value: "crypto", label: "Crypto" },
];

const splitFilterOptions: { value: SplitFilter; label: string }[] = [
  { value: "all", label: "Todos splits" },
  { value: "with_split", label: "Venda com split" },
  { value: "split_credit", label: "Split recebido" },
];

function FilterSelect<T extends string>({
  value,
  onValueChange,
  options,
}: {
  value: T;
  onValueChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={(next) => onValueChange(next as T)}>
      <SelectTrigger className={filterSelectTriggerClass}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function MethodLabel({
  method,
  className,
}: {
  method: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground",
        className,
      )}
    >
      {method === "pix" && <PixIcon className="h-4 w-4" />}
      {methodLabels[method] || method}
    </span>
  );
}

export default function SellerTransactions() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");
  const [splitFilter, setSplitFilter] = useState<SplitFilter>("all");
  const [page, setPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<TransactionView | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const {
    data: rawTransactions,
    isPending: loading,
    total,
    totalPages,
    approvedCount,
    approvedAmount,
  } = useSellerTransactionsQuery({
    page,
    limit: PER_PAGE,
    kind: "sales",
    q: debouncedSearch || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    method: methodFilter === "all" ? undefined : methodFilter,
  });

  const transactions = useMemo(
    () => rawTransactions.map(toTransactionView),
    [rawTransactions],
  );

  const filtered = useMemo(() => {
    if (splitFilter === "all") return transactions;
    return transactions.filter((t) => {
      if (splitFilter === "with_split") return hasSaleSplit(t.metadata);
      return isSplitCredit(t.metadata);
    });
  }, [transactions, splitFilter]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, methodFilter, splitFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const totalAmount = approvedAmount;
  const totalCount = total;
  const paidCount = approvedCount;

  const StatusBadge = ({ tx }: { tx: TransactionView }) => {
    const s = statusConfig[displayedTransactionStatus(tx)] || {
      label: tx.status,
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
      <div className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-9">
        <PageHeader
          eyebrow="Financeiro"
          title="Transações"
          description="Histórico completo de movimentações"
        />

        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="admin-surface p-4 md:p-5">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="mt-1 text-xl font-bold tracking-tight text-foreground tabular-nums md:text-2xl">
              {totalCount}
            </p>
          </div>
          <div className="admin-surface p-4 md:p-5">
            <p className="text-sm text-muted-foreground">Aprovadas</p>
            <p className="mt-1 text-xl font-bold tracking-tight text-primary tabular-nums md:text-2xl">
              {paidCount}
            </p>
          </div>
          <div className="admin-surface admin-surface-featured p-4 md:p-5">
            <p className="text-sm text-muted-foreground">Valor aprovado</p>
            <p className="mt-1 text-xl font-bold tracking-tight text-foreground tabular-nums md:text-2xl">
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>

        <div className="admin-surface mb-6 p-4 md:p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Filtros</h3>
          <div className="flex flex-wrap items-end gap-3">
            <div className="relative min-w-[180px] flex-1 max-w-xs">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente, email ou ID..."
                className="w-full rounded-xl border border-border/60 bg-background py-2.5 pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <FilterSelect
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={statusFilterOptions}
            />
            <FilterSelect
              value={methodFilter}
              onValueChange={setMethodFilter}
              options={methodFilterOptions}
            />
            <FilterSelect
              value={splitFilter}
              onValueChange={setSplitFilter}
              options={splitFilterOptions}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : (splitFilter === "all" ? total === 0 : filtered.length === 0) ? (
          <div className="admin-surface px-6 py-16 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50">
              <Receipt className="text-muted-foreground/40" size={18} />
            </div>
            <p className="mb-0.5 text-sm font-medium text-foreground">
              Nenhuma transação
            </p>
            <p className="text-sm text-muted-foreground">
              As transações aparecerão aqui.
            </p>
          </div>
        ) : (
          <>
            <div className="admin-surface hidden overflow-hidden md:block">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 border-b border-border/40 px-5 py-3">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Cliente
                </span>
                <span className="w-24 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Valor
                </span>
                <span className="w-20 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Método
                </span>
                <span className="w-20 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </span>
                <span className="w-28 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Data
                </span>
                <span className="w-7" />
              </div>
              <div className="divide-y divide-border/40">
                {filtered.map((tx) => {
                  const isWithdrawal = tx.method === "withdrawal";
                  const splitCredit = isSplitCredit(tx.metadata);
                  const saleSplit = hasSaleSplit(tx.metadata);
                  return (
                    <div
                      key={tx.id}
                      className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/10"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                            isWithdrawal
                              ? "bg-warning/10 text-warning"
                              : "bg-primary/10 text-primary",
                          )}
                        >
                          {isWithdrawal ? (
                            <ArrowUpRight size={16} strokeWidth={2} />
                          ) : (
                            <ArrowDownLeft size={16} strokeWidth={2} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-medium text-foreground">
                              {tx.customer_name}
                            </p>
                            {splitCredit && (
                              <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                                Split recebido
                              </span>
                            )}
                            {saleSplit && (
                              <span className={saleSplitBadgeClass}>
                                Com split
                              </span>
                            )}
                          </div>
                          {tx.customer_email && (
                            <p className="truncate text-xs text-muted-foreground">
                              {tx.customer_email}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "w-24 text-right text-sm font-semibold tabular-nums",
                          isWithdrawal ? "text-warning" : "text-foreground",
                        )}
                      >
                        {isWithdrawal ? "- " : ""}
                        {formatCurrency(Math.abs(tx.amount))}
                      </span>
                      <span className="w-20">
                        <MethodLabel method={tx.method} />
                      </span>
                      <span className="w-20">
                        <StatusBadge tx={tx} />
                      </span>
                      <span className="w-28 text-right text-sm tabular-nums text-muted-foreground">
                        {formatDateTime(tx.created_at)}
                      </span>
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 md:hidden">
              {filtered.map((tx) => {
                const isWithdrawal = tx.method === "withdrawal";
                const splitCredit = isSplitCredit(tx.metadata);
                const saleSplit = hasSaleSplit(tx.metadata);
                return (
                  <div key={tx.id} className="admin-surface p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                            isWithdrawal
                              ? "bg-warning/10 text-warning"
                              : "bg-primary/10 text-primary",
                          )}
                        >
                          {isWithdrawal ? (
                            <ArrowUpRight size={16} strokeWidth={2} />
                          ) : (
                            <ArrowDownLeft size={16} strokeWidth={2} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-medium text-foreground">
                              {tx.customer_name}
                            </p>
                            {splitCredit && (
                              <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                                Split
                              </span>
                            )}
                            {saleSplit && (
                              <span className={saleSplitBadgeClass}>
                                Com split
                              </span>
                            )}
                          </div>
                          {tx.customer_email && (
                            <p className="truncate text-xs text-muted-foreground">
                              {tx.customer_email}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 text-sm font-semibold tabular-nums",
                          isWithdrawal ? "text-warning" : "text-foreground",
                        )}
                      >
                        {isWithdrawal ? "- " : ""}
                        {formatCurrency(Math.abs(tx.amount))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MethodLabel method={tx.method} className="text-xs" />
                        <StatusBadge tx={tx} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm md:text-xs text-muted-foreground tabular-nums">
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

            <ListPagination
              page={page}
              totalPages={totalPages}
              total={splitFilter === "all" ? total : filtered.length}
              perPage={PER_PAGE}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <SellerTransactionDetailDialog
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </SellerLayout>
  );
}
