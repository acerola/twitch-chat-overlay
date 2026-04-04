import { useCallback, useEffect, useRef, useState } from "react";
import {
  ALERT_AUTO_EXPIRE,
  ALERT_TTL_MS,
  BOT_USERNAMES,
  DEBUG_CHAT_FIXTURES,
  MAX_ALERTS,
  MAX_MESSAGES,
} from "../config/overlay";
import { pruneFeedByEntries } from "../lib/overlay-runtime";
import { createOverlayId, makeAlertText } from "../overlay-utils";
import { createEventSubClient } from "../lib/twitch-eventsub";
import type { ChatMessage, DebugMessageKind, FeedTrimEntry, OverlayAlert } from "../types/overlay";

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
  addAlert: (text: string, kind?: OverlayAlert["kind"]) => void;
  addDebugMessage: (kind: DebugMessageKind) => void;
  clearAllOverlayData: () => void;
  trimFeedEntries: (entriesToRemove: FeedTrimEntry[]) => void;
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

  const debugSequencesRef = useRef<Record<DebugMessageKind, number>>({
    text: 1, text_long: 1, username_long: 1,
    emote_single: 1, emote_multi: 1, emote_text: 1,
    role_vip: 1, role_moderator: 1, role_subscriber: 1, role_broadcaster: 1,
    role_multi: 1, role_staff: 1, role_admin: 1, role_global_mod: 1,
    role_partner: 1, role_founder: 1, role_artist: 1, role_turbo: 1,
    powerup_gigantified: 1, powerup_effect: 1,
  });

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

  const addDebugMessage = useCallback((kind: DebugMessageKind) => {
    const fixture = DEBUG_CHAT_FIXTURES[kind];
    if (!fixture) return;

    const sequence = debugSequencesRef.current[kind] ?? 1;
    debugSequencesRef.current[kind] = sequence + 1;

    const isRoleKind = kind.startsWith("role_");
    const resolvedText =
      kind === "text"
        ? `デバッグテキスト ${sequence}：表示確認メッセージです`
        : kind === "text_long"
          ? `長文テキスト ${sequence}：配信オーバーレイの折り返し確認のために、あえて非常に長い文章を入れています。表示領域に対して文字がどのように収まるか、末尾の見え方や行間をチェックしてください。さらに同じ趣旨の文を追加して、3行を超えたときに省略表示が確実に発生するかを確認します。最後にもう一文追加して、レイアウト崩れや改行位置の不自然さがないかも確認してください。`
          : kind === "username_long"
            ? `長いユーザー名テスト ${sequence}：名前ピルの省略表示確認メッセージです`
            : fixture.text;
    const resolvedUsername =
      kind === "text"
        ? `テストユーザー${((sequence - 1) % 3) + 1}`
        : kind === "text_long"
          ? `長文ユーザー${((sequence - 1) % 3) + 1}`
          : kind === "username_long"
            ? `これは非常に長いユーザー名テスト${sequence}です省略表示を確認します`
            : isRoleKind
              ? `${fixture.username}${sequence}`
              : `${fixture.username}${((sequence - 1) % 4) + 1}`;

    const debugMessage: ChatMessage = {
      ...fixture,
      username: resolvedUsername,
      text: resolvedText,
      id: createOverlayId(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, debugMessage].slice(-MAX_MESSAGES));
  }, []);

  const clearAllOverlayData = useCallback(() => {
    setMessages([]);
    setAlerts([]);
  }, []);

  const trimFeedEntries = useCallback((entriesToRemove: FeedTrimEntry[]) => {
    if (entriesToRemove.length === 0) return;
    setMessages((prev) => pruneFeedByEntries(prev, [], entriesToRemove).messages);
    setAlerts((prev) => pruneFeedByEntries([], prev, entriesToRemove).alerts);
  }, []);

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
      onCheer: (data) => {
        addAlert(
          `${data.username} cheered ${data.bits} bits!`,
          "cheer",
        );
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

  return { messages, alerts, connected, addAlert, addDebugMessage, clearAllOverlayData, trimFeedEntries };
}
