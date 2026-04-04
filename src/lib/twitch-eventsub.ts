import { createOverlayId } from "../overlay-utils";
import type { ChatMessage, OverlayAlert, PowerUpKind } from "../types/overlay";

// ---------------------------------------------------------------------------
// EventSub payload types
// ---------------------------------------------------------------------------

export interface EventSubBadge {
  set_id: string;
  id: string;
  info: string;
}

export interface EventSubEmoteData {
  id: string;
  emote_set_id: string;
}

export interface EventSubCheermoteData {
  prefix: string;
  bits: number;
  tier: number;
}

export type EventSubFragment =
  | { type: "text"; text: string }
  | { type: "emote"; text: string; emote: EventSubEmoteData }
  | { type: "cheermote"; text: string; cheermote: EventSubCheermoteData }
  | { type: "mention"; text: string };

export interface EventSubChatMessagePayload {
  broadcaster_user_id: string;
  broadcaster_user_login: string;
  broadcaster_user_name: string;
  chatter_user_id: string;
  chatter_user_login: string;
  chatter_user_name: string;
  message_id: string;
  message: {
    text: string;
    fragments: EventSubFragment[];
  };
  message_type: string;
  color: string;
  badges: EventSubBadge[];
  cheer: { bits: number } | null;
}

export interface EventSubAutoRewardPayload {
  broadcaster_user_id: string;
  broadcaster_user_login: string;
  broadcaster_user_name: string;
  user_id: string;
  user_login: string;
  user_name: string;
  reward: {
    type: string;
    cost: number;
  };
}

export interface EventSubCheerPayload {
  broadcaster_user_id: string;
  broadcaster_user_login: string;
  broadcaster_user_name: string;
  is_anonymous: boolean;
  user_id: string | null;
  user_login: string | null;
  user_name: string | null;
  message: string;
  bits: number;
}

// ---------------------------------------------------------------------------
// Parse result types
// ---------------------------------------------------------------------------

export type ParsedChatEvent =
  | { type: "message"; message: ChatMessage }
  | { type: "message_with_alert"; message: ChatMessage; alert: { text: string; kind: OverlayAlert["kind"] } }
  | { type: "skip" };

// ---------------------------------------------------------------------------
// Pure parsers (testable, no side effects)
// ---------------------------------------------------------------------------

const POWER_UP_MAP: Record<string, PowerUpKind> = {
  power_ups_gigantified_emote: "gigantified_emote",
  power_ups_message_effect: "message_effect",
};

function badgesArrayToRecord(badges: EventSubBadge[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const badge of badges) {
    result[badge.set_id] = badge.id;
  }
  return result;
}

function fragmentsToEmotes(fragments: EventSubFragment[]): Record<string, string[]> {
  const emotes: Record<string, string[]> = {};
  let cursor = 0;

  for (const fragment of fragments) {
    const textLen = fragment.text.length;

    if (fragment.type === "emote") {
      const start = cursor;
      const end = cursor + textLen - 1;
      const position = `${start}-${end}`;

      const id = fragment.emote.id;
      if (!emotes[id]) {
        emotes[id] = [];
      }
      emotes[id]!.push(position);
    }

    cursor += textLen;
  }

  return emotes;
}

export function parseEventSubChatMessage(
  payload: EventSubChatMessagePayload,
): ParsedChatEvent {
  const powerUp = POWER_UP_MAP[payload.message_type];

  const message: ChatMessage = {
    id: createOverlayId(),
    username: payload.chatter_user_login,
    text: payload.message.text,
    color: payload.color,
    badges: badgesArrayToRecord(payload.badges),
    emotes: fragmentsToEmotes(payload.message.fragments),
    timestamp: Date.now(),
    ...(powerUp ? { powerUp } : {}),
  };

  if (payload.cheer) {
    return {
      type: "message_with_alert",
      message,
      alert: {
        text: `${payload.chatter_user_login} cheered ${payload.cheer.bits} bits!`,
        kind: "cheer",
      },
    };
  }

  return { type: "message", message };
}

export function parseAutoRewardRedemption(
  payload: EventSubAutoRewardPayload,
): { kind: "celebration"; username: string; bits: number } | null {
  if (payload.reward.type !== "celebration") {
    return null;
  }

  return {
    kind: "celebration",
    username: payload.user_login,
    bits: payload.reward.cost,
  };
}

export function parseCheerEvent(
  payload: EventSubCheerPayload,
): { username: string; bits: number; message: string } {
  const username = payload.is_anonymous
    ? "Anonymous"
    : (payload.user_login ?? "Anonymous");

  return {
    username,
    bits: payload.bits,
    message: payload.message,
  };
}

// ---------------------------------------------------------------------------
// WebSocket client (side-effectful)
// ---------------------------------------------------------------------------

export interface SubscriptionStatus {
  type: string;
  ok: boolean;
  error?: string;
}

export interface EventSubClientOptions {
  accessToken: string;
  clientId: string;
  broadcasterId: string;
  userId: string;
  onChatMessage: (event: ParsedChatEvent) => void;
  onCheer: (data: { username: string; bits: number; message: string }) => void;
  onCelebration: (data: { username: string; bits: number }) => void;
  onConnectionChange: (connected: boolean) => void;
  onSubscriptionStatus?: (statuses: SubscriptionStatus[]) => void;
}

