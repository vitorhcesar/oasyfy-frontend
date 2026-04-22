import { supabase } from "@/infrastructure/integrations/supabase/client";
import { AdminLayout } from "@/presentation/components/admin/AdminLayout";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/presentation/components/ui/tabs";
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
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        {Icon && <Icon size={12} className="text-muted-foreground/60" />}
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          step={step}
          min={min}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full px-3 py-2.5 rounded-lg border border-border/50 bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
          placeholder="0"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground/50">
            {suffix}
          </span>
        )}
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
    <div className="space-y-6">
      {/* Fee section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-0.5 rounded-full bg-primary" />
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Taxas de transação
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Retention section */}
      {hasRetention && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-0.5 rounded-full bg-warning" />
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Retenção
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* Withdrawal limits */}
      {isWithdrawal && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-0.5 rounded-full bg-destructive" />
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Limites de saque
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
  const [fees, setFees] = useState<Omit<GlobalFees, "id">>(defaultFees);
  const [feeId, setFeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("global_fees")
      .select("*")
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const row = data[0] as any;
          setFeeId(row.id);
          const { id, created_at, updated_at, ...rest } = row;
          setFees(rest);
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    if (feeId) {
      const { error } = await supabase
        .from("global_fees")
        .update(fees as any)
        .eq("id", feeId);
      if (error) toast.error("Erro ao salvar taxas");
      else toast.success("Taxas globais salvas com sucesso!");
    }
    setSaving(false);
  };

  return (
    <AdminLayout>
      <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Taxas globais
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Taxas padrão aplicadas quando o seller não possui taxas
              personalizadas.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 shadow-sm shrink-0"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Salvar alterações
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden">
            <Tabs defaultValue="pix" className="w-full">
              <div className="border-b border-border/30 bg-muted/20 px-4 pt-3">
                <TabsList className="bg-transparent p-0 h-auto gap-0 w-full justify-start">
                  {tabConfig.map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-t-lg text-xs font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-card data-[state=active]:border data-[state=active]:border-b-0 data-[state=active]:border-border/40 data-[state=active]:shadow-sm border border-transparent -mb-px transition-all"
                    >
                      <tab.icon size={13} />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              <div className="p-5 md:p-6">
                {tabConfig.map((tab) => (
                  <TabsContent
                    key={tab.value}
                    value={tab.value}
                    className="m-0"
                  >
                    <FeeTabContent
                      prefix={tab.value}
                      hasRetention={tab.hasRetention}
                      isWithdrawal={tab.isWithdrawal}
                      fees={fees}
                      setFees={setFees}
                    />
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
