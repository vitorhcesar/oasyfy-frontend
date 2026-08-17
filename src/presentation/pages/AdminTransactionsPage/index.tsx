import { Calendar } from "@/presentation/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/presentation/components/ui/popover";
import useAdminTransactionSellerQuery from "@/presentation/hooks/use-admin-transaction-seller-query";
import useAdminTransactionsQuery from "@/presentation/hooks/use-admin-transactions-query";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import { cn } from "@/presentation/utils/cn";
import { matchesTransactionStatusFilter } from "@/presentation/utils/transaction-status";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { type DateRange } from "react-day-picker";
import { toast } from "sonner";
import AdminTransactionDetailDialog from "./components/AdminTransactionDetailDialog";
import AdminTransactionsFilters from "./components/AdminTransactionsFilters";
import AdminTransactionsStats from "./components/AdminTransactionsStats";
import AdminTransactionsTable from "./components/AdminTransactionsTable";
import useTransactionStats, {
  transactionStatsFromSummary,
} from "./hooks/use-transaction-stats";
import type { Transaction } from "./types/admin-transaction.type";
import { isAdminBalanceAdjustment } from "./utils/is-admin-balance-adjustment";
import { isSplitCreditMetadata } from "./utils/transaction-split";

const PER_PAGE = 20;
type TTimeRange = "7d" | "30d" | "90d" | "custom";