interface EventSubMessage {
  metadata: {
    message_id: string;
    message_type: string;
    message_timestamp: string;
  };
  payload: {
    session?: {
      id: string;
      keepalive_timeout_seconds: number;
      reconnect_url?: string;
    };
    subscription?: {
      type: string;
    };
    event?: Record<string, unknown>;
  };
}

async function subscribeToEventSub(
  sessionId: string,
  subscriptionType: string,
  version: string,
  condition: Record<string, string>,
  accessToken: string,
  clientId: string,
): Promise<SubscriptionStatus> {
  const response = await fetch(
    "https://api.twitch.tv/helix/eventsub/subscriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-Id": clientId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: subscriptionType,
        version,
        condition,
        transport: {
          method: "websocket",
          session_id: sessionId,
        },
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    const msg = (() => { try { return JSON.parse(text).message; } catch { return text; } })();
    console.error(`[EventSub] subscription failed: ${subscriptionType} (${response.status}): ${msg}`);
    return { type: subscriptionType, ok: false, error: msg };
  }

  console.log(`[EventSub] subscribed: ${subscriptionType}`);
  return { type: subscriptionType, ok: true };
}

export function createEventSubClient(options: EventSubClientOptions): {
  connect: () => void;
  disconnect: () => void;
} {
  let ws: WebSocket | null = null;
  let disposed = false;
  let reconnectUrl: string | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  function connect() {
    if (disposed) {
      console.debug("[EventSub] connect() skipped — disposed");
      return;
    }

    const url =
      reconnectUrl ??
      import.meta.env.VITE_EVENTSUB_URL ??
      "wss://eventsub.wss.twitch.tv/ws";
    reconnectUrl = null;

    console.debug("[EventSub] connecting to", url);
    ws = new WebSocket(url);

    ws.onopen = () => {
      console.debug("[EventSub] connected");
      options.onConnectionChange(true);
    };

    ws.onmessage = (event: MessageEvent) => {
      let data: EventSubMessage;
      try {
        data = JSON.parse(event.data as string) as EventSubMessage;
      } catch {
        return;
      }

      handleMessage(data);
    };

    ws.onclose = (e) => {
      console.debug("[EventSub] closed — code:", e.code, "disposed:", disposed);
      options.onConnectionChange(false);

      if (!disposed) {
        reconnectTimer = setTimeout(() => {
          connect();
        }, 3000);
      }
    };

    ws.onerror = (e) => {
      console.debug("[EventSub] error:", e);
      // onclose will fire after onerror, handling reconnect
    };
  }

  function handleMessage(data: EventSubMessage) {
    const messageType = data.metadata.message_type;

    switch (messageType) {
      case "session_welcome": {
        const sessionId = data.payload.session?.id;
        if (!sessionId) break;

        // Mock mode: skip subscription calls — the mock server pushes events to all clients
        if (import.meta.env.VITE_EVENTSUB_URL) break;

        void (async () => {
          const statuses = await Promise.all([
            subscribeToEventSub(
              sessionId, "channel.chat.message", "1",
              { broadcaster_user_id: options.broadcasterId, user_id: options.userId },
              options.accessToken, options.clientId,
            ),
            subscribeToEventSub(
              sessionId, "channel.cheer", "1",
              { broadcaster_user_id: options.broadcasterId },
              options.accessToken, options.clientId,
            ),
            subscribeToEventSub(
              sessionId, "channel.channel_points_automatic_reward_redemption.add", "1",
              { broadcaster_user_id: options.broadcasterId },
              options.accessToken, options.clientId,
            ),
          ]);
          options.onSubscriptionStatus?.(statuses);
        })();

        break;
      }

      case "session_reconnect": {
        const newUrl = data.payload.session?.reconnect_url;
        if (newUrl) {
          reconnectUrl = newUrl;
        }
        break;
      }

      case "notification": {
        const subType = data.payload.subscription?.type;
        const event = data.payload.event;
        if (!event) break;

        if (subType === "channel.chat.message") {
          const parsed = parseEventSubChatMessage(
            event as unknown as EventSubChatMessagePayload,
          );
          options.onChatMessage(parsed);
        } else if (subType === "channel.cheer") {
          const result = parseCheerEvent(
            event as unknown as EventSubCheerPayload,
          );
          options.onCheer(result);
        } else if (
          subType ===
          "channel.channel_points_automatic_reward_redemption.add"
        ) {
          const result = parseAutoRewardRedemption(
            event as unknown as EventSubAutoRewardPayload,
          );
          if (result) {
            options.onCelebration({
              username: result.username,
              bits: result.bits,
            });
          }
        }
        break;
      }

      case "session_keepalive":
        // No action needed, connection is alive
        break;
    }
  }

  function disconnect() {
    console.debug("[EventSub] disconnect() called");
    disposed = true;

    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (ws) {
      ws.onclose = null;
      ws.close();
      ws = null;
    }

    options.onConnectionChange(false);
  }

  return { connect, disconnect };
}
