import ListPagination from "@/presentation/components/ListPagination";
import ModalPortal from "@/presentation/components/ModalPortal";
import type {
  IAdminWebhookDeliveryDetailDto,
  IAdminWebhookDeliveryListItemDto,
} from "@/infra/http/services/api/modules/admin-webhooks.module";
import type { ISellerWebhookEndpointDto } from "@/infra/http/services/api/modules/seller-portal.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import AdminWebhookDetailDialog from "@/presentation/pages/AdminWebhooksPage/components/AdminWebhookDetailDialog";
import { cn } from "@/presentation/utils/cn";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Copy, Eye, Loader2, Plus, Send, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const DELIVERIES_PER_PAGE = 10;

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  success: {
    label: "Sucesso",
    cls: "border-success/25 bg-success/10 text-success",
  },
  pending: {
    label: "Pendente",
    cls: "border-warning/25 bg-warning/10 text-warning",
  },
  failed: {
    label: "Falhou",
    cls: "border-destructive/25 bg-destructive/10 text-destructive",
  },
};

function deliveryLabel(
  status: ISellerWebhookEndpointDto["last_delivery_status"],
) {
  if (status === "success") return "Último envio: sucesso";
  if (status === "failed") return "Último envio: falhou";
  if (status === "pending") return "Último envio: pendente";
  return "Nenhum envio ainda";
}

function statusBadge(status: string) {
  const config = STATUS_BADGE[status] ?? {
    label: status,
    cls: "border-border bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-semibold",
        config.cls,
      )}
    >
      {config.label}
    </span>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount / 100);
}

