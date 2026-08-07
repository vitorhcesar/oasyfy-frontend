import { AddBalanceCreditModal } from "@/presentation/components/admin/AddBalanceCreditModal";
import { useApiService } from "@/presentation/hooks/use-api-service";
import type { IAdminBalanceAdjustmentDto } from "@/infra/http/services/api/modules/types/admin-sellers.types";
import {
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  Loader2,
  Lock,
  Plus,
  RotateCcw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import useAdminSellerBalancerQuery from "../hooks/use-admin-seller-balancer-query";
import { IKycSubmissionView } from "../types/kyc-submission-view.type";

function formatCurrencyAdmin(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

interface IAvailableBalanceCardProps {
  available: number;
  onAddCredit: () => void;
}

function AvailableBalanceCard({
  available,
  onAddCredit,
}: IAvailableBalanceCardProps) {
  return (
    <div className="admin-surface admin-surface-featured p-5 md:p-6">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Disponível para saque
        </p>
        <button
          type="button"
          onClick={onAddCredit}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          <Plus size={14} />
          Adicionar saldo
        </button>
      </div>
      <p className="text-2xl font-bold text-foreground tabular-nums">
        {formatCurrencyAdmin(available)}
      </p>
    </div>
  );
}

interface IRetainedBalanceCardProps {
  retained: number;
}

function RetainedBalanceCard({ retained }: IRetainedBalanceCardProps) {
  return (
    <div className="admin-surface p-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-warning/10">
          <Lock size={14} className="text-warning" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Saldo retido
        </p>
      </div>
      <p className="text-xl font-bold tabular-nums tracking-tight text-foreground">
        {formatCurrencyAdmin(retained)}
      </p>
    </div>
  );
}

interface IWithdrawnAmountBalanceCardProps {
  withdrawn: number;
}

function WithdrawnAmountBalanceCard({
  withdrawn,
}: IWithdrawnAmountBalanceCardProps) {
  return (
    <div className="admin-surface p-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted">
          <ArrowUpRight size={14} className="text-muted-foreground" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Total sacado (aprovado)
        </p>
      </div>
      <p className="text-xl font-bold tabular-nums tracking-tight text-foreground">
        {formatCurrencyAdmin(withdrawn)}
      </p>
    </div>
  );
}

interface ITotalSalesCardProps {
  totalSalesCount: number;
  totalSalesAmount: number;
}

function TotalSalesCard({
  totalSalesCount,
  totalSalesAmount,
}: ITotalSalesCardProps) {
  return (
    <div className="admin-surface p-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
          <ArrowDownLeft size={14} className="text-primary" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Vendas realizadas
        </p>
      </div>
      <p className="text-xl font-bold tabular-nums tracking-tight text-foreground">
        {totalSalesCount}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Líquido movimentado: {formatCurrencyAdmin(totalSalesAmount)}
      </p>
    </div>
  );
}

interface IGrossSalesAmountCardProps {
  grossSalesAmount: number;
}

function GrossSalesAmountCard({
  grossSalesAmount,
}: IGrossSalesAmountCardProps) {
  return (
    <div className="admin-surface p-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary">
          <DollarSign size={14} className="text-foreground" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Volume bruto vendido
        </p>
      </div>
      <p className="text-xl font-bold tabular-nums tracking-tight text-foreground">
        {formatCurrencyAdmin(grossSalesAmount)}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Valor total em R$ das vendas aprovadas
      </p>
    </div>
  );
}

interface IEarnedFeesAmountCardProps {
  earnedFeesAmount: number;
}

function EarnedFeesAmountCard({
  earnedFeesAmount,
}: IEarnedFeesAmountCardProps) {
  return (
    <div className="admin-surface p-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-warning/10">
          <DollarSign size={14} className="text-warning" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Taxas geradas
        </p>
      </div>
      <p className="text-xl font-bold tabular-nums tracking-tight text-foreground">
        {formatCurrencyAdmin(earnedFeesAmount)}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Lucro obtido nas taxas desse seller
      </p>
    </div>
  );
}

interface IRefundsAmountCardProps {
  refundCount: number;
  refundAmount: number;
}

function RefundsAmountCard({
  refundCount,
  refundAmount,
}: IRefundsAmountCardProps) {
  return (
    <div className="admin-surface p-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-destructive/10">
          <RotateCcw size={14} className="text-destructive" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Reembolsos
        </p>
      </div>
      <p className="text-xl font-bold tabular-nums tracking-tight text-foreground">
        {refundCount}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatCurrencyAdmin(refundAmount)}
      </p>
    </div>
  );
}

interface IAdminKycDetailsBalanceTabProps {
  seller: IKycSubmissionView;
}

export function AdminKycDetailsBalanceTab({
  seller,
}: IAdminKycDetailsBalanceTabProps) {
  const apiService = useApiService();
  const {
    data: balanceData,
    isLoading: balanceLoading,
    invalidateQuery: invalidateBalanceQuery,
  } = useAdminSellerBalancerQuery(seller.user_id);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [adjustments, setAdjustments] = useState<IAdminBalanceAdjustmentDto[]>(
    [],
  );

  const loadAdjustments = useCallback(async () => {
    try {
      const rows = await apiService.modules.adminSellers.listBalanceAdjustments(
        Number(seller.user_id),
      );
      setAdjustments(rows);
    } catch {
      setAdjustments([]);
    }
  }, [apiService, seller.user_id]);

  useEffect(() => {
    void loadAdjustments();
  }, [loadAdjustments]);

  const handleCreditSuccess = async () => {
    await invalidateBalanceQuery();
    await loadAdjustments();
  };

  return (
    <div className="animate-fade-in">
      {balanceLoading || !balanceData ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : (
        <div className="space-y-4">
          <AvailableBalanceCard
            available={balanceData.available}
            onAddCredit={() => setShowCreditModal(true)}
          />

          <div className="grid grid-cols-2 gap-3">
            <RetainedBalanceCard retained={balanceData.retained} />
            <WithdrawnAmountBalanceCard
              withdrawn={balanceData.withdrawnAmount}
            />
            <TotalSalesCard
              totalSalesCount={balanceData.totalSalesCount}
              totalSalesAmount={balanceData.totalSalesAmount}
            />
            <GrossSalesAmountCard
              grossSalesAmount={balanceData.grossSalesAmount}
            />
            <EarnedFeesAmountCard
              earnedFeesAmount={balanceData.earnedFeesAmount}
            />
            <RefundsAmountCard
              refundCount={balanceData.refundCount}
              refundAmount={balanceData.refundAmount}
            />
          </div>

          <div className="admin-surface p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Histórico de créditos administrativos
            </p>
            {adjustments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum crédito administrativo registrado.
              </p>
            ) : (
              <ul className="space-y-2">
                {adjustments.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border/30 pb-2 text-sm last:border-0"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {formatCurrencyAdmin(item.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.reason}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {showCreditModal && balanceData ? (
        <AddBalanceCreditModal
          sellerId={Number(seller.user_id)}
          availableCents={balanceData.available}
          onClose={() => setShowCreditModal(false)}
          onSuccess={handleCreditSuccess}
        />
      ) : null}
    </div>
  );
}
