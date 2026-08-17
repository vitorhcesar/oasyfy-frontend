import PageHeader from "@/presentation/components/PageHeader";
import { PracaChat } from "@/presentation/components/praca/PracaChat";
import { applyPracaRealtimeEvent } from "@/presentation/components/praca/praca-realtime";
import { mergePracaLivePage } from "@/presentation/components/praca/merge-praca-messages";
import { SellerLayout } from "@/presentation/components/seller/SellerLayout";
import { Button } from "@/presentation/components/ui/button";
import { useAuthContext } from "@/presentation/context/AuthContext";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { usePracaLiveSocket } from "@/presentation/hooks/use-praca-live-socket";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";
import type {
  IPracaAccessDto,
  IPracaMessageDto,
} from "@/infra/http/services/api/modules/types/praca.types";
import { Loader2, MessagesSquare } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function SellerPraca() {
  const apiService = useApiService();
  const { user } = useAuthContext();
  const currentUserId = Number(user?.id);
  const [access, setAccess] = useState<IPracaAccessDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [messages, setMessages] = useState<IPracaMessageDto[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const loadAccess = useCallback(async () => {
    const data = await apiService.modules.sellerPraca.getAccess();
    setAccess(data);
    return data;
  }, [apiService]);

  const mergeLatest = useCallback(async () => {
    const page = await apiService.modules.sellerPraca.listMessages({
      limit: 50,
    });
    setMessages((current) => mergePracaLivePage(current, page.messages));
    setNextCursor((cursor) => cursor ?? page.nextCursor);
  }, [apiService]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadAccess();
        if (cancelled) return;
        if (data.status === "enabled") {
          await mergeLatest();
        }
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
  }, [loadAccess, mergeLatest]);

  usePracaLiveSocket({
    enabled: access?.status === "enabled",
    onEvent: (event) => {
      setMessages((current) => applyPracaRealtimeEvent(current, event));
    },
    onReconnect: () => {
      void mergeLatest().catch(() => undefined);
    },
  });

  const handleRequest = async () => {
    setRequesting(true);
    try {
      const data = await apiService.modules.sellerPraca.requestAccess();
      setAccess(data);
      toast.success("Solicitação enviada");
    } catch (error) {
      toast.error(
        getErrorMessageOrDefault(error, "Não foi possível solicitar o acesso"),
      );
    } finally {
      setRequesting(false);
    }
  };

  const handleSend = async (body: string, quotedMessageId?: number | null) => {
    setSending(true);
    try {
      const created = await apiService.modules.sellerPraca.sendMessage(
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
      const page = await apiService.modules.sellerPraca.listMessages({
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

  return (
    <SellerLayout>
      <div className="flex h-full min-h-0 flex-col overflow-hidden px-5 py-6 md:px-8">
        <PageHeader
          className="mb-4 shrink-0"
          eyebrow="Comunidade"
          title="A Praça"
          description="Canal único de networking entre sellers da plataforma."
        />

        {loading || !access ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : access.status === "enabled" ? (
          <PracaChat
            currentUserId={Number.isFinite(currentUserId) ? currentUserId : 0}
            messages={messages}
            sending={sending}
            loadingOlder={loadingOlder}
            hasOlder={nextCursor != null}
            onSend={handleSend}
            onLoadOlder={handleLoadOlder}
          />
        ) : (
          <div className="rounded-2xl border border-white/10 bg-background/40 p-6 backdrop-blur-md md:p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MessagesSquare size={22} />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Espaço de networking entre sellers
            </h2>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
              A Praça é um canal único onde sellers conversam entre si. O acesso
              é liberado pela administração.
            </p>
            {access.status === "pending" ? (
              <p className="mt-4 text-sm text-foreground">
                Solicitação enviada. Avisaremos por e-mail quando liberarmos.
              </p>
            ) : null}
            {access.status === "rejected" ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Ainda não foi possível liberar. Você pode solicitar novamente.
              </p>
            ) : null}
            <Button
              className="mt-5"
              disabled={requesting || access.status === "pending"}
              onClick={() => void handleRequest()}
            >
              {requesting ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : null}
              {access.status === "pending"
                ? "Solicitação enviada"
                : access.status === "rejected"
                  ? "Solicitar novamente"
                  : "Solicitar abertura"}
            </Button>
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
