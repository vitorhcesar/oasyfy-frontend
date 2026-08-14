import { Button } from "@/presentation/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/presentation/components/ui/dialog";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Textarea } from "@/presentation/components/ui/textarea";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

export type TAdminBalanceAdjustmentMode = "credit" | "debit";

interface IAdminBalanceAdjustmentModalProps {
  sellerId: number;
  availableCents: number;
  mode: TAdminBalanceAdjustmentMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AdminBalanceAdjustmentModal({
  sellerId,
  availableCents,
  mode,
  open,
  onOpenChange,
  onSuccess,
}: IAdminBalanceAdjustmentModalProps) {
  const apiService = useApiService();
  const isDebit = mode === "debit";
  const [amountInput, setAmountInput] = useState("");
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setAmountInput("");
      setReason("");
      setConfirming(false);
      setSaving(false);
    }
  }, [open, mode]);

  const amountCents = useMemo(() => parseBrlToCents(amountInput), [amountInput]);
  const balanceAfter = isDebit
    ? availableCents - amountCents
    : availableCents + amountCents;
  const exceedsBalance = isDebit && amountCents > availableCents;
  const reasonOk = reason.trim().length <= 500;
  const amountOk = amountCents > 0 && !exceedsBalance;
  const canSubmit = amountOk && reasonOk && !saving;

  const handleAmountChange = (value: string) => {
    const cents = parseBrlToCents(value);
    setAmountInput(
      cents > 0
        ? formatCentsToInput(cents)
        : value.replace(/\D/g, "")
          ? formatCentsToInput(cents)
          : "",
    );
  };

  const handleConfirm = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${sellerId}-${mode}-${Date.now()}`;
      const body = {
        amount: amountCents,
        reason: reason.trim(),
        idempotencyKey,
      };
      if (isDebit) {
        await apiService.modules.adminSellers.addBalanceDebit(sellerId, body);
        toast.success("Saldo removido");
      } else {
        await apiService.modules.adminSellers.addBalanceCredit(sellerId, body);
        toast.success("Saldo adicionado");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        getErrorMessageOrDefault(
          error,
          isDebit ? "Erro ao remover saldo" : "Erro ao adicionar saldo",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (saving) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {isDebit ? "Remover saldo" : "Adicionar saldo"}
          </DialogTitle>
          <DialogDescription>
            {isDebit
              ? "Débito administrativo. O valor sai do saldo disponível. O motivo é opcional."
              : "Crédito administrativo. O valor entra no saldo disponível. O motivo é opcional."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-balance-amount">Valor</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                R$
              </span>
              <Input
                id="admin-balance-amount"
                type="text"
                inputMode="decimal"
                value={amountInput}
                onChange={(event) => handleAmountChange(event.target.value)}
                placeholder="0,00"
                disabled={saving}
                autoComplete="off"
              />
            </div>
            {exceedsBalance ? (
              <p className="text-xs text-destructive">
                O valor não pode ser maior que o saldo disponível.
              </p>
            ) : null}
          </div>

          <div className="space-y-1 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm">
            <p>
              <span className="text-muted-foreground">Saldo atual: </span>
              <span className="font-medium tabular-nums text-foreground">
                {formatCurrency(availableCents)}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Após o ajuste: </span>
              <span className="font-medium tabular-nums text-foreground">
                {formatCurrency(Math.max(0, balanceAfter))}
              </span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-balance-reason">Motivo (opcional)</Label>
            <Textarea
              id="admin-balance-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={
                isDebit
                  ? "Descreva o motivo do débito..."
                  : "Descreva o motivo do crédito..."
              }
              className="min-h-24 resize-none"
              disabled={saving}
            />
          </div>
        </div>

        {!confirming ? (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant={isDebit ? "destructive" : "default"}
              disabled={!amountOk || !reasonOk}
              onClick={() => setConfirming(true)}
            >
              Continuar
            </Button>
          </div>
        ) : (
          <div className="mt-2 space-y-3">
            <p className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
              Confirmar {isDebit ? "débito" : "crédito"} de{" "}
              {formatCurrency(amountCents)}?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => setConfirming(false)}
              >
                Voltar
              </Button>
              <Button
                type="button"
                variant={isDebit ? "destructive" : "default"}
                disabled={!canSubmit}
                onClick={handleConfirm}
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : isDebit ? (
                  "Confirmar débito"
                ) : (
                  "Confirmar crédito"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
