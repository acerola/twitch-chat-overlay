export type BadgeMap = Record<string, string>;

export type BadgeKind =
  | "broadcaster"
  | "moderator"
  | "vip"
  | "subscriber"
  | "founder"
  | "staff"
  | "admin"
  | "global_mod"
  | "partner"
  | "artist"
  | "turbo";

export type PowerUpKind = "gigantified_emote" | "message_effect";

export type AlertKind = "cheer" | "subscribe" | "gift" | "raid" | "celebration" | "redemption" | "default";

export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  color: string;
  badges: BadgeMap;
  emotes: Record<string, string[]>;
  timestamp: number;
  powerUp?: PowerUpKind;
}

export interface OverlayAlert {
  id: string;
  text: string;
  kind?: AlertKind;
  timestamp: number;
}

export type MessageSegment =
  | { type: "text"; value: string }
  | { type: "emote"; emoteId: string; alt: string };

export type DebugChatFixture = Omit<ChatMessage, "id" | "timestamp">;
export type DebugMessageKind =
  | "text"
  | "text_long"
  | "username_long"
  | "emote_single"
  | "emote_multi"
  | "emote_text"
  | "role_vip"
  | "role_moderator"
  | "role_subscriber"
  | "role_broadcaster"
  | "role_multi"
  | "role_staff"
  | "role_admin"
  | "role_global_mod"
  | "role_partner"
  | "role_founder"
  | "role_artist"
  | "role_turbo"
  | "powerup_gigantified"
  | "powerup_effect";

export type ChatListItem =
  | { type: "alert"; id: string; timestamp: number; alert: OverlayAlert }
  | { type: "message"; id: string; timestamp: number; message: ChatMessage };

export interface FeedTrimEntry {
  type: "message" | "alert";
  id: string;
}
