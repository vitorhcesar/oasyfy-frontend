import { getMinigameLobbyWsUrl } from "@/infra/http/services/api/api-env";
import type { TMinigameLobbyEvent } from "@/infra/http/services/api/modules/types/minigame.types";
import { useEffect, useRef } from "react";

const PING_MS = 25_000;
const MAX_RETRY_MS = 15_000;
const INBOX_SYNC_MS = 2_000;

interface IUseMinigameLobbySocketOptions {
  enabled: boolean;
  onEvent: (event: TMinigameLobbyEvent) => void;
  onSync: () => void;
}

function parseLobbyEvent(payload: unknown): TMinigameLobbyEvent | null {
  if (!payload || typeof payload !== "object" || !("type" in payload)) {
    return null;
  }
  const type = (payload as { type?: unknown }).type;
  if (
    type === "challenge.incoming" ||
    type === "challenge.updated" ||
    type === "challenge.accepted" ||
    type === "match.finished" ||
    type === "match.active" ||
    type === "pong"
  ) {
    return payload as TMinigameLobbyEvent;
  }
  return null;
}

export function useMinigameLobbySocket({
  enabled,
  onEvent,
  onSync,
}: IUseMinigameLobbySocketOptions) {
  const onEventRef = useRef(onEvent);
  const onSyncRef = useRef(onSync);
  onEventRef.current = onEvent;
  onSyncRef.current = onSync;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let socket: WebSocket | null = null;
    let pingTimer: number | undefined;
    let retryTimer: number | undefined;
    let attempt = 0;

    const clearPingAndRetry = () => {
      if (pingTimer !== undefined) window.clearInterval(pingTimer);
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      pingTimer = undefined;
      retryTimer = undefined;
    };

    const detachSocket = () => {
      if (!socket) return;
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      if (socket.readyState < WebSocket.CLOSING) {
        socket.close();
      }
      socket = null;
    };

    const scheduleReconnect = () => {
      if (cancelled) return;
      const delay = Math.min(1000 * 2 ** attempt, MAX_RETRY_MS);
      attempt += 1;
      retryTimer = window.setTimeout(connect, delay);
    };

    const connect = () => {
      if (cancelled) return;
      clearPingAndRetry();
      detachSocket();
      socket = new WebSocket(getMinigameLobbyWsUrl());

      socket.onopen = () => {
        attempt = 0;
        pingTimer = window.setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping" }));
          }
        }, PING_MS);
        onSyncRef.current();
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
        const event = parseLobbyEvent(payload);
        if (!event || event.type === "pong") return;
        onEventRef.current(event);
        onSyncRef.current();
      };

      socket.onclose = () => {
        clearPingAndRetry();
        socket = null;
        scheduleReconnect();
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      onSyncRef.current();
      if (
        socket?.readyState === WebSocket.OPEN ||
        socket?.readyState === WebSocket.CONNECTING
      ) {
        return;
      }
      connect();
    };

    connect();
    onSyncRef.current();
    const syncTimer = window.setInterval(() => onSyncRef.current(), INBOX_SYNC_MS);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      if (syncTimer !== undefined) window.clearInterval(syncTimer);
      clearPingAndRetry();
      detachSocket();
    };
  }, [enabled]);
}
