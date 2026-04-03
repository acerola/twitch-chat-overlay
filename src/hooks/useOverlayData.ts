import { useCallback, useEffect, useRef, useState } from "react";
import tmi from "tmi.js";
import {
  ALERT_AUTO_EXPIRE,
  ALERT_TTL_MS,
  BOT_USERNAMES,
  DEBUG_CHAT_FIXTURES,
  MAX_ALERTS,
  MAX_MESSAGES,
  TEST_ALERTS,
  TEST_MESSAGES,
} from "../config/overlay";
import { getDisplayName, getUsernameForFilter, pruneFeedByEntries } from "../lib/overlay-runtime";
import { createOverlayId, makeAlertText } from "../overlay-utils";
import type { ChatMessage, DebugMessageKind, FeedTrimEntry, OverlayAlert } from "../types/overlay";

interface UseOverlayDataOptions {
  channel: string | null;
  testMode: boolean;
}

interface UseOverlayDataResult {
  messages: ChatMessage[];
  alerts: OverlayAlert[];
  addAlert: (text: string, kind?: OverlayAlert["kind"]) => void;
  addDebugMessage: (kind: DebugMessageKind) => void;
  clearAllOverlayData: () => void;
  trimFeedEntries: (entriesToRemove: FeedTrimEntry[]) => void;
}

export function useOverlayData({ channel, testMode }: UseOverlayDataOptions): UseOverlayDataResult {
  const [messages, setMessages] = useState<ChatMessage[]>(testMode ? TEST_MESSAGES : []);
  const [alerts, setAlerts] = useState<OverlayAlert[]>(testMode ? TEST_ALERTS : []);

  const clientRef = useRef<tmi.Client | null>(null);
  const alertTimeoutsRef = useRef<Map<string, number>>(new Map());
  const debugSequencesRef = useRef<Record<DebugMessageKind, number>>({
    text: 1,
    text_long: 1,
    username_long: 1,
    emote_single: 1,
    emote_multi: 1,
    emote_text: 1,
    role_vip: 1,
    role_moderator: 1,
    role_subscriber: 1,
    role_broadcaster: 1,
    role_multi: 1,
    role_staff: 1,
    role_admin: 1,
    role_global_mod: 1,
    role_partner: 1,
    role_founder: 1,
    role_artist: 1,
    role_turbo: 1,
    powerup_gigantified: 1,
    powerup_effect: 1,
  });

  const addAlert = useCallback((text: string, kind: OverlayAlert["kind"] = "default") => {
    const id = createOverlayId();
    const alert: OverlayAlert = {
      id,
      text: makeAlertText(text),
      kind,
      timestamp: Date.now(),
    };

    setAlerts((previousAlerts) => [...previousAlerts, alert].slice(-MAX_ALERTS));

    if (ALERT_AUTO_EXPIRE) {
      const timeout = window.setTimeout(() => {
        setAlerts((previousAlerts) => previousAlerts.filter((item) => item.id !== id));
        alertTimeoutsRef.current.delete(id);
      }, ALERT_TTL_MS);

      alertTimeoutsRef.current.set(id, timeout);
    }
  }, []);

  const addDebugMessage = useCallback((kind: DebugMessageKind) => {
    const fixture = DEBUG_CHAT_FIXTURES[kind];
    if (!fixture) {
      return;
    }

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

    setMessages((previousMessages) => [...previousMessages, debugMessage].slice(-MAX_MESSAGES));
  }, []);

  const clearAllOverlayData = useCallback(() => {
    setMessages([]);
    setAlerts([]);
  }, []);

  const trimFeedEntries = useCallback((entriesToRemove: FeedTrimEntry[]) => {
    if (entriesToRemove.length === 0) {
      return;
    }

    setMessages((previousMessages) => {
      const next = pruneFeedByEntries(previousMessages, [], entriesToRemove);
      return next.messages;
    });

    setAlerts((previousAlerts) => {
      const next = pruneFeedByEntries([], previousAlerts, entriesToRemove);
      return next.alerts;
    });
  }, []);

  useEffect(() => {
    return () => {
      for (const timeout of alertTimeoutsRef.current.values()) {
        window.clearTimeout(timeout);
      }
      alertTimeoutsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (testMode || !channel) {
      return;
    }

    const client = new tmi.Client({
      channels: [channel],
      options: { skipMembership: true },
      connection: { reconnect: true, secure: true },
    });

    client.on("message", (_channel, tags, text, self) => {
      if (self) {
        return;
      }

      const usernameForFilter = getUsernameForFilter(tags);
      if (BOT_USERNAMES.has(usernameForFilter)) {
        return;
      }

      const messageId = typeof tags.id === "string" ? tags.id : createOverlayId();
      const message: ChatMessage = {
        id: messageId,
        username: getDisplayName(tags),
        text,
        color: tags.color ?? "#ffffff",
        badges: (tags.badges ?? {}) as Record<string, string>,
        emotes: (tags.emotes ?? {}) as Record<string, string[]>,
        timestamp: Date.now(),
      };

      setMessages((previousMessages) => {
        if (previousMessages.some((item) => item.id === message.id)) {
          return previousMessages;
        }

        return [...previousMessages, message].slice(-MAX_MESSAGES);
      });
    });

    client.on("cheer", (_channel, userstate) => {
      const name = getDisplayName(userstate);
      const bits = typeof userstate.bits === "string" ? userstate.bits : "0";
      addAlert(`${name} さんが ${bits} ビッツ応援`, "cheer");
    });

    client.on("subscription", (_channel, username) => {
      addAlert(`${username} さんがサブスクしました`, "subscribe");
    });

    client.on("resub", (_channel, username, _streakMonths, _message, userstate) => {
      const cumulativeMonths = Number(userstate["msg-param-cumulative-months"]) || 0;
      addAlert(`${username} さんが再サブスク（${cumulativeMonths} か月）`, "subscribe");
    });

    client.on("subgift", (_channel, username, _streakMonths, recipient) => {
      addAlert(`${username} さんが ${recipient} さんへギフトサブ`, "gift");
    });

    client.on("anonsubgift", (_channel, _streakMonths, recipient) => {
      addAlert(`匿名ユーザーが ${recipient} さんへギフトサブ`, "gift");
    });

    client.on("raided", (_channel, username, viewers) => {
      addAlert(`${username} さんが ${viewers} 人でレイド`, "raid");
    });

    clientRef.current = client;

    void client.connect().catch(() => {
      return;
    });

    return () => {
      const liveClient = clientRef.current;
      clientRef.current = null;
      if (liveClient) {
        void liveClient.disconnect();
      }
    };
  }, [addAlert, channel, testMode]);

  return {
    messages,
    alerts,
    addAlert,
    addDebugMessage,
    clearAllOverlayData,
    trimFeedEntries,
  };
}