export function SellerWebhooksTab() {
  const apiService = useApiService();
  const [webhooks, setWebhooks] = useState<ISellerWebhookEndpointDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [url, setUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [deliveries, setDeliveries] = useState<
    IAdminWebhookDeliveryListItemDto[]
  >([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(true);
  const [deliveryPage, setDeliveryPage] = useState(1);
  const [deliveryTotal, setDeliveryTotal] = useState(0);
  const [deliveryTotalPages, setDeliveryTotalPages] = useState(1);
  const [deliveryStatus, setDeliveryStatus] = useState("");
  const [deliveryEndpointId, setDeliveryEndpointId] = useState("");
  const [detail, setDetail] = useState<IAdminWebhookDeliveryDetailDto | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [revealSecret, setRevealSecret] = useState(true);
  const [revealSecretBusy, setRevealSecretBusy] = useState(false);

  const reload = useCallback(
    () =>
      apiService.modules.sellerPortal
        .listWebhooks()
        .then(setWebhooks)
        .catch(() => toast.error("Erro ao carregar webhooks")),
    [apiService],
  );

  const reloadDeliveries = useCallback(async () => {
    setDeliveriesLoading(true);
    try {
      const result = await apiService.modules.sellerPortal.listWebhookDeliveries({
        page: deliveryPage,
        limit: DELIVERIES_PER_PAGE,
        status: deliveryStatus || undefined,
        endpointId: deliveryEndpointId
          ? Number(deliveryEndpointId)
          : undefined,
      });
      setDeliveries(result.items);
      setDeliveryTotal(result.total);
      setDeliveryTotalPages(result.totalPages);
    } catch {
      toast.error("Erro ao carregar envios");
    } finally {
      setDeliveriesLoading(false);
    }
  }, [apiService, deliveryPage, deliveryStatus, deliveryEndpointId]);

  useEffect(() => {
    reload().finally(() => setLoading(false));
    apiService.modules.sellerPortal
      .getWebhookSettings()
      .then((settings) =>
        setRevealSecret(settings.reveal_secret_on_sale_create),
      )
      .catch(() => undefined);
  }, [reload, apiService]);

  useEffect(() => {
    void reloadDeliveries();
  }, [reloadDeliveries]);

  const handleCreate = async () => {
    if (!url.trim()) {
      toast.error("Informe a URL");
      return;
    }
    setCreating(true);
    try {
      const created = await apiService.modules.sellerPortal.createWebhook(
        url.trim(),
      );
      setWebhooks((prev) => [created, ...prev]);
      setCreatedSecret(created.secret ?? null);
      setUrl("");
      toast.success("Webhook criado");
    } catch {
      toast.error("Não foi possível criar o webhook. Verifique a URL.");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (item: ISellerWebhookEndpointDto) => {
    setBusyId(item.id);
    try {
      const updated = await apiService.modules.sellerPortal.updateWebhook(
        item.id,
        { is_active: !item.is_active },
      );
      setWebhooks((prev) => prev.map((w) => (w.id === item.id ? updated : w)));
    } catch {
      toast.error("Não foi possível atualizar o webhook");
    } finally {
      setBusyId(null);
    }
  };

  const handleTest = async (id: number) => {
    setBusyId(id);
    try {
      await apiService.modules.sellerPortal.testWebhook(id);
      toast.success("Evento de teste enviado");
      await reload();
      await reloadDeliveries();
    } catch {
      toast.error("Falha ao enviar evento de teste");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: number) => {
    setBusyId(id);
    try {
      await apiService.modules.sellerPortal.deleteWebhook(id);
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
      setDeleteId(null);
      toast.success("Webhook excluído");
      await reloadDeliveries();
    } catch {
      toast.error("Erro ao excluir");
    } finally {
      setBusyId(null);
    }
  };

  const openDetail = async (id: number) => {
    setDetail(null);
    setDetailLoading(true);
    try {
      const row = await apiService.modules.sellerPortal.getWebhookDelivery(id);
      setDetail(row);
    } catch {
      toast.error("Não foi possível abrir o envio");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRevealSecretChange = async (checked: boolean) => {
    setRevealSecretBusy(true);
    try {
      const settings = await apiService.modules.sellerPortal.updateWebhookSettings({
        reveal_secret_on_sale_create: checked,
      });
      setRevealSecret(settings.reveal_secret_on_sale_create);
      toast.success(
        checked
          ? "O secret volta no 201 quando a URL já existir"
          : "O secret continua só na primeira vez da URL",
      );
    } catch {
      toast.error("Não foi possível salvar a configuração");
    } finally {
      setRevealSecretBusy(false);
    }
  };

  const selectClass =
    "appearance-none rounded-xl border border-border/40 bg-background px-3 py-2 text-xs text-foreground";

  return (
    <div className="space-y-6">
      <div className="admin-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Webhooks</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Receba POST em HTTPS quando o status de uma venda mudar. Até 3 URLs
              ativas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCreatedSecret(null);
              setShowCreate(true);
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            <Plus size={13} />
            Nova URL
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10 text-muted-foreground">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : webhooks.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum webhook cadastrado.
          </p>
        ) : (
          <ul className="space-y-3">
            {webhooks.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-border/40 px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <code className="break-all text-xs text-foreground">
                      {item.url}
                    </code>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {deliveryLabel(item.last_delivery_status)}
                      {item.last_delivery_at
                        ? ` · ${new Date(item.last_delivery_at).toLocaleString("pt-BR")}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => toggleActive(item)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                        item.is_active
                          ? "bg-success/10 text-success"
                          : "bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      {item.is_active ? "Ativo" : "Inativo"}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === item.id || !item.is_active}
                      onClick={() => handleTest(item.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      title="Enviar evento de teste"
                    >
                      <Send size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(item.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <label className="mt-5 flex cursor-pointer items-start gap-2.5 border-t border-border/40 pt-4">
          <input
            type="checkbox"
            checked={revealSecret}
            disabled={revealSecretBusy}
            onChange={(e) => void handleRevealSecretChange(e.target.checked)}
            className="mt-0.5 rounded border-border accent-primary"
          />
          <div>
            <p className="text-xs font-medium leading-tight text-foreground">
              Devolver o signing secret na criação da venda/PIX
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Se a <code>webhook_url</code> já existir, o 201 de{" "}
              <code>POST /gateway/pix</code> e <code>/sales</code> inclui de
              novo o <code>whsec_...</code>. A chave da API passa a poder ler o
              secret. Ligado por padrão; desative se não quiser devolver.
            </p>
          </div>
        </label>
      </div>

      <div className="admin-surface p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">Envios</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Histórico dos POSTs para as suas URLs. O reenvio fica no suporte.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={deliveryEndpointId}
              onChange={(e) => {
                setDeliveryEndpointId(e.target.value);
                setDeliveryPage(1);
              }}
              className={selectClass}
            >
              <option value="">Todas as URLs</option>
              {webhooks.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.url}
                </option>
              ))}
            </select>
            <select
              value={deliveryStatus}
              onChange={(e) => {
                setDeliveryStatus(e.target.value);
                setDeliveryPage(1);
              }}
              className={selectClass}
            >
              <option value="">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="success">Sucesso</option>
              <option value="failed">Falhou</option>
            </select>
          </div>
        </div>

        {deliveriesLoading ? (
          <div className="flex justify-center py-10 text-muted-foreground">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : deliveries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum envio ainda. Teste uma URL ou aguarde uma venda mudar de
            status.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-border/50">
                    {["Data", "Evento", "URL", "Venda", "Status", "HTTP", ""].map(
                      (label) => (
                        <th
                          key={label || "actions"}
                          className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                        >
                          {label}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-border/40 last:border-0"
                    >
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-foreground">
                        {format(new Date(row.created_at), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-foreground">
                        {row.event}
                        {row.source === "replay" ? " · replay" : ""}
                        {row.test ? " · teste" : ""}
                      </td>
                      <td
                        className="max-w-[220px] truncate px-3 py-2.5 text-xs text-muted-foreground"
                        title={row.endpoint_url}
                      >
                        {row.endpoint_url}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-foreground">
                        {row.transaction_id ? (
                          <>
                            #{row.transaction_id}
                            {row.transaction_amount != null
                              ? ` · ${formatCurrency(row.transaction_amount)}`
                              : ""}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {statusBadge(row.status)}
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {row.attempts}/5
                        </p>
                      </td>
                      <td className="px-3 py-2.5 text-xs tabular-nums text-foreground">
                        {row.last_status_code ?? "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => void openDetail(row.id)}
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Detalhes"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ListPagination
              page={deliveryPage}
              totalPages={deliveryTotalPages}
              total={deliveryTotal}
              perPage={DELIVERIES_PER_PAGE}
              onPageChange={setDeliveryPage}
              variant="table"
            />
          </>
        )}
      </div>

      <AdminWebhookDetailDialog
        detail={detail}
        loading={detailLoading && !detail}
        mode="seller"
        onClose={() => {
          setDetail(null);
          setDetailLoading(false);
        }}
      />

      {showCreate && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-background p-5">
              <h3 className="mb-3 text-base font-semibold">Nova URL de webhook</h3>
              {createdSecret ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Guarde o signing secret agora. Ele não será exibido de novo.
                  </p>
                  <div className="flex items-center gap-2 rounded-xl bg-muted/30 p-3">
                    <code className="flex-1 break-all text-xs">{createdSecret}</code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(createdSecret);
                        toast.success("Secret copiado");
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreate(false);
                      setCreatedSecret(null);
                    }}
                    className="w-full rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground"
                  >
                    Entendi
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://api.loja.com/oasyfy/hooks"
                    className="w-full rounded-xl border border-border/40 bg-background px-3 py-2.5 text-sm"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreate(false)}
                      className="rounded-xl px-3 py-2 text-sm text-muted-foreground"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={creating}
                      onClick={handleCreate}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                    >
                      {creating && <Loader2 size={14} className="animate-spin" />}
                      Criar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ModalPortal>
      )}

      {deleteId !== null && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-5">
              <h3 className="mb-2 text-base font-semibold">Excluir webhook?</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Os envios pendentes desta URL também serão removidos.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteId(null)}
                  className="rounded-xl px-3 py-2 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteId)}
                  className="rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
