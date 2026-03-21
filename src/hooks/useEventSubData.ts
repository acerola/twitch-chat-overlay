import { useCallback, useEffect, useRef, useState } from "react";
import {
  ALERT_AUTO_EXPIRE,
  ALERT_TTL_MS,
  BOT_USERNAMES,
  MAX_ALERTS,
  MAX_MESSAGES,
} from "../config/overlay";
import { createOverlayId, makeAlertText } from "../overlay-utils";
import { createEventSubClient } from "../lib/twitch-eventsub";
import type { ChatMessage, OverlayAlert } from "../types/overlay";

interface UseEventSubDataOptions {
  accessToken: string;
  clientId: string;
  broadcasterId: string;
  userId: string;
}

interface UseEventSubDataResult {
  messages: ChatMessage[];
  alerts: OverlayAlert[];
  connected: boolean;
}

export function useEventSubData({
  accessToken,
  clientId,
  broadcasterId,
  userId,
}: UseEventSubDataOptions): UseEventSubDataResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [alerts, setAlerts] = useState<OverlayAlert[]>([]);
  const [connected, setConnected] = useState(false);
  const alertTimeoutsRef = useRef<Map<string, number>>(new Map());

  // Guard against empty params (hook is always called due to React rules)
  const enabled = Boolean(accessToken && clientId && broadcasterId && userId);

  const addAlert = useCallback(
    (text: string, kind: OverlayAlert["kind"] = "default") => {
      const id = createOverlayId();
      const alert: OverlayAlert = {
        id,
        text: makeAlertText(text),
        kind,
        timestamp: Date.now(),
      };

      setAlerts((prev) => [...prev, alert].slice(-MAX_ALERTS));

      if (ALERT_AUTO_EXPIRE) {
        const timeout = window.setTimeout(() => {
          setAlerts((prev) => prev.filter((item) => item.id !== id));
          alertTimeoutsRef.current.delete(id);
        }, ALERT_TTL_MS);

        alertTimeoutsRef.current.set(id, timeout);
      }
    },
    [],
  );

  useEffect(() => {
    if (!enabled) return;

    const client = createEventSubClient({
      accessToken,
      clientId,
      broadcasterId,
      userId,
      onChatMessage: (event) => {
        if (event.type === "skip") return;

        const msg = event.message;
        const username = msg.username.toLowerCase();
        if (BOT_USERNAMES.has(username)) return;

        setMessages((prev) => {
          if (prev.some((item) => item.id === msg.id)) return prev;
          return [...prev, msg].slice(-MAX_MESSAGES);
        });

        if (event.type === "message_with_alert") {
          addAlert(event.alert.text, event.alert.kind);
        }
      },
      onCelebration: (data) => {
        addAlert(
          `${data.username} さんが ${data.bits} ビッツでセレブレーション`,
          "celebration",
        );
      },
      onConnectionChange: setConnected,
    });

    client.connect();

    return () => {
      client.disconnect();
      for (const timeout of alertTimeoutsRef.current.values()) {
        window.clearTimeout(timeout);
      }
      alertTimeoutsRef.current.clear();
    };
  }, [accessToken, clientId, broadcasterId, userId, addAlert, enabled]);

  return { messages, alerts, connected };
}
