import type { IGetFullSellerFeeResponseDto } from "@/infra/http/services/api/modules/seller-fee.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import useFullSellerFeeQuery from "@/presentation/hooks/use-full-seller-fee-query";
import useSellerFeeTemplatesQuery from "@/presentation/hooks/use-seller-fee-templates-query";
import { cn } from "@/presentation/utils/cn";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import { ChevronDown, Layers, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface IAdminKycDetailsFeesTabProps {
  sellerId: number;
}

type TFeePrefix = "pix" | "card" | "boleto" | "crypto" | "withdrawal";

interface IReadonlyFeeSectionProps {
  title: string;
  prefix: TFeePrefix;
  fees: IGetFullSellerFeeResponseDto;
}

function FeeValue({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return (
    <div>
      <p className="mb-0.5 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-base font-semibold tabular-nums text-foreground">
        {value.toFixed(2)}{suffix}
      </p>
    </div>
  );
}

function ReadonlyFeeSection({ title, prefix, fees }: IReadonlyFeeSectionProps) {
  const [open, setOpen] = useState(false);
  const isWithdrawal = prefix === "withdrawal";

  return (
    <div className="admin-surface overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3.5 transition-colors hover:bg-muted/25"
      >
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <ChevronDown
          size={15}
          className={cn(
            "text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <FeeValue label="Taxa fixa (R$)" value={fees[`${prefix}FixedFee`] ?? 0} />
            <FeeValue label="Taxa variável (%)" value={fees[`${prefix}VariableFee`] ?? 0} suffix="%" />
            <FeeValue label="Taxa mínima (R$)" value={fees[`${prefix}MinFee`] ?? 0} />
            {!isWithdrawal && (
              <>
                <FeeValue label="Retenção (%)" value={fees[`${prefix}RetentionFee`] ?? 0} suffix="%" />
                <FeeValue label="Dias retenção" value={fees[`${prefix}RetentionDays`] ?? 0} />
              </>
            )}
            {isWithdrawal && (
              <>
                <FeeValue label="Mín. por saque (R$)" value={fees.withdrawalMinAmount ?? 0} />
                <FeeValue label="Máx. por saque (R$)" value={fees.withdrawalMaxAmount ?? 0} />
                <FeeValue label="Limite diário (R$)" value={fees.withdrawalDailyMax ?? 0} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminKycDetailsFeesTab({ sellerId }: IAdminKycDetailsFeesTabProps) {
  const apiService = useApiService();

  const {
    data: currentFee,
    isLoading: isLoadingCurrentFee,
    invalidateQuery: invalidateCurrentFee,
  } = useFullSellerFeeQuery(sellerId);

  const { data: templates, isLoading: isLoadingTemplates } = useSellerFeeTemplatesQuery();

  const [selectedFeeId, setSelectedFeeId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const effectiveFeeId = selectedFeeId ?? currentFee?.id ?? null;
  const hasChanged = selectedFeeId !== null && selectedFeeId !== currentFee?.id;

  const handleAssign = async () => {
    if (!selectedFeeId) return;
    setSaving(true);
    await tryOrToastError(
      async () => {
        await apiService.modules.sellerFee.assignSellerFee(sellerId, selectedFeeId);
        await invalidateCurrentFee();
        setSelectedFeeId(null);
        toast.success("Plano de taxa atribuído com sucesso!");
      },
      {
        defaultErrorMessage: "Erro ao atribuir plano de taxa",
        finallyFn: () => setSaving(false),
      },
    );
  };

  if (isLoadingCurrentFee || isLoadingTemplates) {
    return (
      <div className="py-16 flex justify-center">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="admin-surface space-y-4 p-5 md:p-6">
        <div className="mb-1 flex items-center gap-2">
          <Layers size={16} className="text-primary" />
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Plano de taxa
          </p>
        </div>

        {currentFee && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Plano atual:</span>
            <span className="font-semibold text-foreground">{currentFee.name}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Selecionar novo plano
          </label>
          <select
            value={effectiveFeeId ?? ""}
            onChange={(e) => {
              const val = Number(e.target.value);
              setSelectedFeeId(val === currentFee?.id ? null : val);
            }}
            className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — Pix {t.pixVariableFee}% · Saque {t.withdrawalVariableFee}%
              </option>
            ))}
          </select>
        </div>

        {hasChanged && (
          <button
            onClick={handleAssign}
            disabled={saving}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-[#111827] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Atribuir plano
          </button>
        )}
      </div>

      {currentFee && (
        <div className="space-y-2">
          <p className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Valores do plano atual
          </p>
          {(
            [
              { title: "Pix", prefix: "pix" },
              { title: "Cartão de Crédito", prefix: "card" },
              { title: "Boleto", prefix: "boleto" },
              { title: "Cripto", prefix: "crypto" },
              { title: "Saque", prefix: "withdrawal" },
            ] as const
          ).map((item) => (
            <ReadonlyFeeSection
              key={item.prefix}
              title={item.title}
              prefix={item.prefix}
              fees={currentFee}
            />
          ))}
        </div>
      )}
    </div>
  );
}
