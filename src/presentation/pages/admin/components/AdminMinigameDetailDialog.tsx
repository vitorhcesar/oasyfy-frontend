import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/presentation/components/ui/dialog";
import { rpsEmoji, rpsLabel } from "@/presentation/components/minigame/rps-choices";
import { getMinigameCatalogItem } from "@/presentation/components/praca/minigame-catalog";
import type {
  IAdminMinigameDetailDto,
} from "@/infra/http/services/api/modules/types/minigame.types";
import { formatCurrency } from "@/presentation/pages/AdminTransactionsPage/utils/format-currency";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { minigameStatusBadge } from "./minigame-status-badge";

interface IAdminMinigameDetailDialogProps {
  open: boolean;
  loading: boolean;
  detail: IAdminMinigameDetailDto | null;
  onOpenChange: (open: boolean) => void;
}

function choiceLabel(choice: string | null): string {
  if (choice === "rock" || choice === "paper" || choice === "scissors") {
    return `${rpsEmoji(choice)} ${rpsLabel(choice)}`;
  }
  return choice ?? "—";
}

function winnerLabel(side: string | null): string {
  if (side === "challenger") return "Desafiante";
  if (side === "challenged") return "Desafiado";
  if (side === "draw") return "Empate";
  return side ?? "Aberta";
}

export function AdminMinigameDetailDialog({
  open,
  loading,
  detail,
  onOpenChange,
}: IAdminMinigameDetailDialogProps) {
  const game = detail ? getMinigameCatalogItem(detail.type) : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto border-border/60 bg-background">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 text-xl font-bold tracking-tight">
            Partida {detail ? `#${detail.id}` : ""}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detalhes da partida de minigame
          </DialogDescription>
        </DialogHeader>

        {loading || !detail ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {minigameStatusBadge(detail.status)}
              <span className="text-sm text-muted-foreground">
                {game?.label ?? "Minigame"} · melhor de{" "}
                {detail.gameConfig.bestOf}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow
                label="Desafiante"
                value={detail.challenger.displayName}
              />
              <InfoRow
                label="Desafiado"
                value={detail.challenged.displayName}
              />
              <InfoRow
                label="Você coloca / stake"
                value={formatCurrency(detail.stakeCents)}
              />
              <InfoRow
                label="Taxa"
                value={formatCurrency(detail.feeCents)}
              />
              <InfoRow
                label="Total da partida"
                value={formatCurrency(detail.potCents)}
              />
              <InfoRow
                label="Data"
                value={format(
                  new Date(detail.createdAt),
                  "dd/MM/yyyy HH:mm:ss",
                  { locale: ptBR },
                )}
              />
            </div>

            {detail.rounds.length > 0 ? (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Rodadas
                </p>
                <div className="space-y-2">
                  {detail.rounds.map((round) => (
                    <div
                      key={round.roundNumber}
                      className="rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5 text-sm"
                    >
                      <p className="font-medium">
                        Rodada {round.roundNumber}
                      </p>
                      <p className="mt-0.5 text-muted-foreground">
                        {choiceLabel(round.challengerChoice)} ×{" "}
                        {choiceLabel(round.challengedChoice)} ·{" "}
                        {winnerLabel(round.winnerSide)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {detail.reverseReason ? (
              <div className="rounded-xl border border-warning/20 bg-warning/10 px-3.5 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-warning">
                  Motivo da reversão
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {detail.reverseReason}
                </p>
              </div>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 px-3.5 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
