import { describe, expect, it } from "vitest";
import type tmi from "tmi.js";
import {
  buildFeedItems,
  getDisplayName,
  getUsernameForFilter,
  parseEnvBoolean,
  pruneFeedByEntries,
} from "./overlay-runtime";
import type { ChatMessage, OverlayAlert } from "../types/overlay";

function createMessage(id: string): ChatMessage {
  return {
    id,
    username: `u-${id}`,
    text: "message",
    color: "#ffffff",
    badges: {},
    emotes: {},
    timestamp: Date.now(),
  };
}

function createAlert(id: string): OverlayAlert {
  return {
    id,
    text: "alert",
    kind: "default",
    timestamp: Date.now(),
  };
}

describe("pruneFeedByEntries", () => {
  it("removes both message and alert entries by id", () => {
    const messages = [createMessage("m-1"), createMessage("m-2"), createMessage("m-3")];
    const alerts = [createAlert("a-1"), createAlert("a-2")];

    const result = pruneFeedByEntries(messages, alerts, [
      { type: "message", id: "m-1" },
      { type: "alert", id: "a-2" },
    ]);

    expect(result.messages.map((item) => item.id)).toEqual(["m-2", "m-3"]);
    expect(result.alerts.map((item) => item.id)).toEqual(["a-1"]);
  });

  it("keeps arrays unchanged when there is nothing to remove", () => {
    const messages = [createMessage("m-1")];
    const alerts = [createAlert("a-1")];

    const result = pruneFeedByEntries(messages, alerts, []);

    expect(result.messages).toEqual(messages);
    expect(result.alerts).toEqual(alerts);
  });
});

describe("overlay-runtime helpers", () => {
  it("prefers display name and falls back safely", () => {
    expect(getDisplayName({ "display-name": "Mira", username: "mira_login" } as tmi.ChatUserstate)).toBe("Mira");
    expect(getDisplayName({ username: "mira_login" } as tmi.ChatUserstate)).toBe("mira_login");
    expect(getDisplayName({} as tmi.ChatUserstate)).toBe("不明ユーザー");
  });

  it("builds lowercase usernames for bot filtering", () => {
    expect(getUsernameForFilter({ username: "NightBot", "display-name": "NightBot" } as tmi.ChatUserstate)).toBe(
      "nightbot",
    );
    expect(getUsernameForFilter({ "display-name": "OnlyDisplay" } as tmi.ChatUserstate)).toBe("onlydisplay");
  });

  it("parses truthy env flags", () => {
    expect(parseEnvBoolean("1")).toBe(true);
    expect(parseEnvBoolean(" YES ")).toBe(true);
    expect(parseEnvBoolean("on")).toBe(true);
    expect(parseEnvBoolean(undefined)).toBe(false);
    expect(parseEnvBoolean("0")).toBe(false);
    expect(parseEnvBoolean("false")).toBe(false);
  });

  it("merges alerts and messages by timestamp order", () => {
    const messages = [
      { ...createMessage("m-1"), timestamp: 20 },
      { ...createMessage("m-2"), timestamp: 40 },
    ];
    const alerts = [{ ...createAlert("a-1"), timestamp: 10 }];

    const items = buildFeedItems(messages, alerts);

    expect(items.map((item) => item.id)).toEqual(["alert-a-1", "message-m-1", "message-m-2"]);
    expect(items.map((item) => item.type)).toEqual(["alert", "message", "message"]);
  });
});
