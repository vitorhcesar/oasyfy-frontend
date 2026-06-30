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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { type DateRange } from "react-day-picker";
import { toast } from "sonner";
import AdminTransactionDetailDialog from "./components/AdminTransactionDetailDialog";
import AdminTransactionsFilters from "./components/AdminTransactionsFilters";
import AdminTransactionsStats from "./components/AdminTransactionsStats";
import AdminTransactionsTable from "./components/AdminTransactionsTable";
import useFilterTransactions from "./hooks/use-filter-transactions";
import useTransactionStats from "./hooks/use-transaction-stats";
import type { Transaction } from "./types/admin-transaction.type";

const PER_PAGE = 20;

export default function AdminTransactionsPage() {
  const apiService = useApiService();
  const {
    data: transactions,
    isLoading: loading,
    invalidateQuery,
  } = useAdminTransactionsQuery();

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
  const [filterTimeRange, setFilterTimeRange] = useState("7d");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [pixSearchResults, setPixSearchResults] = useState<
    Transaction[] | null
  >(null);
  const [pixSearchLoading, setPixSearchLoading] = useState(false);

  const [activeStatFilter, setActiveStatFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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

  const filtered = useFilterTransactions({
    transactions,
    filterId,
    filterCustomer,
    filterMethod,
    filterAcquirer,
    filterStatus,
    filterTimeRange,
    dateRange,
  });

  const stats = useTransactionStats(filtered);

  const baseFiltered = useMemo(() => {
    if (pixSearchResults !== null) return pixSearchResults;
    if (!activeStatFilter) return filtered;
    return filtered.filter((t) => t.status === activeStatFilter);
  }, [filtered, activeStatFilter, pixSearchResults]);

  const displayFiltered = baseFiltered;
  const totalPages = Math.max(1, Math.ceil(displayFiltered.length / PER_PAGE));
  const paginatedData = displayFiltered.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filtered, activeStatFilter]);

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
    if (!selectedTx || !refundReason.trim()) return;
    setActionLoading(true);
    try {
      const updated = await apiService.modules.adminFinance.refundTransaction(
        Number(selectedTx.id),
        { reason: refundReason.trim(), isFake: fake },
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
      <div className="px-4 md:px-6 py-4 max-w-6xl mx-auto w-full">
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
                      : "bg-card border-border/50 text-muted-foreground hover:text-foreground",
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

        <AdminTransactionsStats
          stats={stats}
          activeStatFilter={activeStatFilter}
          onStatFilterChange={setActiveStatFilter}
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
          onFilterStatusChange={setFilterStatus}
          onPixSearch={() => searchByPixCode(filterPixCode)}
          onClearPixSearch={() => setPixSearchResults(null)}
        />

        <AdminTransactionsTable
          loading={loading}
          displayFiltered={displayFiltered}
          paginatedData={paginatedData}
          currentPage={currentPage}
          totalPages={totalPages}
          perPage={PER_PAGE}
          onPageChange={setCurrentPage}
          onOpenDetail={openDetail}
        />
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
