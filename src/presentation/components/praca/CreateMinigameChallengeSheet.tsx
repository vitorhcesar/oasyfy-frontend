import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/presentation/components/ui/sheet";
import { MinigameQuoteSummary } from "@/presentation/components/praca/MinigameQuoteSummary";
import {
  MINIGAME_CATALOG,
  MINIGAME_STAKE_MAX_REAIS,
  MINIGAME_STAKE_MIN_REAIS,
} from "@/presentation/components/praca/minigame-catalog";
import { useApiService } from "@/presentation/hooks/use-api-service";
import type {
  IMinigameQuoteDto,
  TMinigameType,
} from "@/infra/http/services/api/modules/types/minigame.types";
import { formatCurrency } from "@/presentation/pages/AdminTransactionsPage/utils/format-currency";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";
import { cn } from "@/presentation/utils/cn";
import { Loader2, Swords } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ICreateMinigameChallengeSheetProps {
  open: boolean;
  targetSellerId: number;
  targetName: string;
  availableCents: number;
  onOpenChange: (open: boolean) => void;
}

export function CreateMinigameChallengeSheet({
  open,
  targetSellerId,
  targetName,
  availableCents,
  onOpenChange,
}: ICreateMinigameChallengeSheetProps) {
  const apiService = useApiService();
  const [selectedType, setSelectedType] = useState<TMinigameType | null>(null);
  const [stakeReais, setStakeReais] = useState(MINIGAME_STAKE_MIN_REAIS);
  const [bestOf, setBestOf] = useState<3 | 5 | 7>(3);
  const [quote, setQuote] = useState<IMinigameQuoteDto | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedType(null);
    setStakeReais(MINIGAME_STAKE_MIN_REAIS);
    setBestOf(3);
    setQuote(null);
  }, [open]);

  const stakeInRange =
    stakeReais >= MINIGAME_STAKE_MIN_REAIS &&
    stakeReais <= MINIGAME_STAKE_MAX_REAIS &&
    Number.isInteger(stakeReais);

  useEffect(() => {
    if (!open || !selectedType || !stakeInRange) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    void apiService.modules.sellerMinigame
      .quote(stakeReais)
      .then((data) => {
        if (!cancelled) setQuote(data);
      })
      .catch(() => {
        if (!cancelled) setQuote(null);
      });
    return () => {
      cancelled = true;
    };
  }, [apiService, open, selectedType, stakeInRange, stakeReais]);

  const stakeCents = stakeReais * 100;
  const canSubmit =
    selectedType != null && stakeInRange && availableCents >= stakeCents;

  const handleSubmit = async () => {
    if (!selectedType) return;
    setSubmitting(true);
    try {
      await apiService.modules.sellerMinigame.createChallenge({
        targetSellerId,
        type: selectedType,
        stakeReais,
        gameConfig: { bestOf },
      });
      toast.success("Desafio enviado");
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessageOrDefault(error, "Não foi possível desafiar"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-[90%] flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-start gap-2.5 pr-6 text-left">
            <Swords className="mt-0.5 size-5 shrink-0 text-primary" />
            <span>Desafiar {targetName}</span>
          </SheetTitle>
          <SheetDescription>
            O valor é reservado até o aceite.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto py-4">
          <div className="space-y-2">
            <Label>Minigame</Label>
            <div className="grid gap-2">
              {MINIGAME_CATALOG.map((game) => {
                const selected = selectedType === game.type;
                return (
                  <button
                    key={game.type}
                    type="button"
                    onClick={() => setSelectedType(game.type)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors",
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-border/60 bg-background hover:border-primary/40 hover:bg-muted/40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary/10 text-primary",
                      )}
                    >
                      <game.Icon className="h-6 w-7" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">
                        {game.label}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedType ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="minigame-stake">Valor (R$)</Label>
                <Input
                  id="minigame-stake"
                  type="number"
                  min={MINIGAME_STAKE_MIN_REAIS}
                  max={MINIGAME_STAKE_MAX_REAIS}
                  step={1}
                  value={stakeReais}
                  onChange={(event) =>
                    setStakeReais(Number.parseInt(event.target.value, 10) || 0)
                  }
                  className="h-11 rounded-xl border-border/50"
                />
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    Mín. {formatCurrency(MINIGAME_STAKE_MIN_REAIS * 100)} · Máx.{" "}
                    {formatCurrency(MINIGAME_STAKE_MAX_REAIS * 100)}
                  </span>
                  <span>Disponível: {formatCurrency(availableCents)}</span>
                </div>
              </div>

              {selectedType === "rock_paper_scissors" ? (
                <div className="space-y-2">
                  <Label>Melhor de</Label>
                  <div className="flex gap-2">
                    {([3, 5, 7] as const).map((value) => (
                      <Button
                        key={value}
                        type="button"
                        variant={bestOf === value ? "default" : "outline"}
                        onClick={() => setBestOf(value)}
                      >
                        {value}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}

              {quote ? (
                <MinigameQuoteSummary
                  stakeCents={quote.stakeCents}
                  potCents={quote.potCents}
                  feeCents={quote.feeCents}
                  winnerNetCents={quote.winnerNetCents}
                />
              ) : null}
            </>
          ) : null}
        </div>

        <SheetFooter>
          <Button
            disabled={!canSubmit || submitting}
            onClick={() => void handleSubmit()}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            Confirmar desafio
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
