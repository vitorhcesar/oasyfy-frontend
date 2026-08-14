import ModalPortal from "@/presentation/components/ModalPortal";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function parseBrlToCents(str: string) {
  const raw = str.replace(/\D/g, "");
  return parseInt(raw || "0", 10);
}

function formatCentsToInput(cents: number) {
  const num = (cents / 100).toFixed(2);
  const [int, dec] = num.split(".");
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + dec;
}

interface IAddBalanceCreditModalProps {
  sellerId: number;
  availableCents: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddBalanceCreditModal({
  sellerId,
  availableCents,
  onClose,
  onSuccess,
}: IAddBalanceCreditModalProps) {
  const apiService = useApiService();
  const [amountInput, setAmountInput] = useState("");
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  const amountCents = useMemo(() => parseBrlToCents(amountInput), [amountInput]);
  const balanceAfter = availableCents + amountCents;
  const reasonOk = reason.trim().length <= 500;
  const amountOk = amountCents > 0;
  const canSubmit = amountOk && reasonOk && !saving;

  const handleAmountChange = (value: string) => {
    const cents = parseBrlToCents(value);
    setAmountInput(cents > 0 ? formatCentsToInput(cents) : value.replace(/\D/g, "") ? formatCentsToInput(cents) : "");
  };

  const handleConfirm = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${sellerId}-${Date.now()}`;
      await apiService.modules.adminSellers.addBalanceCredit(sellerId, {
        amount: amountCents,
        reason: reason.trim(),
        idempotencyKey,
      });
      toast.success("Crédito adicionado");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        getErrorMessageOrDefault(error, "Erro ao adicionar crédito"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
        onClick={onClose}
      >
        <div
          className="liquid-glass-control w-full max-w-md rounded-[22px] p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="mb-1 text-base font-semibold text-foreground">
            Adicionar saldo
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Crédito administrativo positivo. Informe o valor. O motivo é opcional.
          </p>

          <label className="mb-1 block text-xs font-semibold text-muted-foreground">
            Valor (BRL)
          </label>
          <div className="mb-3 flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">R$</span>
            <input
              type="text"
              inputMode="decimal"
              value={amountInput}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0,00"
              className="h-10 w-full rounded-xl border border-border/60 bg-card px-3.5 text-sm text-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="mb-3 rounded-xl border border-border/40 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <p>Saldo atual: {formatCurrency(availableCents)}</p>
            <p>
              Após o crédito:{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(balanceAfter)}
              </span>
            </p>
          </div>

          <label className="mb-1 block text-xs font-semibold text-muted-foreground">
            Motivo (opcional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Descreva o motivo do crédito..."
            className="mb-4 h-24 w-full resize-none rounded-xl border border-border/60 bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />

          {!confirming ? (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-xl bg-muted px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!amountOk || !reasonOk}
                onClick={() => setConfirming(true)}
                className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Continuar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-foreground">
                Confirmar crédito de {formatCurrency(amountCents)}?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setConfirming(false)}
                  className="h-10 rounded-xl bg-muted px-4 text-sm font-semibold text-muted-foreground"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={!canSubmit}
                  onClick={handleConfirm}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                  Confirmar crédito
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
