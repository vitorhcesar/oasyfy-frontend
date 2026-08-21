import { ConfirmationModal } from "@/presentation/components/ConfirmationModal";
import { AdminMinigameDetailDialog } from "@/presentation/pages/admin/components/AdminMinigameDetailDialog";
import { minigameStatusBadge } from "@/presentation/pages/admin/components/minigame-status-badge";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import type {
  IAdminMinigameDetailDto,
  IAdminMinigameListItem,
} from "@/infra/http/services/api/modules/types/minigame.types";
import { formatCurrency } from "@/presentation/pages/AdminTransactionsPage/utils/format-currency";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye, Loader2, RotateCcw, Swords } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

export default function AdminMinigames() {
  const { minigameId } = useParams();
  const navigate = useNavigate();
  const apiService = useApiService();
  const [items, setItems] = useState<IAdminMinigameListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<IAdminMinigameDetailDto | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reverseTarget, setReverseTarget] = useState<IAdminMinigameListItem | null>(
    null,
  );
  const [reverseReason, setReverseReason] = useState("");

  const load = useCallback(async () => {
    const data = await apiService.modules.adminMinigame.list({ limit: 50 });
    setItems(
      data.items.map((item) => ({
        ...item,
        createdAt:
          typeof item.createdAt === "string"
            ? item.createdAt
            : new Date(item.createdAt).toISOString(),
        completedAt: item.completedAt
          ? typeof item.completedAt === "string"
            ? item.completedAt
            : new Date(item.completedAt).toISOString()
          : null,
      })),
    );
  }, [apiService]);

  useEffect(() => {
    void load()
      .catch((error) => {
        toast.error(getErrorMessageOrDefault(error, "Erro ao listar minigames"));
      })
      .finally(() => setLoading(false));
  }, [load]);

  const openDetail = useCallback(
    async (id: number) => {
      setDetailOpen(true);
      setDetailLoading(true);
      try {
        const data = await apiService.modules.adminMinigame.get(id);
        setDetail(data);
      } catch (error) {
        toast.error(getErrorMessageOrDefault(error, "Erro ao carregar"));
        setDetailOpen(false);
      } finally {
        setDetailLoading(false);
      }
    },
    [apiService],
  );

  useEffect(() => {
    const id = Number(minigameId);
    if (!Number.isInteger(id) || id <= 0) return;
    void openDetail(id);
  }, [minigameId, openDetail]);

  const handleDetailOpenChange = (open: boolean) => {
    setDetailOpen(open);
    if (!open) {
      setDetail(null);
      if (minigameId) navigate("/admin/minigames");
    }
  };

  const winnerName = (item: IAdminMinigameListItem) => {
    if (item.winnerSellerId === item.challengerSellerId) {
      return item.challengerNameSnapshot;
    }
    if (item.winnerSellerId === item.challengedSellerId) {
      return item.challengedNameSnapshot;
    }
    return "—";
  };

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-9">
        <header className="mb-7 flex animate-fade-in flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Comercial
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-[2.15rem]">
              Minigames
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Partidas da Praça, taxas e reversões.
            </p>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="admin-surface px-6 py-16 text-center">
            <Swords className="mx-auto mb-3 text-muted-foreground" size={24} />
            <p className="mb-1 text-base font-semibold text-foreground">
              Nenhuma partida
            </p>
            <p className="text-sm text-muted-foreground">
              Os minigames da Praça aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="admin-surface overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Data
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Desafiante
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Desafiado
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Stake
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Taxa
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Vencedor
                  </th>
                  <th className="w-24 px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/40 last:border-0 transition-colors hover:bg-muted/25"
                  >
                    <td className="px-5 py-3.5 text-sm tabular-nums text-muted-foreground">
                      {format(new Date(item.createdAt), "dd/MM/yy HH:mm", {
                        locale: ptBR,
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-foreground">
                      {item.challengerNameSnapshot}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-foreground">
                      {item.challengedNameSnapshot}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold tabular-nums text-foreground">
                      {formatCurrency(item.stakeCents)}
                    </td>
                    <td className="px-5 py-3.5 text-sm tabular-nums text-foreground">
                      {formatCurrency(item.feeCents)}
                    </td>
                    <td className="px-5 py-3.5">
                      {minigameStatusBadge(item.status)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-foreground">
                      {winnerName(item)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => void openDetail(item.id)}
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Detalhes"
                          aria-label="Ver detalhes"
                        >
                          <Eye size={15} />
                        </button>
                        {item.status === "completed" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setReverseReason("");
                              setReverseTarget(item);
                            }}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                            title="Reverter"
                            aria-label="Reverter partida"
                          >
                            <RotateCcw size={15} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminMinigameDetailDialog
        open={detailOpen}
        loading={detailLoading}
        detail={detail}
        onOpenChange={handleDetailOpenChange}
      />

      <ConfirmationModal
        open={reverseTarget != null}
        onOpenChange={(open) => {
          if (!open) setReverseTarget(null);
        }}
        title="Reverter partida"
        description="O saldo do ganhador pode ficar negativo se ele já tiver sacado o valor."
        confirmLabel="Reverter"
        confirmDisabled={reverseReason.trim().length < 5}
        onConfirm={async () => {
          if (!reverseTarget) return;
          try {
            await apiService.modules.adminMinigame.reverse(
              reverseTarget.id,
              reverseReason.trim(),
            );
            toast.success("Partida revertida");
            await load();
          } catch (error) {
            toast.error(
              getErrorMessageOrDefault(error, "Não foi possível reverter"),
            );
            throw error;
          }
        }}
      >
        <textarea
          className="h-24 w-full rounded-xl border border-border/50 bg-background p-3 text-sm"
          minLength={5}
          maxLength={500}
          value={reverseReason}
          onChange={(event) => setReverseReason(event.target.value)}
          placeholder="Motivo (obrigatório)"
        />
      </ConfirmationModal>
    </AdminLayout>
  );
}
