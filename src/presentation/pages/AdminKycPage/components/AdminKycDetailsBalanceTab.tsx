import { useApiService } from "@/presentation/hooks/use-api-service";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  DollarSign,
  Loader2,
  Lock,
  Pencil,
  RotateCcw,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useAdminSellerBalancerQuery from "../hooks/use-admin-seller-balancer-query";
import { IKycSubmissionView } from "../types/kyc-submission-view.type";

function formatCurrencyAdmin(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

interface IBalanceEditorProps {
  available: number;
  sellerId: string;
  onUpdated: () => void;
  invalidateBalanceQuery: () => Promise<void>;
}

function BalanceEditor({
  available,
  sellerId,
  onUpdated,
  invalidateBalanceQuery,
}: IBalanceEditorProps) {
  const apiService = useApiService();

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const formatToInput = (cents: number) => {
    const num = (cents / 100).toFixed(2);
    const [int, dec] = num.split(".");
    return int.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + dec;
  };

  const parseFromInput = (str: string) => {
    const raw = str.replace(/\D/g, "");
    return parseInt(raw || "0", 10);
  };

  const handleEdit = () => {
    setValue(formatToInput(available));
    setEditing(true);
  };

  const handleSave = async () => {
    const newCents = parseFromInput(value);
    if (newCents < 0) {
      toast.error("Valor inválido");
      return;
    }

    const diff = newCents - available;
    if (diff === 0) {
      setEditing(false);
      return;
    }

    setSaving(true);

    await tryOrToastError(
      async () => {
        // Insert an adjustment transaction
        await apiService.modules.transaction.insertAdjustmentTransaction({
          sellerId: Number(sellerId),
          amount: diff,
        });

        await invalidateBalanceQuery();

        toast.success("Saldo ajustado!");
        onUpdated();
      },
      {
        defaultErrorMessage: "Erro ao ajustar saldo",
        finallyFn: () => {
          setSaving(false);
          setEditing(false);
        },
      },
    );
  };

  return (
    <div className="admin-surface admin-surface-featured p-5 md:p-6">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Disponível para saque
        </p>
        {!editing && (
          <button
            onClick={handleEdit}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            title="Editar saldo"
          >
            <Pencil size={14} />
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">R$</span>
          <input
            type="text"
            inputMode="numeric"
            value={value}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              const num = (parseInt(raw || "0", 10) / 100).toFixed(2);
              const [int, dec] = num.split(".");
              const formatted =
                int.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + dec;
              setValue(formatted);
            }}
            autoFocus
            className="flex-1 text-2xl font-bold bg-transparent border-b-2 border-primary/30 focus:border-primary outline-none text-foreground tabular-nums py-0.5"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <p className="text-2xl font-bold text-foreground tabular-nums">
          {formatCurrencyAdmin(available)}
        </p>
      )}
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
  const {
    data: balanceData,
    isLoading: balanceLoading,
    invalidateQuery: invalidateBalanceQuery,
  } = useAdminSellerBalancerQuery(seller.user_id);

  const handleUpdateBalanceEditor = async () => {
    await invalidateBalanceQuery();
  };

  return (
    <div className="animate-fade-in">
      {balanceLoading || !balanceData ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : (
        <div className="space-y-4">
          <BalanceEditor
            available={balanceData.available}
            sellerId={seller.user_id}
            onUpdated={handleUpdateBalanceEditor}
            invalidateBalanceQuery={invalidateBalanceQuery}
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
        </div>
      )}
    </div>
  );
}
