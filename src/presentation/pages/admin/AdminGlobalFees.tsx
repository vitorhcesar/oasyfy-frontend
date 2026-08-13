import useAdminGlobalFeesQuery from "@/presentation/hooks/use-admin-global-fees-query";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import { cn } from "@/presentation/utils/cn";
import {
  Bitcoin,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Loader2,
  Percent,
  QrCode,
  Save,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface GlobalFees {
  id: string;
  pix_variable_fee: number;
  pix_fixed_fee: number;
  pix_min_fee: number;
  pix_retention_days: number;
  pix_retention_fee: number;
  card_variable_fee: number;
  card_fixed_fee: number;
  card_min_fee: number;
  card_retention_days: number;
  card_retention_fee: number;
  boleto_variable_fee: number;
  boleto_fixed_fee: number;
  boleto_min_fee: number;
  boleto_retention_days: number;
  boleto_retention_fee: number;
  crypto_variable_fee: number;
  crypto_fixed_fee: number;
  crypto_min_fee: number;
  crypto_retention_days: number;
  crypto_retention_fee: number;
  withdrawal_variable_fee: number;
  withdrawal_fixed_fee: number;
  withdrawal_min_fee: number;
  withdrawal_min_amount: number;
  withdrawal_max_amount: number;
  withdrawal_daily_max: number;
}

const defaultFees: Omit<GlobalFees, "id"> = {
  pix_variable_fee: 0,
  pix_fixed_fee: 0,
  pix_min_fee: 0,
  pix_retention_days: 0,
  pix_retention_fee: 0,
  card_variable_fee: 0,
  card_fixed_fee: 0,
  card_min_fee: 0,
  card_retention_days: 0,
  card_retention_fee: 0,
  boleto_variable_fee: 0,
  boleto_fixed_fee: 0,
  boleto_min_fee: 0,
  boleto_retention_days: 0,
  boleto_retention_fee: 0,
  crypto_variable_fee: 0,
  crypto_fixed_fee: 0,
  crypto_min_fee: 0,
  crypto_retention_days: 0,
  crypto_retention_fee: 0,
  withdrawal_variable_fee: 0,
  withdrawal_fixed_fee: 0,
  withdrawal_min_fee: 0,
  withdrawal_min_amount: 0,
  withdrawal_max_amount: 0,
  withdrawal_daily_max: 0,
};

type FeePrefix = "pix" | "card" | "boleto" | "crypto" | "withdrawal";

function InputField({
  label,
  icon: Icon,
  suffix,
  value,
  onChange,
  step = "0.01",
  min = "0",
}: {
  label: string;
  icon?: React.ElementType;
  suffix?: string;
  value: number;
  onChange: (v: number) => void;
  step?: string;
  min?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        {Icon && <Icon size={14} className="text-muted-foreground/70" />}
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          step={step}
          min={min}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-10 w-full rounded-xl border border-border/50 bg-background px-3 text-sm font-medium text-foreground transition-all placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="0"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  description,
  icon: Icon,
  accent = "primary",
}: {
  title: string;
  description?: string;
  icon: React.ElementType;
  accent?: "primary" | "warning" | "destructive";
}) {
  const accentClass =
    accent === "warning"
      ? "bg-warning/10 text-warning"
      : accent === "destructive"
        ? "bg-destructive/10 text-destructive"
        : "bg-primary/10 text-primary";

  return (
    <div className="flex items-start gap-3 border-b border-border/50 pb-4">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          accentClass,
        )}
      >
        <Icon size={16} />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

function FeeTabContent({
  prefix,
  hasRetention,
  isWithdrawal,
  fees,
  setFees,
}: {
  prefix: FeePrefix;
  hasRetention: boolean;
  isWithdrawal?: boolean;
  fees: Omit<GlobalFees, "id">;
  setFees: (f: Omit<GlobalFees, "id">) => void;
}) {
  const getField = (suffix: string) => {
    const key = `${prefix}_${suffix}` as keyof typeof fees;
    return fees[key] as number;
  };

  const setField = (suffix: string, val: number) => {
    const key = `${prefix}_${suffix}` as keyof typeof fees;
    setFees({ ...fees, [key]: val });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <SectionHeader
          title="Taxas de transação"
          description="Valores cobrados em cada operação deste método."
          icon={Percent}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <InputField
            label="Taxa variável"
            icon={Percent}
            suffix="%"
            value={getField("variable_fee")}
            onChange={(v) => setField("variable_fee", v)}
          />
          <InputField
            label="Taxa fixa"
            icon={DollarSign}
            suffix="R$"
            value={getField("fixed_fee")}
            onChange={(v) => setField("fixed_fee", v)}
          />
          <InputField
            label="Taxa mínima"
            icon={ShieldCheck}
            suffix="R$"
            value={getField("min_fee")}
            onChange={(v) => setField("min_fee", v)}
          />
        </div>
      </div>

      {hasRetention && (
        <div className="space-y-5">
          <SectionHeader
            title="Retenção"
            description="Período e percentual retidos antes da liberação do saldo."
            icon={Clock}
            accent="warning"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputField
              label="Dias de retenção"
              icon={Clock}
              suffix="dias"
              value={getField("retention_days")}
              onChange={(v) => setField("retention_days", v)}
              step="1"
            />
            <InputField
              label="Taxa de retenção"
              icon={Percent}
              suffix="%"
              value={getField("retention_fee")}
              onChange={(v) => setField("retention_fee", v)}
            />
          </div>
        </div>
      )}

      {isWithdrawal && (
        <div className="space-y-5">
          <SectionHeader
            title="Limites de saque"
            description="Valores mínimo, máximo e teto diário por seller."
            icon={Wallet}
            accent="destructive"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <InputField
              label="Mínimo por saque"
              icon={DollarSign}
              suffix="R$"
              value={fees.withdrawal_min_amount}
              onChange={(v) => setFees({ ...fees, withdrawal_min_amount: v })}
            />
            <InputField
              label="Máximo por saque"
              icon={DollarSign}
              suffix="R$"
              value={fees.withdrawal_max_amount}
              onChange={(v) => setFees({ ...fees, withdrawal_max_amount: v })}
            />
            <InputField
              label="Limite diário"
              icon={DollarSign}
              suffix="R$"
              value={fees.withdrawal_daily_max}
              onChange={(v) => setFees({ ...fees, withdrawal_daily_max: v })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const tabConfig: {
  value: FeePrefix;
  label: string;
  icon: React.ElementType;
  hasRetention: boolean;
  isWithdrawal?: boolean;
}[] = [
  { value: "pix", label: "Pix", icon: QrCode, hasRetention: true },
  { value: "card", label: "Cartão", icon: CreditCard, hasRetention: true },
  { value: "boleto", label: "Boleto", icon: FileText, hasRetention: true },
  { value: "crypto", label: "Cripto", icon: Bitcoin, hasRetention: true },
  {
    value: "withdrawal",
    label: "Saque",
    icon: Wallet,
    hasRetention: false,
    isWithdrawal: true,
  },
];

export default function AdminGlobalFees() {
  const apiService = useApiService();
  const { data: feesData, isLoading, invalidateQuery } = useAdminGlobalFeesQuery();
  const [fees, setFees] = useState<Omit<GlobalFees, "id">>(defaultFees);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<FeePrefix>("pix");

  useEffect(() => {
    if (feesData) {
      const { id: _id, ...rest } = feesData;
      setFees(rest as Omit<GlobalFees, "id">);
    }
  }, [feesData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiService.modules.adminConfig.updateGlobalFees(
        fees as Record<string, number>,
      );
      toast.success("Taxas globais salvas com sucesso!");
      await invalidateQuery();
    } catch {
      toast.error("Erro ao salvar taxas");
    }
    setSaving(false);
  };

  const currentTab = tabConfig.find((tab) => tab.value === activeTab)!;

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-5xl px-5 py-6 md:px-8 md:py-9">
        <header className="mb-7 animate-fade-in">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Sistema
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-[2.15rem]">
                Taxas globais
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Taxas padrão aplicadas quando o seller não possui taxas
                personalizadas.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || isLoading}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#111827] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              Salvar alterações
            </button>
          </div>
        </header>

        <div className="liquid-glass-control mb-6 flex flex-wrap items-center gap-0.5 rounded-2xl p-1">
          {tabConfig.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all",
                activeTab === tab.value
                  ? "bg-white text-[#111827] shadow-sm"
                  : "text-muted-foreground hover:bg-white/10 hover:text-foreground",
              )}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-muted-foreground" size={24} />
          </div>
        ) : (
          <div className="animate-fade-in admin-surface p-5 md:p-6" key={activeTab}>
            <div className="mb-6 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <currentTab.icon size={16} className="text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {currentTab.label}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Configure taxas e regras para este método de pagamento.
                </p>
              </div>
            </div>

            <FeeTabContent
              prefix={currentTab.value}
              hasRetention={currentTab.hasRetention}
              isWithdrawal={currentTab.isWithdrawal}
              fees={fees}
              setFees={setFees}
            />

            <div className="mt-8 flex justify-end border-t border-border/40 pt-5">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#111827] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Save size={15} />
                )}
                Salvar alterações
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
