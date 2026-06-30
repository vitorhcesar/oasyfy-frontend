import useAdminWithdrawalsQuery from "@/presentation/hooks/use-admin-withdrawals-query";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import { useEffect, useState } from "react";
import { type DateRange } from "react-day-picker";
import AdminWithdrawalApprovalDialog from "./components/AdminWithdrawalApprovalDialog";
import AdminWithdrawalsFilters from "./components/AdminWithdrawalsFilters";
import AdminWithdrawalsStats from "./components/AdminWithdrawalsStats";
import AdminWithdrawalsTable from "./components/AdminWithdrawalsTable";
import useFilterWithdrawals from "./hooks/use-filter-withdrawals";
import useWithdrawalStats from "./hooks/use-withdrawal-stats";
import type {
  ApprovalModalData,
  BankData,
  TAdminWithdrawalView,
} from "./types/admin-withdrawal.type";

const PER_PAGE = 20;

export default function AdminWithdrawalsPage() {
  const apiService = useApiService();
  const { data: withdrawals, isLoading, invalidateQuery } =
    useAdminWithdrawalsQuery();

  const [filterSeller, setFilterSeller] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [approvalModal, setApprovalModal] = useState<ApprovalModalData>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [activeStatFilter, setActiveStatFilter] = useState<string | null>(
    null,
  );

  const { filtered, displayFiltered } = useFilterWithdrawals({
    withdrawals,
    filterSeller,
    filterStatus,
    dateRange,
    activeStatFilter,
  });

  const stats = useWithdrawalStats(filtered);

  useEffect(() => {
    setCurrentPage(1);
  }, [filtered, activeStatFilter]);

  const openApprovalModal = async (w: TAdminWithdrawalView) => {
    if (!w.seller_id) return;
    setModalLoading(true);
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

  const handleClearFilters = () => {
    setFilterSeller("");
    setFilterStatus("");
    setDateRange(undefined);
    setActiveStatFilter(null);
  };

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-6xl mx-auto w-full">
        <div className="mb-6 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Saques
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as solicitações de saque dos produtores
          </p>
        </div>

        <AdminWithdrawalsFilters
          filterSeller={filterSeller}
          filterStatus={filterStatus}
          dateRange={dateRange}
          onFilterSellerChange={setFilterSeller}
          onFilterStatusChange={setFilterStatus}
          onDateRangeChange={setDateRange}
          onClearFilters={handleClearFilters}
        />

        <AdminWithdrawalsStats
          stats={stats}
          activeStatFilter={activeStatFilter}
          onStatFilterChange={setActiveStatFilter}
        />

        <AdminWithdrawalsTable
          withdrawals={displayFiltered}
          loading={isLoading}
          currentPage={currentPage}
          perPage={PER_PAGE}
          actionLoading={actionLoading}
          onPageChange={setCurrentPage}
          onOpenApprovalModal={openApprovalModal}
        />
      </div>

      <AdminWithdrawalApprovalDialog
        approvalModal={approvalModal}
        modalLoading={modalLoading}
        actionLoading={actionLoading}
        onApprovalModalChange={setApprovalModal}
        onActionLoadingChange={setActionLoading}
        onSuccess={invalidateQuery}
      />
    </AdminLayout>
  );
}
