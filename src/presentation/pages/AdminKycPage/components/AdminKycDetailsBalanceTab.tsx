import { supabase } from "@/infra/integrations/supabase/client";
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
}

function BalanceEditor({
  available,
  sellerId,
  onUpdated,
}: IBalanceEditorProps) {
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

    // Insert an adjustment transaction
    const { error } = await supabase.from("transactions").insert({
      seller_id: sellerId,
      amount: diff,
      method: diff > 0 ? "pix" : "withdrawal",
      status: "completed",
      customer_name: "Ajuste administrativo",
      description:
        diff > 0 ? "Crédito manual pelo admin" : "Débito manual pelo admin",
    } as any);

    if (error) {
      toast.error("Erro ao ajustar saldo");
    } else {
      toast.success("Saldo ajustado!");
      onUpdated();
    }

    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Disponível para saque
        </p>
        {!editing && (
          <button
            onClick={handleEdit}
            className="p-1 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
            title="Editar saldo"
          >
            <Pencil size={13} />
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
    <div className="rounded-xl border border-border/40 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Lock size={13} className="text-amber-500" />
        </div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Saldo retido
        </p>
      </div>
      <p className="text-lg font-semibold text-foreground tabular-nums">
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
    <div className="rounded-xl border border-border/40 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center">
          <ArrowUpRight size={13} className="text-muted-foreground" />
        </div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Total sacado (aprovado)
        </p>
      </div>
      <p className="text-lg font-semibold text-foreground tabular-nums">
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
    <div className="rounded-xl border border-border/40 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <ArrowDownLeft size={13} className="text-primary" />
        </div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Vendas realizadas
        </p>
      </div>
      <p className="text-lg font-semibold text-foreground tabular-nums">
        {totalSalesCount}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">
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
    <div className="rounded-xl border border-border/40 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
          <DollarSign size={13} className="text-foreground" />
        </div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Volume bruto vendido
        </p>
      </div>
      <p className="text-lg font-semibold text-foreground tabular-nums">
        {formatCurrencyAdmin(grossSalesAmount)}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">
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
    <div className="rounded-xl border border-border/40 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center">
          <DollarSign size={13} className="text-warning" />
        </div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Taxas geradas
        </p>
      </div>
      <p className="text-lg font-semibold text-foreground tabular-nums">
        {formatCurrencyAdmin(earnedFeesAmount)}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">
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
    <div className="rounded-xl border border-border/40 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center">
          <RotateCcw size={13} className="text-destructive" />
        </div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Reembolsos
        </p>
      </div>
      <p className="text-lg font-semibold text-foreground tabular-nums">
        {refundCount}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">
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
