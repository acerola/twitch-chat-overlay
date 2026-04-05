import { describe, expect, it, vi } from "vitest";
import {
  parseEventSubChatMessage,
  parseAutoRewardRedemption,
  parseCheerEvent,
  parseSubscribeEvent,
  parseSubscriptionGiftEvent,
  parseRaidEvent,
  parseChannelPointRedemption,
  type EventSubChatMessagePayload,
  type EventSubAutoRewardPayload,
  type EventSubCheerPayload,
  type EventSubSubscribePayload,
  type EventSubSubscriptionGiftPayload,
  type EventSubRaidPayload,
  type EventSubChannelPointRedemptionPayload,
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

    expect(result.message.username).toBe("TestUser");
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
    expect(result.alert.text).toContain("TestUser");
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

    expect(result.username).toBe("匿名");
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

// ---------------------------------------------------------------------------
// parseSubscribeEvent
// ---------------------------------------------------------------------------

function baseSubscribePayload(
  overrides: Partial<EventSubSubscribePayload> = {},
): EventSubSubscribePayload {
  return {
    user_id: "67890",
    user_login: "testuser",
    user_name: "TestUser",
    broadcaster_user_id: "12345",
    broadcaster_user_login: "testchannel",
    broadcaster_user_name: "TestChannel",
    tier: "1000",
    is_gift: false,
    ...overrides,
  };
}

describe("parseSubscribeEvent", () => {
  it("parses a standard subscribe event", () => {
    const result = parseSubscribeEvent(baseSubscribePayload());

    expect(result).toEqual({
      username: "TestUser",
      tier: "1000",
      isGift: false,
    });
  });

  it("identifies gift subscriptions", () => {
    const result = parseSubscribeEvent(baseSubscribePayload({ is_gift: true }));

    expect(result.isGift).toBe(true);
  });

  it("handles tier 2 and tier 3 subs", () => {
    expect(parseSubscribeEvent(baseSubscribePayload({ tier: "2000" })).tier).toBe("2000");
    expect(parseSubscribeEvent(baseSubscribePayload({ tier: "3000" })).tier).toBe("3000");
  });
});

// ---------------------------------------------------------------------------
// parseSubscriptionGiftEvent
// ---------------------------------------------------------------------------

function baseGiftPayload(
  overrides: Partial<EventSubSubscriptionGiftPayload> = {},
): EventSubSubscriptionGiftPayload {
  return {
    user_id: "67890",
    user_login: "testuser",
    user_name: "TestUser",
    broadcaster_user_id: "12345",
    broadcaster_user_login: "testchannel",
    broadcaster_user_name: "TestChannel",
    total: 5,
    tier: "1000",
    cumulative_total: 20,
    is_anonymous: false,
    ...overrides,
  };
}

describe("parseSubscriptionGiftEvent", () => {
  it("parses a standard gift event", () => {
    const result = parseSubscriptionGiftEvent(baseGiftPayload());

    expect(result).toEqual({
      username: "TestUser",
      total: 5,
      tier: "1000",
    });
  });

  it("returns 匿名 for anonymous gifts", () => {
    const result = parseSubscriptionGiftEvent(
      baseGiftPayload({
        is_anonymous: true,
        user_id: null,
        user_login: null,
        user_name: null,
      }),
    );

    expect(result.username).toBe("匿名");
    expect(result.total).toBe(5);
  });

  it("handles single gift sub", () => {
    const result = parseSubscriptionGiftEvent(baseGiftPayload({ total: 1 }));

    expect(result.total).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// parseRaidEvent
// ---------------------------------------------------------------------------

function baseRaidPayload(
  overrides: Partial<EventSubRaidPayload> = {},
): EventSubRaidPayload {
  return {
    from_broadcaster_user_id: "11111",
    from_broadcaster_user_login: "raider",
    from_broadcaster_user_name: "Raider",
    to_broadcaster_user_id: "12345",
    to_broadcaster_user_login: "testchannel",
    to_broadcaster_user_name: "TestChannel",
    viewers: 150,
    ...overrides,
  };
}

describe("parseRaidEvent", () => {
  it("parses a standard raid event", () => {
    const result = parseRaidEvent(baseRaidPayload());

    expect(result).toEqual({
      username: "Raider",
      viewers: 150,
    });
  });

  it("handles small raids", () => {
    const result = parseRaidEvent(baseRaidPayload({ viewers: 1 }));

    expect(result.viewers).toBe(1);
  });

  it("handles large raids", () => {
    const result = parseRaidEvent(baseRaidPayload({ viewers: 50000 }));

    expect(result.viewers).toBe(50000);
  });
});

// ---------------------------------------------------------------------------
// parseChannelPointRedemption
// ---------------------------------------------------------------------------

function baseRedemptionPayload(
  overrides: Partial<EventSubChannelPointRedemptionPayload> = {},
): EventSubChannelPointRedemptionPayload {
  return {
    broadcaster_user_id: "12345",
    broadcaster_user_login: "testchannel",
    broadcaster_user_name: "TestChannel",
    user_id: "67890",
    user_login: "testuser",
    user_name: "TestUser",
    user_input: "",
    reward: {
      id: "reward-001",
      title: "Hydrate!",
      cost: 500,
    },
    redeemed_at: "2026-04-06T00:00:00Z",
    ...overrides,
  };
}

describe("parseChannelPointRedemption", () => {
  it("parses a standard redemption", () => {
    const result = parseChannelPointRedemption(baseRedemptionPayload());

    expect(result).toEqual({
      username: "TestUser",
      rewardTitle: "Hydrate!",
      userInput: null,
    });
  });

  it("includes user input when provided", () => {
    const result = parseChannelPointRedemption(
      baseRedemptionPayload({ user_input: "Play this song please!" }),
    );

    expect(result.userInput).toBe("Play this song please!");
  });

  it("returns null userInput for empty string", () => {
    const result = parseChannelPointRedemption(
      baseRedemptionPayload({ user_input: "" }),
    );

    expect(result.userInput).toBeNull();
  });
});
