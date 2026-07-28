import useAdminWithdrawalsQuery from "@/presentation/hooks/use-admin-withdrawals-query";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

  const filteredWithoutStatus = useFilterWithdrawals({
    withdrawals,
    filterSeller,
    filterStatus: "",
    dateRange,
  });

  const stats = useWithdrawalStats(filteredWithoutStatus);

  const displayFiltered = useMemo(() => {
    if (!filterStatus) return filteredWithoutStatus;

    if (filterStatus === "cancelled") {
      return filteredWithoutStatus.filter(
        (w) => w.status === "cancelled" || w.status === "failed",
      );
    }

    return filteredWithoutStatus.filter((w) => w.status === filterStatus);
  }, [filteredWithoutStatus, filterStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredWithoutStatus, filterStatus]);

  const handleStatFilterChange = (statusKey: string | null) => {
    setFilterStatus(statusKey ?? "");
  };

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
  };

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-9">
        <header className="mb-7 animate-fade-in">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Financeiro
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-[2.15rem]">
            Saques
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Gerencie as solicitações de saque dos produtores.
          </p>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <AdminWithdrawalsStats
              stats={stats}
              activeStatFilter={filterStatus || null}
              onStatFilterChange={handleStatFilterChange}
            />

            <AdminWithdrawalsFilters
              filterSeller={filterSeller}
              filterStatus={filterStatus}
              dateRange={dateRange}
              onFilterSellerChange={setFilterSeller}
              onFilterStatusChange={setFilterStatus}
              onDateRangeChange={setDateRange}
              onClearFilters={handleClearFilters}
            />

            <AdminWithdrawalsTable
              withdrawals={displayFiltered}
              loading={false}
              currentPage={currentPage}
              perPage={PER_PAGE}
              actionLoading={actionLoading}
              onPageChange={setCurrentPage}
              onOpenApprovalModal={openApprovalModal}
            />
          </>
        )}
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
