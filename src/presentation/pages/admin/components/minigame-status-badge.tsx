import type { TMinigameStatus } from "@/infra/http/services/api/modules/types/minigame.types";

const STATUS_BADGE: Record<
  TMinigameStatus,
  { label: string; cls: string; dot: string }
> = {
  pending: {
    label: "Pendente",
    cls: "border-warning/25 bg-warning/10 text-warning",
    dot: "bg-warning",
  },
  declined: {
    label: "Recusado",
    cls: "border-border bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  expired: {
    label: "Expirado",
    cls: "border-border bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  in_progress: {
    label: "Em andamento",
    cls: "border-primary/25 bg-primary/10 text-primary",
    dot: "bg-primary",
  },
  completed: {
    label: "Concluído",
    cls: "border-success/25 bg-success/10 text-success",
    dot: "bg-success",
  },
  reversed: {
    label: "Revertido",
    cls: "border-warning/25 bg-warning/10 text-warning",
    dot: "bg-warning",
  },
  forfeited: {
    label: "W.O.",
    cls: "border-destructive/25 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
};

export function minigameStatusBadge(status: TMinigameStatus) {
  const s = STATUS_BADGE[status] ?? STATUS_BADGE.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${s.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
