import { PracaChat } from "@/presentation/components/praca/PracaChat";
import { Button } from "@/presentation/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/presentation/components/ui/tabs";
import { useAuthContext } from "@/presentation/context/AuthContext";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";
import type {
  IPracaAccessRequestDto,
  IPracaMessageDto,
} from "@/infra/http/services/api/modules/types/praca.types";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const CHANNEL_POLL_MS = 3000;
const QUEUE_POLL_MS = 10000;

export default function AdminPracaPage() {
  const apiService = useApiService();
  const { user } = useAuthContext();
  const currentUserId = Number(user?.id);
  const [messages, setMessages] = useState<IPracaMessageDto[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<IPracaAccessRequestDto[]>([]);
  const [actingId, setActingId] = useState<number | null>(null);

  const mergeLatest = useCallback(async () => {
    const page = await apiService.modules.adminPraca.listMessages({
      limit: 50,
    });
    setMessages((current) => {
      const byId = new Map(current.map((item) => [item.id, item]));
      for (const item of page.messages) {
        byId.set(item.id, item);
      }
      return [...byId.values()].sort((a, b) => a.id - b.id);
    });
    setNextCursor((cursor) => cursor ?? page.nextCursor);
  }, [apiService]);

  const loadRequests = useCallback(async () => {
    const data = await apiService.modules.adminPraca.listAccessRequests(
      "pending",
    );
    setRequests(data);
  }, [apiService]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([mergeLatest(), loadRequests()]);
      } catch (error) {
        if (!cancelled) {
          toast.error(
            getErrorMessageOrDefault(error, "Erro ao carregar A Praça"),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadRequests, mergeLatest]);

  useEffect(() => {
    const tickChannel = () => {
      if (document.visibilityState !== "visible") return;
      void mergeLatest().catch(() => undefined);
    };
    const tickQueue = () => {
      if (document.visibilityState !== "visible") return;
      void loadRequests().catch(() => undefined);
    };
    const channelTimer = window.setInterval(tickChannel, CHANNEL_POLL_MS);
    const queueTimer = window.setInterval(tickQueue, QUEUE_POLL_MS);
    document.addEventListener("visibilitychange", tickChannel);
    return () => {
      window.clearInterval(channelTimer);
      window.clearInterval(queueTimer);
      document.removeEventListener("visibilitychange", tickChannel);
    };
  }, [loadRequests, mergeLatest]);

  const handleSend = async (body: string) => {
    setSending(true);
    try {
      const created = await apiService.modules.adminPraca.sendMessage(body);
      setMessages((current) =>
        current.some((item) => item.id === created.id)
          ? current
          : [...current, created],
      );
    } catch (error) {
      toast.error(getErrorMessageOrDefault(error, "Não foi possível enviar"));
      throw error;
    } finally {
      setSending(false);
    }
  };

  const handleLoadOlder = async () => {
    if (!nextCursor) return;
    setLoadingOlder(true);
    try {
      const page = await apiService.modules.adminPraca.listMessages({
        cursor: nextCursor,
        limit: 50,
      });
      setMessages((current) => {
        const byId = new Map(page.messages.map((item) => [item.id, item]));
        for (const item of current) {
          byId.set(item.id, item);
        }
        return [...byId.values()].sort((a, b) => a.id - b.id);
      });
      setNextCursor(page.nextCursor);
    } catch (error) {
      toast.error(
        getErrorMessageOrDefault(error, "Não foi possível carregar mensagens"),
      );
    } finally {
      setLoadingOlder(false);
    }
  };

  const handleDelete = async (messageId: number) => {
    try {
      await apiService.modules.adminPraca.deleteMessage(messageId);
      setMessages((current) => current.filter((item) => item.id !== messageId));
      toast.success("Mensagem apagada");
    } catch (error) {
      toast.error(getErrorMessageOrDefault(error, "Não foi possível apagar"));
    }
  };

  const handleApprove = async (id: number) => {
    setActingId(id);
    try {
      const result = await apiService.modules.adminPraca.approveAccessRequest(id);
      toast.success(
        result.emailSent
          ? "Acesso liberado e e-mail enviado"
          : "Acesso liberado",
      );
      await loadRequests();
    } catch (error) {
      toast.error(getErrorMessageOrDefault(error, "Não foi possível aprovar"));
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id: number) => {
    setActingId(id);
    try {
      await apiService.modules.adminPraca.rejectAccessRequest(id);
      toast.success("Solicitação recusada");
      await loadRequests();
    } catch (error) {
      toast.error(getErrorMessageOrDefault(error, "Não foi possível recusar"));
    } finally {
      setActingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 md:px-8 md:py-9">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Comunidade
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            A Praça
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Canal único dos sellers. Aprove solicitações, converse e modere
            mensagens.
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : (
          <Tabs defaultValue="canal">
            <TabsList>
              <TabsTrigger value="canal">Canal</TabsTrigger>
              <TabsTrigger value="solicitacoes">
                Solicitações
                {requests.length > 0 ? ` (${requests.length})` : ""}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="canal" className="mt-4">
              <PracaChat
                currentUserId={Number.isFinite(currentUserId) ? currentUserId : 0}
                messages={messages}
                sending={sending}
                loadingOlder={loadingOlder}
                hasOlder={nextCursor != null}
                onSend={handleSend}
                onLoadOlder={handleLoadOlder}
                onDelete={handleDelete}
              />
            </TabsContent>
            <TabsContent value="solicitacoes" className="mt-4">
              <div className="admin-surface overflow-hidden">
                {requests.length === 0 ? (
                  <p className="p-5 text-sm text-muted-foreground">
                    Nenhuma solicitação pendente.
                  </p>
                ) : (
                  <ul className="divide-y divide-border/40">
                    {requests.map((request) => (
                      <li
                        key={request.id}
                        className="flex flex-wrap items-center justify-between gap-3 p-4"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {request.sellerName || "Sem nome"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {request.sellerEmail} · #
                            {request.sellerId} ·{" "}
                            {new Date(request.createdAt).toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={actingId === request.id}
                            onClick={() => void handleApprove(request.id)}
                          >
                            {actingId === request.id ? (
                              <Loader2 size={14} className="mr-2 animate-spin" />
                            ) : null}
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actingId === request.id}
                            onClick={() => void handleReject(request.id)}
                          >
                            Recusar
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
}
