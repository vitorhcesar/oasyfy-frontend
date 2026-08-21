import { Button } from "@/presentation/components/ui/button";
import { Switch } from "@/presentation/components/ui/switch";
import useAdminFinancialSettingsQuery from "@/presentation/hooks/use-admin-financial-settings-query";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";
import { Loader2, Save, Swords, Tag, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function parseAmount(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.trunc(parsed));
}

export function FinancialTab() {
  const apiService = useApiService();
  const { data, isLoading, invalidateQuery } = useAdminFinancialSettingsQuery();
  const [autoWithdrawalEnabled, setAutoWithdrawalEnabled] = useState(false);
  const [pixMinAmount, setPixMinAmount] = useState(0);
  const [pixMaxAmount, setPixMaxAmount] = useState(0);
  const [minigameFeePercent, setMinigameFeePercent] = useState(0);
  const [minigameFeeFixedReais, setMinigameFeeFixedReais] = useState(0);
  const [savingToggle, setSavingToggle] = useState(false);
  const [savingLimits, setSavingLimits] = useState(false);
  const [savingMinigameFee, setSavingMinigameFee] = useState(false);

  useEffect(() => {
    if (!data) return;
    setAutoWithdrawalEnabled(data.autoWithdrawalEnabled);
    setPixMinAmount(data.pixMinAmount ?? 0);
    setPixMaxAmount(data.pixMaxAmount ?? 0);
    setMinigameFeePercent(data.minigameFeePercent ?? 0);
    setMinigameFeeFixedReais(data.minigameFeeFixedReais ?? 0);
  }, [data]);

  const persist = async (payload: {
    autoWithdrawalEnabled: boolean;
    pixMinAmount: number;
    pixMaxAmount: number;
    minigameFeePercent: number;
    minigameFeeFixedReais: number;
  }) => {
    const saved = await apiService.modules.adminConfig.updateFinancialSettings(
      payload,
    );
    setAutoWithdrawalEnabled(saved.autoWithdrawalEnabled);
    setPixMinAmount(saved.pixMinAmount);
    setPixMaxAmount(saved.pixMaxAmount);
    setMinigameFeePercent(saved.minigameFeePercent ?? 0);
    setMinigameFeeFixedReais(saved.minigameFeeFixedReais ?? 0);
    await invalidateQuery();
    return saved;
  };

  const handleToggle = async (enabled: boolean) => {
    const previous = autoWithdrawalEnabled;
    setAutoWithdrawalEnabled(enabled);
    setSavingToggle(true);
    try {
      const saved = await persist({
        autoWithdrawalEnabled: enabled,
        pixMinAmount: data?.pixMinAmount ?? 0,
        pixMaxAmount: data?.pixMaxAmount ?? 0,
        minigameFeePercent: data?.minigameFeePercent ?? 0,
        minigameFeeFixedReais: data?.minigameFeeFixedReais ?? 0,
      });
      toast.success(
        saved.autoWithdrawalEnabled
          ? "Saque automático habilitado"
          : "Saque automático desabilitado",
      );
    } catch (err) {
      setAutoWithdrawalEnabled(previous);
      toast.error(getErrorMessageOrDefault(err, "Erro ao salvar"));
    }
    setSavingToggle(false);
  };

  const handleSaveLimits = async () => {
    if (pixMinAmount > 0 && pixMaxAmount > 0 && pixMinAmount > pixMaxAmount) {
      toast.error("O valor mínimo do PIX não pode ser maior que o máximo.");
      return;
    }

    setSavingLimits(true);
    try {
      await persist({
        autoWithdrawalEnabled,
        pixMinAmount,
        pixMaxAmount,
        minigameFeePercent,
        minigameFeeFixedReais,
      });
      toast.success("Limites de preço salvos");
    } catch (err) {
      toast.error(getErrorMessageOrDefault(err, "Erro ao salvar"));
    }
    setSavingLimits(false);
  };

  const handleSaveMinigameFee = async () => {
    setSavingMinigameFee(true);
    try {
      await persist({
        autoWithdrawalEnabled,
        pixMinAmount,
        pixMaxAmount,
        minigameFeePercent,
        minigameFeeFixedReais,
      });
      toast.success("Taxa de minigames salva");
    } catch (err) {
      toast.error(getErrorMessageOrDefault(err, "Erro ao salvar"));
    }
    setSavingMinigameFee(false);
  };

  function previewFee(potCents: number) {
    const fee = Math.min(
      potCents,
      Math.max(
        0,
        Math.round((potCents * minigameFeePercent) / 100 + minigameFeeFixedReais * 100),
      ),
    );
    return { fee, winner: potCents - fee };
  }

  const minPreview = previewFee(4000);
  const maxPreview = previewFee(1_000_000);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Defina como os saques e a geração de PIX são processados na plataforma.
      </p>

      <div className="admin-surface flex items-start justify-between gap-4 p-4 md:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Wallet size={18} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Saque automático
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {autoWithdrawalEnabled
                ? "Os saques são enviados ao adquirente na hora, sem confirmação na tela de Saques."
                : "Cada saque fica pendente até um administrador aprovar ou negar na tela de Saques."}
            </p>
          </div>
        </div>
        <Switch
          checked={autoWithdrawalEnabled}
          onCheckedChange={handleToggle}
          disabled={savingToggle}
          aria-label="Habilitar saque automático"
        />
      </div>

      <div className="admin-surface space-y-5 p-4 md:p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Tag size={18} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Configurações de limites de preço
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Limites de valor para geração de PIX em vendas via API, depósitos
              e checkouts. Use 0 para não limitar.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="pix-min-amount"
              className="text-sm font-medium text-foreground"
            >
              Valor mínimo para geração PIX
            </label>
            <div className="relative">
              <input
                id="pix-min-amount"
                type="number"
                min={0}
                step={1}
                value={pixMinAmount}
                onChange={(e) => setPixMinAmount(parseAmount(e.target.value))}
                className="h-10 w-full rounded-xl border border-border/50 bg-background px-3 pr-10 text-sm font-medium text-foreground transition-all placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                R$
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Valor mínimo que pode ser cobrado ao gerar um PIX.
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="pix-max-amount"
              className="text-sm font-medium text-foreground"
            >
              Valor máximo para geração PIX
            </label>
            <div className="relative">
              <input
                id="pix-max-amount"
                type="number"
                min={0}
                step={1}
                value={pixMaxAmount}
                onChange={(e) => setPixMaxAmount(parseAmount(e.target.value))}
                className="h-10 w-full rounded-xl border border-border/50 bg-background px-3 pr-10 text-sm font-medium text-foreground transition-all placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                R$
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Valor máximo que pode ser cobrado ao gerar um PIX.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => void handleSaveLimits()}
            disabled={savingLimits}
            className="gap-2"
          >
            {savingLimits ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {savingLimits ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="admin-surface space-y-5 p-4 md:p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Swords size={18} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Taxa de minigames na Praça
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Incide sobre o pote (soma das duas apostas). Os dois campos podem
              ser zero.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="minigame-fee-percent"
              className="text-sm font-medium text-foreground"
            >
              Percentual (%)
            </label>
            <input
              id="minigame-fee-percent"
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={minigameFeePercent}
              onChange={(e) =>
                setMinigameFeePercent(Math.max(0, Number(e.target.value) || 0))
              }
              className="h-10 w-full rounded-xl border border-border/50 bg-background px-3 text-sm font-medium text-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="minigame-fee-fixed"
              className="text-sm font-medium text-foreground"
            >
              Valor fixo (R$)
            </label>
            <input
              id="minigame-fee-fixed"
              type="number"
              min={0}
              step={0.01}
              value={minigameFeeFixedReais}
              onChange={(e) =>
                setMinigameFeeFixedReais(Math.max(0, Number(e.target.value) || 0))
              }
              className="h-10 w-full rounded-xl border border-border/50 bg-background px-3 text-sm font-medium text-foreground"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Pote mínimo R$ 40: taxa R$ {(minPreview.fee / 100).toFixed(2)},
          ganhador R$ {(minPreview.winner / 100).toFixed(2)}. Pote máximo R$
          10.000: taxa R$ {(maxPreview.fee / 100).toFixed(2)}, ganhador R${" "}
          {(maxPreview.winner / 100).toFixed(2)}.
        </p>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => void handleSaveMinigameFee()}
            disabled={savingMinigameFee}
            className="gap-2"
          >
            {savingMinigameFee ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {savingMinigameFee ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
