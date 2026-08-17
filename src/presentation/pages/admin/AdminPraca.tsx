import { ConfirmationModal } from "@/presentation/components/ConfirmationModal";
import { PracaChat } from "@/presentation/components/praca/PracaChat";
import { applyPracaRealtimeEvent } from "@/presentation/components/praca/praca-realtime";
import { mergePracaLivePage } from "@/presentation/components/praca/merge-praca-messages";
import { Button } from "@/presentation/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/presentation/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/presentation/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/presentation/components/ui/tabs";
import { useAuthContext } from "@/presentation/context/AuthContext";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { usePracaLiveSocket } from "@/presentation/hooks/use-praca-live-socket";
import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";
import type {
  IPracaAccessRequestDto,
  IPracaEnabledMemberDto,
  IPracaMessageDto,
} from "@/infra/http/services/api/modules/types/praca.types";
import { ChevronDown, Loader2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

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
  const [users, setUsers] = useState<IPracaEnabledMemberDto[]>([]);
  const [actingId, setActingId] = useState<number | null>(null);
  const [purgingId, setPurgingId] = useState<number | null>(null);
  const [pendingPurgeUser, setPendingPurgeUser] =
    useState<IPracaEnabledMemberDto | null>(null);

  const mergeLatest = useCallback(async () => {
    const page = await apiService.modules.adminPraca.listMessages({
      limit: 50,
    });
    setMessages((current) => mergePracaLivePage(current, page.messages));
    setNextCursor((cursor) => cursor ?? page.nextCursor);
  }, [apiService]);

  const loadRequests = useCallback(async () => {
    const data = await apiService.modules.adminPraca.listAccessRequests(
      "pending",
    );
    setRequests(data);
  }, [apiService]);

  const loadUsers = useCallback(async () => {
    const data = await apiService.modules.adminPraca.listEnabledUsers();
    setUsers(data);
  }, [apiService]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([mergeLatest(), loadRequests(), loadUsers()]);
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
  }, [loadRequests, loadUsers, mergeLatest]);

  usePracaLiveSocket({
    enabled: !loading,
    onEvent: (event) => {
      setMessages((current) => applyPracaRealtimeEvent(current, event));
    },
    onReconnect: () => {
      void mergeLatest().catch(() => undefined);
    },
  });

  useEffect(() => {
    const tickQueue = () => {
      if (document.visibilityState !== "visible") return;
      void loadRequests().catch(() => undefined);
      void loadUsers().catch(() => undefined);
    };
    const queueTimer = window.setInterval(tickQueue, QUEUE_POLL_MS);
    return () => {
      window.clearInterval(queueTimer);
    };
  }, [loadRequests, loadUsers]);

  const handleSend = async (body: string, quotedMessageId?: number | null) => {
    setSending(true);
    try {
      const created = await apiService.modules.adminPraca.sendMessage(
        body,
        quotedMessageId,
      );
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
      await loadUsers();
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

  const handlePurgeUser = async (member: IPracaEnabledMemberDto) => {
    setPurgingId(member.sellerId);
    try {
      const result = await apiService.modules.adminPraca.purgeUserMessages(
        member.sellerId,
      );
      setMessages((current) =>
        current.filter((item) => item.author.id !== member.sellerId),
      );
      toast.success(
        result.purged === 1
          ? "1 mensagem apagada"
          : `${result.purged} mensagens apagadas`,
      );
      await loadUsers();
    } catch (error) {
      toast.error(
        getErrorMessageOrDefault(error, "Não foi possível apagar as mensagens"),
      );
      throw error;
    } finally {
      setPurgingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden px-5 py-6 md:px-8">
        <div className="shrink-0">
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
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : (
          <Tabs
            defaultValue="canal"
            className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <TabsList className="shrink-0">
              <TabsTrigger value="canal">Canal</TabsTrigger>
              <TabsTrigger value="solicitacoes">
                Solicitações
                {requests.length > 0 ? ` (${requests.length})` : ""}
              </TabsTrigger>
              <TabsTrigger value="usuarios">
                Usuários
                {users.length > 0 ? ` (${users.length})` : ""}
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="canal"
              className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
            >
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
            <TabsContent
              value="solicitacoes"
              className="mt-4 min-h-0 flex-1 overflow-y-auto data-[state=inactive]:hidden"
            >
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
            <TabsContent
              value="usuarios"
              className="mt-4 min-h-0 flex-1 overflow-y-auto data-[state=inactive]:hidden"
            >
              <div className="admin-surface overflow-hidden">
                {users.length === 0 ? (
                  <p className="p-5 text-sm text-muted-foreground">
                    Nenhum usuário liberado para a Praça.
                  </p>
                ) : (
                  <ul className="divide-y divide-border/40">
                    {users.map((member) => {
                      const initials = member.displayName
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();
                      return (
                        <li
                          key={member.sellerId}
                          className="flex flex-wrap items-center justify-between gap-3 p-4"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar className="h-11 w-11">
                              {member.avatarUrl ? (
                                <AvatarImage
                                  src={member.avatarUrl}
                                  alt={member.displayName}
                                />
                              ) : null}
                              <AvatarFallback className="bg-muted text-xs font-semibold text-primary">
                                {initials || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {member.displayName || "Sem nome"}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {member.email} · #{member.sellerId} ·{" "}
                                {member.messageCount === 1
                                  ? "1 mensagem"
                                  : `${member.messageCount} mensagens`}
                              </p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={purgingId === member.sellerId}
                              >
                                {purgingId === member.sellerId ? (
                                  <Loader2
                                    size={14}
                                    className="mr-2 animate-spin"
                                  />
                                ) : null}
                                Ações
                                <ChevronDown size={14} className="ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64">
                              <DropdownMenuItem
                                className="cursor-pointer text-destructive focus:text-destructive"
                                onSelect={() => setPendingPurgeUser(member)}
                              >
                                <Trash2 size={14} className="mr-2" />
                                Excluir todas as mensagens na Praça
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
      <ConfirmationModal
        open={pendingPurgeUser != null}
        onOpenChange={(open) => {
          if (!open) setPendingPurgeUser(null);
        }}
        title="Apagar mensagens"
        description={
          pendingPurgeUser
            ? `Apagar todas as mensagens de ${pendingPurgeUser.displayName} na Praça? Esta ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Apagar todas"
        onConfirm={async () => {
          if (!pendingPurgeUser) return;
          await handlePurgeUser(pendingPurgeUser);
        }}
      />
    </AdminLayout>
  );
}
