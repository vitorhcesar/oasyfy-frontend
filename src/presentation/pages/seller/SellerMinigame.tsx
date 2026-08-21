import { MinigameArenaShell } from "@/presentation/components/minigame/MinigameArenaShell";
import { RpsArena } from "@/presentation/components/minigame/RpsArena";
import { mergeMinigameMatch } from "@/presentation/components/minigame/minigame-match.util";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { getMinigameMatchWsUrl } from "@/infra/http/services/api/api-env";
import type {
  IMinigameMatchDto,
  TMinigameMatchEvent,
  TRpsChoice,
} from "@/infra/http/services/api/modules/types/minigame.types";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

function parseMatchEvent(payload: unknown): TMinigameMatchEvent | null {
  if (!payload || typeof payload !== "object" || !("type" in payload)) {
    return null;
  }
  const type = (payload as { type?: unknown }).type;
  if (type === "state" || type === "pong") return payload as TMinigameMatchEvent;
  return null;
}

export default function SellerMinigamePage() {
  const { minigameId } = useParams();
  const id = Number(minigameId);
  const apiService = useApiService();
  const [match, setMatch] = useState<IMinigameMatchDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const applyMatch = useCallback((next: IMinigameMatchDto) => {
    setMatch((current) => mergeMinigameMatch(current, next));
  }, []);

  const load = useCallback(async () => {
    if (!Number.isInteger(id) || id <= 0) return;
    const data = await apiService.modules.sellerMinigame.getMatch(id);
    applyMatch(data);
  }, [apiService, applyMatch, id]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void load()
      .catch((error) => {
        toast.error(getErrorMessageOrDefault(error, "Não foi possível carregar"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  useEffect(() => {
    if (!Number.isInteger(id) || id <= 0) return;
    let cancelled = false;
    let socket: WebSocket | null = null;
    let pingTimer: number | undefined;
    let retryTimer: number | undefined;
    let attempt = 0;

    const connect = () => {
      if (cancelled) return;
      socket = new WebSocket(getMinigameMatchWsUrl(id));
      socket.onopen = () => {
        attempt = 0;
        pingTimer = window.setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping" }));
          }
        }, 25_000);
        void load();
      };
      socket.onmessage = (message) => {
        let payload: unknown = message.data;
        if (typeof message.data === "string") {
          try {
            payload = JSON.parse(message.data) as unknown;
          } catch {
            return;
          }
        }
        const event = parseMatchEvent(payload);
        if (event?.type === "state") applyMatch(event.match);
      };
      socket.onclose = () => {
        if (pingTimer !== undefined) window.clearInterval(pingTimer);
        socket = null;
        if (cancelled) return;
        const delay = Math.min(1000 * 2 ** attempt, 15_000);
        attempt += 1;
        retryTimer = window.setTimeout(connect, delay);
      };
    };

    connect();
    return () => {
      cancelled = true;
      if (pingTimer !== undefined) window.clearInterval(pingTimer);
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      socket?.close();
    };
  }, [applyMatch, id, load]);

  const submitChoice = async (choice: TRpsChoice) => {
    if (!match?.currentRound) return;
    setSubmitting(true);
    try {
      const next = await apiService.modules.sellerMinigame.submitChoice(id, {
        roundNumber: match.currentRound.roundNumber,
        choice,
      });
      applyMatch(next);
    } catch (error) {
      toast.error(getErrorMessageOrDefault(error, "Escolha não registrada"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MinigameArenaShell>
      {loading || !match ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="animate-spin text-primary" />
        </div>
      ) : (
        <RpsArena
          match={match}
          submitting={submitting}
          onChoose={submitChoice}
        />
      )}
    </MinigameArenaShell>
  );
}
