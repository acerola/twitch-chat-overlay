import { describe, expect, it, vi } from "vitest";
import {
  parseEventSubChatMessage,
  parseAutoRewardRedemption,
  parseCheerEvent,
  type EventSubChatMessagePayload,
  type EventSubAutoRewardPayload,
  type EventSubCheerPayload,
} from "./twitch-eventsub";

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function baseChatPayload(
  overrides: Partial<EventSubChatMessagePayload> = {},
): EventSubChatMessagePayload {
  return {
    broadcaster_user_id: "12345",
    broadcaster_user_login: "testchannel",
    broadcaster_user_name: "TestChannel",
    chatter_user_id: "67890",
    chatter_user_login: "testuser",
    chatter_user_name: "TestUser",
    message_id: "msg-001",
    message: {
      text: "Hello world",
      fragments: [{ type: "text", text: "Hello world" }],
    },
    message_type: "text",
    color: "#FF5500",
    badges: [
      { set_id: "subscriber", id: "12", info: "" },
    ],
    cheer: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// parseEventSubChatMessage
// ---------------------------------------------------------------------------

describe("parseEventSubChatMessage", () => {
  it("parses a regular text message", () => {
    const result = parseEventSubChatMessage(baseChatPayload());

    expect(result.type).toBe("message");
    if (result.type !== "message") throw new Error("unreachable");

    expect(result.message.username).toBe("testuser");
    expect(result.message.text).toBe("Hello world");
    expect(result.message.color).toBe("#FF5500");
    expect(result.message.badges).toEqual({ subscriber: "12" });
    expect(result.message.powerUp).toBeUndefined();
  });

  it("sets powerUp to gigantified_emote for power_ups_gigantified_emote message_type", () => {
    const result = parseEventSubChatMessage(
      baseChatPayload({
        message_type: "power_ups_gigantified_emote",
        message: {
          text: "Kappa",
          fragments: [
            {
              type: "emote",
              text: "Kappa",
              emote: { id: "25", emote_set_id: "0" },
            },
          ],
        },
      }),
    );

    expect(result.type).toBe("message");
    if (result.type !== "message") throw new Error("unreachable");

    expect(result.message.powerUp).toBe("gigantified_emote");
  });

  it("sets powerUp to message_effect for power_ups_message_effect message_type", () => {
    const result = parseEventSubChatMessage(
      baseChatPayload({
        message_type: "power_ups_message_effect",
      }),
    );

    expect(result.type).toBe("message");
    if (result.type !== "message") throw new Error("unreachable");

    expect(result.message.powerUp).toBe("message_effect");
  });

  it("returns message_with_alert for cheer messages", () => {
    const result = parseEventSubChatMessage(
      baseChatPayload({
        cheer: { bits: 500 },
        message: {
          text: "Cheer500 Great stream!",
          fragments: [
            { type: "cheermote", text: "Cheer500", cheermote: { prefix: "Cheer", bits: 500, tier: 5 } },
            { type: "text", text: " Great stream!" },
          ],
        },
      }),
    );

    expect(result.type).toBe("message_with_alert");
    if (result.type !== "message_with_alert") throw new Error("unreachable");

    expect(result.message.text).toBe("Cheer500 Great stream!");
    expect(result.alert.kind).toBe("cheer");
    expect(result.alert.text).toContain("testuser");
    expect(result.alert.text).toContain("500");
  });

  it("converts badges array to Record<string, string>", () => {
    const result = parseEventSubChatMessage(
      baseChatPayload({
        badges: [
          { set_id: "moderator", id: "1", info: "" },
          { set_id: "subscriber", id: "24", info: "" },
          { set_id: "vip", id: "1", info: "" },
        ],
      }),
    );

    if (result.type !== "message") throw new Error("unreachable");

    expect(result.message.badges).toEqual({
      moderator: "1",
      subscriber: "24",
      vip: "1",
    });
  });

  it("builds emotes record from emote fragments with character positions", () => {
    const result = parseEventSubChatMessage(
      baseChatPayload({
        message: {
          text: "Hello Kappa GG",
          fragments: [
            { type: "text", text: "Hello " },
            {
              type: "emote",
              text: "Kappa",
              emote: { id: "25", emote_set_id: "0" },
            },
            { type: "text", text: " GG" },
          ],
        },
      }),
    );

    if (result.type !== "message") throw new Error("unreachable");

    // "Kappa" starts at index 6, ends at index 10 → "6-10"
    expect(result.message.emotes).toEqual({ "25": ["6-10"] });
  });

  it("handles messages with no badges", () => {
    const result = parseEventSubChatMessage(
      baseChatPayload({ badges: [] }),
    );

    if (result.type !== "message") throw new Error("unreachable");

    expect(result.message.badges).toEqual({});
  });

  it("defaults color to empty string when not provided", () => {
    const result = parseEventSubChatMessage(
      baseChatPayload({ color: "" }),
    );

    if (result.type !== "message") throw new Error("unreachable");

    expect(result.message.color).toBe("");
  });

  it("handles multiple emote fragments", () => {
    const result = parseEventSubChatMessage(
      baseChatPayload({
        message: {
          text: "Kappa LUL Kappa",
          fragments: [
            { type: "emote", text: "Kappa", emote: { id: "25", emote_set_id: "0" } },
            { type: "text", text: " " },
            { type: "emote", text: "LUL", emote: { id: "425618", emote_set_id: "0" } },
            { type: "text", text: " " },
            { type: "emote", text: "Kappa", emote: { id: "25", emote_set_id: "0" } },
          ],
        },
      }),
    );

    if (result.type !== "message") throw new Error("unreachable");

    // "Kappa" at 0-4, "LUL" at 6-8, "Kappa" at 10-14
    expect(result.message.emotes["25"]).toEqual(["0-4", "10-14"]);
    expect(result.message.emotes["425618"]).toEqual(["6-8"]);
  });
});

// ---------------------------------------------------------------------------
// parseAutoRewardRedemption
// ---------------------------------------------------------------------------

describe("parseAutoRewardRedemption", () => {
  it("returns celebration data when reward type is celebration", () => {
    const payload: EventSubAutoRewardPayload = {
      broadcaster_user_id: "12345",
      broadcaster_user_login: "testchannel",
      broadcaster_user_name: "TestChannel",
      user_id: "67890",
      user_login: "testuser",
      user_name: "TestUser",
      reward: {
        type: "celebration",
        cost: 150,
      },
    };

    const result = parseAutoRewardRedemption(payload);

    expect(result).toEqual({
      kind: "celebration",
      username: "testuser",
      bits: 150,
    });
  });

  it("returns null for non-celebration reward types", () => {
    const payload: EventSubAutoRewardPayload = {
      broadcaster_user_id: "12345",
      broadcaster_user_login: "testchannel",
      broadcaster_user_name: "TestChannel",
      user_id: "67890",
      user_login: "testuser",
      user_name: "TestUser",
      reward: {
        type: "single_message_bypass_sub_mode",
        cost: 500,
      },
    };

    const result = parseAutoRewardRedemption(payload);

    expect(result).toBeNull();
  });

  it("returns null for random_sub_emote_unlock reward", () => {
    const payload: EventSubAutoRewardPayload = {
      broadcaster_user_id: "12345",
      broadcaster_user_login: "testchannel",
      broadcaster_user_name: "TestChannel",
      user_id: "67890",
      user_login: "testuser",
      user_name: "TestUser",
      reward: {
        type: "random_sub_emote_unlock",
        cost: 250,
      },
    };

    const result = parseAutoRewardRedemption(payload);

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// parseCheerEvent
// ---------------------------------------------------------------------------

function baseCheerPayload(
  overrides: Partial<EventSubCheerPayload> = {},
): EventSubCheerPayload {
  return {
    broadcaster_user_id: "12345",
    broadcaster_user_login: "testchannel",
    broadcaster_user_name: "TestChannel",
    is_anonymous: false,
    user_id: "67890",
    user_login: "testuser",
    user_name: "TestUser",
    message: "This is a test event.",
    bits: 100,
    ...overrides,
  };
}

describe("parseCheerEvent", () => {
  it("parses a standard cheer event", () => {
    const result = parseCheerEvent(baseCheerPayload());

    expect(result).toEqual({
      username: "testuser",
      bits: 100,
      message: "This is a test event.",
    });
  });

  it("returns Anonymous username for anonymous cheers", () => {
    const result = parseCheerEvent(
      baseCheerPayload({
        is_anonymous: true,
        user_id: null,
        user_login: null,
        user_name: null,
      }),
    );

    expect(result.username).toBe("Anonymous");
    expect(result.bits).toBe(100);
  });

  it("handles small bit amounts", () => {
    const result = parseCheerEvent(baseCheerPayload({ bits: 1 }));

    expect(result.bits).toBe(1);
  });

  it("handles large bit amounts", () => {
    const result = parseCheerEvent(baseCheerPayload({ bits: 100000 }));

    expect(result.bits).toBe(100000);
  });

  it("preserves the cheer message", () => {
    const result = parseCheerEvent(
      baseCheerPayload({ message: "Cheer500 Great stream!" }),
    );

    expect(result.message).toBe("Cheer500 Great stream!");
  });

  it("handles empty message", () => {
    const result = parseCheerEvent(baseCheerPayload({ message: "" }));

    expect(result.message).toBe("");
  });
});
