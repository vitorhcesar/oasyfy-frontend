import ModalPortal from "@/presentation/components/ModalPortal";
import type { ISellerWebhookEndpointDto } from "@/infra/http/services/api/modules/seller-portal.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { Copy, Loader2, Plus, Send, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

function deliveryLabel(status: ISellerWebhookEndpointDto["last_delivery_status"]) {
  if (status === "success") return "Último envio: sucesso";
  if (status === "failed") return "Último envio: falhou";
  if (status === "pending") return "Último envio: pendente";
  return "Nenhum envio ainda";
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

  const reload = useCallback(
    () =>
      apiService.modules.sellerPortal
        .listWebhooks()
        .then(setWebhooks)
        .catch(() => toast.error("Erro ao carregar webhooks")),
    [apiService],
  );

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload]);

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
    } catch {
      toast.error("Erro ao excluir");
    } finally {
      setBusyId(null);
    }
  };

  return (
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
