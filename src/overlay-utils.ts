import type { BadgeKind, BadgeMap, ChatListItem, ChatMessage, DebugChatFixture, MessageSegment, OverlayAlert, PowerUpKind } from "./types/overlay";

export type { BadgeKind, BadgeMap, ChatListItem, ChatMessage, DebugChatFixture, MessageSegment, OverlayAlert, PowerUpKind };

export function createOverlayId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function normalizeChannel(rawChannel: string | null): string | null {
  if (!rawChannel) {
    return null;
  }

  const trimmed = rawChannel.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,25}$/.test(trimmed)) {
    return null;
  }

  return trimmed;
}

export function resolveChannel(
  urlParam: string | null,
  envVar: string | null,
): string | null {
  const fromParam = normalizeChannel(urlParam);
  if (fromParam) {
    return fromParam;
  }
  return normalizeChannel(envVar);
}

export function parseMessageWithEmotes(text: string, emotes: Record<string, string[]>): MessageSegment[] {
  if (!emotes || Object.keys(emotes).length === 0) {
    return [{ type: "text", value: text }];
  }

  const emotePositions: Array<{ start: number; end: number; emoteId: string }> = [];

  for (const [emoteId, positions] of Object.entries(emotes)) {
    for (const position of positions) {
      const matched = /^(\d+)-(\d+)$/.exec(position);
      if (!matched) {
        continue;
      }

      const start = Number(matched[1]);
      const end = Number(matched[2]);
      if (Number.isNaN(start) || Number.isNaN(end) || start < 0 || end < start) {
        continue;
      }
      emotePositions.push({ start, end, emoteId });
    }
  }

  if (emotePositions.length === 0) {
    return [{ type: "text", value: text }];
  }

  emotePositions.sort((a, b) => a.start - b.start);

  const parts: MessageSegment[] = [];
  let cursor = 0;

  for (const emotePart of emotePositions) {
    if (emotePart.start > cursor) {
      parts.push({ type: "text", value: text.slice(cursor, emotePart.start) });
    }

    parts.push({
      type: "emote",
      emoteId: emotePart.emoteId,
      alt: text.slice(emotePart.start, emotePart.end + 1),
    });

    cursor = emotePart.end + 1;
  }

  if (cursor < text.length) {
    parts.push({ type: "text", value: text.slice(cursor) });
  }

  return parts;
}

export function isEmoteOnlyMessage(parts: MessageSegment[]): boolean {
  if (parts.length === 0) {
    return false;
  }

  let hasEmote = false;
  for (const part of parts) {
    if (part.type === "emote") {
      hasEmote = true;
      continue;
    }

    if (part.value.trim().length > 0) {
      return false;
    }
  }

  return hasEmote;
}

export function getRoleBadges(badges: BadgeMap): BadgeKind[] {
  const roles: BadgeKind[] = [];

  if (badges.broadcaster) roles.push("broadcaster");
  if (badges.staff) roles.push("staff");
  if (badges.admin) roles.push("admin");
  if (badges.global_mod) roles.push("global_mod");
  if (badges.moderator) roles.push("moderator");
  if (badges.vip) roles.push("vip");
  if (badges.partner) roles.push("partner");
  if (badges.artist) roles.push("artist");
  if (badges.founder) roles.push("founder");
  if (badges.subscriber) roles.push("subscriber");
  if (badges.turbo) roles.push("turbo");

  return roles;
}

export function makeAlertText(eventText: string): string {
  return eventText;
}
