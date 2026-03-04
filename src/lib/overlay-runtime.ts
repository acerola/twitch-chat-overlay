import type tmi from "tmi.js";
import type { ChatListItem, ChatMessage, FeedTrimEntry, OverlayAlert } from "../types/overlay";

export function getDisplayName(tags: tmi.ChatUserstate): string {
  const preferred = tags["display-name"];
  if (typeof preferred === "string" && preferred.length > 0) {
    return preferred;
  }

  if (typeof tags.username === "string" && tags.username.length > 0) {
    return tags.username;
  }

  return "不明ユーザー";
}

export function getUsernameForFilter(tags: tmi.ChatUserstate): string {
  const fromDisplayName = typeof tags["display-name"] === "string" ? tags["display-name"] : "";
  const fromUsername = typeof tags.username === "string" ? tags.username : "";
  return (fromUsername || fromDisplayName).toLowerCase();
}

export function parseEnvBoolean(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function buildFeedItems(messages: ChatMessage[], alerts: OverlayAlert[]): ChatListItem[] {
  const alertItems: ChatListItem[] = alerts.map((alert) => ({
    type: "alert",
    id: `alert-${alert.id}`,
    timestamp: alert.timestamp,
    alert,
  }));

  const messageItems: ChatListItem[] = messages.map((message) => ({
    type: "message",
    id: `message-${message.id}`,
    timestamp: message.timestamp,
    message,
  }));

  return [...alertItems, ...messageItems].sort((a, b) => a.timestamp - b.timestamp);
}

export function pruneFeedByEntries(
  messages: ChatMessage[],
  alerts: OverlayAlert[],
  entriesToRemove: FeedTrimEntry[],
): { messages: ChatMessage[]; alerts: OverlayAlert[] } {
  if (entriesToRemove.length === 0) {
    return { messages, alerts };
  }

  const messageIdsToRemove = new Set(
    entriesToRemove.filter((entry) => entry.type === "message").map((entry) => entry.id),
  );
  const alertIdsToRemove = new Set(entriesToRemove.filter((entry) => entry.type === "alert").map((entry) => entry.id));

  return {
    messages:
      messageIdsToRemove.size > 0
        ? messages.filter((message) => !messageIdsToRemove.has(message.id))
        : messages,
    alerts: alertIdsToRemove.size > 0 ? alerts.filter((alert) => !alertIdsToRemove.has(alert.id)) : alerts,
  };
}