function endOfDay(date: Date) {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

function resolveAdminListRange(
  filterTimeRange: TTimeRange,
  dateRange: DateRange | undefined,
): { from?: string; to?: string } {
  if (filterTimeRange === "custom" && dateRange?.from) {
    return {
      from: dateRange.from.toISOString(),
      to: dateRange.to ? endOfDay(dateRange.to).toISOString() : undefined,
    };
  }
  const days =
    filterTimeRange === "30d" ? 30 : filterTimeRange === "90d" ? 90 : 7;
  return {
    from: new Date(Date.now() - days * 86400000).toISOString(),
  };
}

export default function AdminTransactionsPage() {
  const apiService = useApiService();

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [lockReason, setLockReason] = useState("");
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [showFakeRefundForm, setShowFakeRefundForm] = useState(false);
  const [showLockForm, setShowLockForm] = useState(false);

  const [filterId, setFilterId] = useState("");
  const [filterPixCode, setFilterPixCode] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [filterAcquirer, setFilterAcquirer] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTimeRange, setFilterTimeRange] = useState<TTimeRange>("7d");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [pixSearchResults, setPixSearchResults] = useState<
    Transaction[] | null
  >(null);
  const [pixSearchLoading, setPixSearchLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedId, setDebouncedId] = useState("");
  const [debouncedCustomer, setDebouncedCustomer] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedId(filterId), 300);
    return () => window.clearTimeout(timer);
  }, [filterId]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedCustomer(filterCustomer),
      300,
    );
    return () => window.clearTimeout(timer);
  }, [filterCustomer]);

  const listRange = useMemo(
    () => resolveAdminListRange(filterTimeRange, dateRange),
    [filterTimeRange, dateRange],
  );

  const {
    data: transactions,
    isLoading: loading,
    total,
    totalPages,
    stats: apiStats,
    statsTotal,
    invalidateQuery,
  } = useAdminTransactionsQuery({
    page: currentPage,
    limit: PER_PAGE,
    id: debouncedId,
    customer: debouncedCustomer,
    method: filterMethod || undefined,
    acquirer: filterAcquirer || undefined,
    status: filterStatus || undefined,
    from: listRange.from,
    to: listRange.to,
  });

  const sellerId = selectedTx?.seller_id
    ? Number(selectedTx.seller_id)
    : null;
  const { data: sellerData } = useAdminTransactionSellerQuery(
    sellerId != null && !Number.isNaN(sellerId) ? sellerId : null,
  );

  const sellerInfo = sellerData
    ? {
        full_name: sellerData.fullName,
        account_id: sellerData.accountId,
        email: sellerData.email ?? undefined,
      }
    : null;

  const sellerKyc = sellerData
    ? {
        email: sellerData.email ?? undefined,
        cpf: sellerData.cpf ?? undefined,
        cnpj: sellerData.cnpj ?? undefined,
      }
    : null;

  const searchByPixCode = async (code: string) => {
    if (code.trim().length < 3) {
      setPixSearchResults(null);
      return;
    }
    setPixSearchLoading(true);
    try {
      const rows = await apiService.modules.pix.searchTransactions(code.trim());
      setPixSearchResults((rows as Transaction[]) ?? []);
    } catch {
      setPixSearchResults([]);
    }
    setPixSearchLoading(false);
  };

  const pixFiltered = useMemo(() => {
    if (pixSearchResults === null) return null;
    const source = pixSearchResults.filter(
      (t) => !isSplitCreditMetadata(t.metadata),
    );
    if (!filterStatus) return source;
    if (filterStatus === "completed") {
      return source.filter(
        (t) =>
          matchesTransactionStatusFilter(t.status, "completed") &&
          t.method !== "withdrawal",
      );
    }
    return source.filter((t) => t.status === filterStatus);
  }, [pixSearchResults, filterStatus]);

  const pixStats = useTransactionStats(pixFiltered ?? []);
  const apiMappedStats = useMemo(
    () => transactionStatsFromSummary(apiStats, statsTotal),
    [apiStats, statsTotal],
  );
  const stats = pixFiltered !== null ? pixStats : apiMappedStats;

  const tableRows = pixFiltered ?? transactions;
  const tableTotal = pixFiltered !== null ? pixFiltered.length : total;
  const tableTotalPages =
    pixFiltered !== null
      ? Math.max(1, Math.ceil(pixFiltered.length / PER_PAGE))
      : totalPages;
  const paginatedRows =
    pixFiltered !== null
      ? pixFiltered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)
      : tableRows;

  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedId,
    debouncedCustomer,
    filterMethod,
    filterAcquirer,
    filterStatus,
    filterTimeRange,
    dateRange,
    pixSearchResults,
  ]);

  useEffect(() => {
    if (currentPage > tableTotalPages) setCurrentPage(tableTotalPages);
  }, [currentPage, tableTotalPages]);

  const handleStatFilterChange = (statusKey: string | null) => {
    setFilterStatus(statusKey ?? "");
    setPixSearchResults(null);
  };

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

  const closeDetail = () => {
    setSelectedTx(null);
    resetDetailForms();
  };

  const handleRefund = async (fake: boolean) => {
    if (!selectedTx || isAdminBalanceAdjustment(selectedTx)) return;
    setActionLoading(true);
    try {
      const updated = await apiService.modules.adminFinance.refundTransaction(
        Number(selectedTx.id),
        { reason: refundReason.trim() || undefined, isFake: fake },
      );
      toast.success(fake ? "Reembolso fake aplicado" : "Reembolso realizado");
      setSelectedTx(updated);
      setShowRefundForm(false);
      setShowFakeRefundForm(false);
      setRefundReason("");
      await invalidateQuery();
    } catch {
      toast.error("Erro ao processar reembolso");
    }
    setActionLoading(false);
  };

  const handleLockToggle = async () => {
    if (!selectedTx) return;
    const isLocking = !selectedTx.is_locked;
    if (isLocking && !lockReason.trim()) return;
    setActionLoading(true);
    try {
      const updated = await apiService.modules.adminFinance.lockTransaction(
        Number(selectedTx.id),
        {
          locked: isLocking,
          lockReason: isLocking ? lockReason.trim() : null,
        },
      );
      toast.success(isLocking ? "Venda travada" : "Venda destravada");
      setSelectedTx(updated);
      setShowLockForm(false);
      setLockReason("");
      await invalidateQuery();
    } catch {
      toast.error("Erro ao alterar status");
    }
    setActionLoading(false);
  };

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-9">
        <header className="mb-7 flex animate-fade-in flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Comercial
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-[2.15rem]">
              Vendas
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Gerencie todas as transações do gateway.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="liquid-glass-control flex items-center gap-0.5 rounded-2xl p-1">
              {(["7d", "30d", "90d"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setFilterTimeRange(p);
                    setDateRange(undefined);
                  }}
                  className={cn(
                    "rounded-xl px-3.5 py-2 text-sm font-semibold uppercase tracking-wide transition-all",
                    filterTimeRange === p
                      ? "bg-white text-[#111827] shadow-sm"
                      : "text-muted-foreground hover:bg-white/10 hover:text-foreground",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "liquid-glass-control flex h-10 items-center gap-2 rounded-2xl px-3.5 text-sm font-medium transition-colors hover:bg-white/10",
                    filterTimeRange === "custom" && "border-primary/50 text-primary",
                  )}
                >
                  <CalendarIcon size={15} />
                  {dateRange?.from && dateRange?.to
                    ? `${format(dateRange.from, "dd/MM", {
                        locale: ptBR,
                      })} - ${format(dateRange.to, "dd/MM", { locale: ptBR })}`
                    : "Período"}
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="liquid-glass-control w-auto border-white/15 p-3"
                align="end"
              >
                <p className="mb-2 text-sm font-medium text-foreground">
                  Selecione o período
                </p>
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
                    className="mt-2 text-sm font-medium text-primary hover:underline"
                  >
                    Limpar
                  </button>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <AdminTransactionsStats
              stats={stats}
              activeStatFilter={filterStatus || null}
              onStatFilterChange={handleStatFilterChange}
            />

            <AdminTransactionsFilters
              filterId={filterId}
              filterPixCode={filterPixCode}
              filterCustomer={filterCustomer}
              filterMethod={filterMethod}
              filterAcquirer={filterAcquirer}
              filterStatus={filterStatus}
              pixSearchLoading={pixSearchLoading}
              onFilterIdChange={setFilterId}
              onFilterPixCodeChange={setFilterPixCode}
              onFilterCustomerChange={setFilterCustomer}
              onFilterMethodChange={setFilterMethod}
              onFilterAcquirerChange={setFilterAcquirer}
              onFilterStatusChange={(value) => {
                setFilterStatus(value);
              }}
              onPixSearch={() => searchByPixCode(filterPixCode)}
              onClearPixSearch={() => setPixSearchResults(null)}
            />

            <AdminTransactionsTable
              loading={false}
              rows={paginatedRows}
              total={tableTotal}
              currentPage={currentPage}
              totalPages={tableTotalPages}
              perPage={PER_PAGE}
              onPageChange={setCurrentPage}
              onOpenDetail={openDetail}
            />
          </>
        )}
      </div>

      <AdminTransactionDetailDialog
        selectedTx={selectedTx}
        sellerInfo={sellerInfo}
        sellerKyc={sellerKyc}
        actionLoading={actionLoading}
        refundReason={refundReason}
        lockReason={lockReason}
        showRefundForm={showRefundForm}
        showFakeRefundForm={showFakeRefundForm}
        showLockForm={showLockForm}
        onClose={closeDetail}
        onRefundReasonChange={setRefundReason}
        onLockReasonChange={setLockReason}
        onShowRefundForm={() => {
          resetDetailForms();
          setShowRefundForm(true);
        }}
        onShowFakeRefundForm={() => {
          resetDetailForms();
          setShowFakeRefundForm(true);
        }}
        onShowLockForm={() => {
          resetDetailForms();
          setShowLockForm(true);
        }}
        onHideRefundForm={() => setShowRefundForm(false)}
        onHideFakeRefundForm={() => setShowFakeRefundForm(false)}
        onHideLockForm={() => setShowLockForm(false)}
        onRefund={handleRefund}
        onLockToggle={handleLockToggle}
      />
    </AdminLayout>
  );
}
