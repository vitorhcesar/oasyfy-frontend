import { IGetFullSellerFeeResponseDto } from "@/infra/http/services/api/modules/seller-fee.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import useFullSellerFeeQuery from "@/presentation/hooks/use-full-seller-fee-query";
import { cn } from "@/presentation/utils/cn";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import { ChevronDown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface IFeeInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}

function FeeInput({ label, value, onChange, step = 0.01 }: IFeeInputProps) {
  const [raw, setRaw] = useState(value ? String(value) : "");

  useEffect(() => {
    setRaw(value ? String(value) : "");
  }, [value]);

  return (
    <div>
      <label className="text-xs text-muted-foreground/60 uppercase tracking-wider">
        {label}
      </label>
      <input
        type="number"
        step={step}
        min={0}
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value);
          onChange(Number(e.target.value) || 0);
        }}
        placeholder="0"
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
      />
    </div>
  );
}

type TFeePrefix = "pix" | "card" | "boleto" | "crypto" | "withdrawal";

interface IFeeSectionProps {
  title: string;
  prefix: TFeePrefix;
  hasRetention: boolean;
  isWithdrawal?: boolean;
  fees: IGetFullSellerFeeResponseDto;
  setFees: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onSave: () => void;
  saving: boolean;
}

function FeeSection({
  title,
  prefix,
  hasRetention,
  isWithdrawal,
  fees,
  setFees,
  onSave,
  saving,
}: IFeeSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border/40 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
      >
        <span className="text-xs font-semibold text-foreground">{title}</span>
        <ChevronDown
          size={14}
          className={cn(
            "text-muted-foreground",
            "transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border/30 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <FeeInput
              label="Taxa fixa (R$)"
              value={fees[`${prefix}FixedFee`] ?? 0}
              onChange={(v) =>
                setFees((f) => ({ ...f, [`${prefix}FixedFee`]: v }))
              }
            />
            <FeeInput
              label="Taxa variável (%)"
              value={fees[`${prefix}VariableFee`] ?? 0}
              onChange={(v) =>
                setFees((f) => ({ ...f, [`${prefix}VariableFee`]: v }))
              }
            />
            <FeeInput
              label="Taxa mínima (R$)"
              value={fees[`${prefix}MinFee`] ?? 0}
              onChange={(v) =>
                setFees((f) => ({ ...f, [`${prefix}MinFee`]: v }))
              }
            />
            {hasRetention && prefix !== "withdrawal" && (
              <>
                <FeeInput
                  label="Retenção (%)"
                  value={fees[`${prefix}RetentionFee`] ?? 0}
                  onChange={(v) =>
                    setFees((f) => ({ ...f, [`${prefix}RetentionFee`]: v }))
                  }
                />
                <FeeInput
                  label="Dias retenção"
                  value={fees[`${prefix}RetentionDays`] ?? 0}
                  onChange={(v) =>
                    setFees((f) => ({ ...f, [`${prefix}RetentionDays`]: v }))
                  }
                  step={1}
                />
              </>
            )}
          </div>
          {isWithdrawal && (
            <>
              <div className="border-t border-border/30 pt-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Limites de saque
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <FeeInput
                    label="Mínimo por saque (R$)"
                    value={fees.withdrawalMinAmount ?? 0}
                    onChange={(v) =>
                      setFees((f) => ({ ...f, withdrawalMinAmount: v }))
                    }
                    step={1}
                  />
                  <FeeInput
                    label="Máximo por saque (R$)"
                    value={fees.withdrawalMaxAmount ?? 0}
                    onChange={(v) =>
                      setFees((f) => ({ ...f, withdrawalMaxAmount: v }))
                    }
                    step={1}
                  />
                  <FeeInput
                    label="Limite diário (R$)"
                    value={fees.withdrawalDailyMax ?? 0}
                    onChange={(v) =>
                      setFees((f) => ({ ...f, withdrawalDailyMax: v }))
                    }
                    step={1}
                  />
                </div>
              </div>
            </>
          )}
          <button
            onClick={onSave}
            disabled={saving}
            className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            Salvar {title.toLowerCase()}
          </button>
        </div>
      )}
    </div>
  );
}

export function AdminKycDetailsFeesTab() {
  const apiService = useApiService();

  const {
    data: sellerFee,
    isLoading: isLoadingSellerFee,
    invalidateQuery: invalidateSellerFeeQuery,
  } = useFullSellerFeeQuery();

  const [fees, setFees] = useState<Record<string, number>>({});
  const [feeId, setFeeId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  const handleSaveFees = async () => {
    setSaving(true);

    await tryOrToastError(
      async () => {
        if (feeId) {
          await apiService.modules.sellerFee.updateSellerFee({
            id: feeId,
            ...fees,
          });
        } else {
          await apiService.modules.sellerFee.createSellerFee({
            ...fees,
          });
        }

        await invalidateSellerFeeQuery();

        toast.success("Taxas salvas!");
      },
      {
        defaultErrorMessage: "Erro ao salvar taxas",
        finallyFn: () => {
          setSaving(false);
        },
      },
    );
  };

  return (
    <div className="animate-fade-in">
      {isLoadingSellerFee || !sellerFee ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : (
        <div className="space-y-3">
          {(
            [
              { title: "Pix", prefix: "pix", hasRetention: true },
              {
                title: "Cartão de Crédito",
                prefix: "card",
                hasRetention: true,
              },
              { title: "Boleto", prefix: "boleto", hasRetention: true },
              { title: "Cripto", prefix: "crypto", hasRetention: true },
              {
                title: "Saque",
                prefix: "withdrawal",
                hasRetention: false,
                isWithdrawal: true,
              },
            ] as const
          ).map((item) => (
            <FeeSection
              key={item.prefix}
              title={item.title}
              prefix={item.prefix}
              hasRetention={item.hasRetention}
              isWithdrawal={"isWithdrawal" in item}
              fees={sellerFee}
              setFees={setFees}
              onSave={handleSaveFees}
              saving={saving}
            />
          ))}
        </div>
      )}
    </div>
  );
}
