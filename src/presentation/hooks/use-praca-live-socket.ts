import { getPracaLiveWsUrl } from "@/infra/http/services/api/api-env";
import {
  parsePracaRealtimeEvent,
  type TPracaRealtimeEvent,
} from "@/presentation/components/praca/praca-realtime";
import { useEffect, useRef } from "react";

const PING_MS = 25_000;
const MAX_RETRY_MS = 15_000;
const DISCONNECTED_SYNC_MS = 10_000;

interface IUsePracaLiveSocketOptions {
  enabled: boolean;
  onEvent: (event: TPracaRealtimeEvent) => void;
  onReconnect?: () => void;
}

export function usePracaLiveSocket({
  enabled,
  onEvent,
  onReconnect,
}: IUsePracaLiveSocketOptions) {
  const onEventRef = useRef(onEvent);
  const onReconnectRef = useRef(onReconnect);
  onEventRef.current = onEvent;
  onReconnectRef.current = onReconnect;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let socket: WebSocket | null = null;
    let pingTimer: number | undefined;
    let retryTimer: number | undefined;
    let fallbackTimer: number | undefined;
    let attempt = 0;

    const clearPingAndRetry = () => {
      if (pingTimer !== undefined) window.clearInterval(pingTimer);
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      pingTimer = undefined;
      retryTimer = undefined;
    };

    const stopFallback = () => {
      if (fallbackTimer !== undefined) window.clearInterval(fallbackTimer);
      fallbackTimer = undefined;
    };

    const startFallback = () => {
      if (cancelled || fallbackTimer !== undefined) return;
      fallbackTimer = window.setInterval(() => {
        if (socket?.readyState === WebSocket.OPEN) return;
        onReconnectRef.current?.();
      }, DISCONNECTED_SYNC_MS);
    };

    const scheduleReconnect = () => {
      if (cancelled) return;
      const delay = Math.min(1000 * 2 ** attempt, MAX_RETRY_MS);
      attempt += 1;
      retryTimer = window.setTimeout(connect, delay);
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

    const connect = () => {
      if (cancelled) return;
      clearPingAndRetry();
      detachSocket();
      socket = new WebSocket(getPracaLiveWsUrl());

      socket.onopen = () => {
        attempt = 0;
        stopFallback();
        pingTimer = window.setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping" }));
          }
        }, PING_MS);
        onReconnectRef.current?.();
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
        const event = parsePracaRealtimeEvent(payload);
        if (event) onEventRef.current(event);
      };

      socket.onclose = () => {
        clearPingAndRetry();
        socket = null;
        startFallback();
        scheduleReconnect();
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      onReconnectRef.current?.();
      if (
        socket?.readyState === WebSocket.OPEN ||
        socket?.readyState === WebSocket.CONNECTING
      ) {
        return;
      }
      connect();
    };

    connect();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      clearPingAndRetry();
      stopFallback();
      detachSocket();
    };
  }, [enabled]);
}
