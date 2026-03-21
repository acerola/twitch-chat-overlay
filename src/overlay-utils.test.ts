import { describe, expect, it } from "vitest";
import {
  getRoleBadges,
  isEmoteOnlyMessage,
  makeAlertText,
  normalizeChannel,
  parseMessageWithEmotes,
  resolveChannel,
} from "./overlay-utils";

describe("overlay-utils", () => {
  it("normalizes valid channel names", () => {
    expect(normalizeChannel("  My_Channel  ")).toBe("my_channel");
  });

  it("rejects invalid channel names", () => {
    expect(normalizeChannel("ab")).toBeNull();
    expect(normalizeChannel("bad-name")).toBeNull();
  });

  it("parses emotes into text and emote segments", () => {
    const segments = parseMessageWithEmotes("Kappa hi Keepo", {
      "25": ["0-4"],
      "1902": ["9-13"],
    });

    expect(segments).toEqual([
      { type: "emote", emoteId: "25", alt: "Kappa" },
      { type: "text", value: " hi " },
      { type: "emote", emoteId: "1902", alt: "Keepo" },
    ]);
  });

  it("sorts emotes and ignores invalid ranges", () => {
    const segments = parseMessageWithEmotes("Kappa hi Keepo", {
      "1902": ["9-13"],
      "25": ["0-4", "bad", "4-2"],
    });

    expect(segments).toEqual([
      { type: "emote", emoteId: "25", alt: "Kappa" },
      { type: "text", value: " hi " },
      { type: "emote", emoteId: "1902", alt: "Keepo" },
    ]);
  });

  it("falls back to text when emote ranges are all invalid", () => {
    expect(
      parseMessageWithEmotes("hello", {
        "25": ["oops", "8-2", "-1-2"],
      }),
    ).toEqual([{ type: "text", value: "hello" }]);
  });

  it("detects emote-only messages", () => {
    expect(
      isEmoteOnlyMessage([
        { type: "emote", emoteId: "25", alt: "Kappa" },
        { type: "text", value: " " },
      ]),
    ).toBe(true);

    expect(
      isEmoteOnlyMessage([
        { type: "text", value: "hello" },
        { type: "emote", emoteId: "25", alt: "Kappa" },
      ]),
    ).toBe(false);
  });

  it("maps role badges in stable order", () => {
    expect(
      getRoleBadges({
        broadcaster: "1",
        moderator: "1",
        vip: "1",
        subscriber: "12",
        founder: "0",
        staff: "1",
        admin: "1",
        global_mod: "1",
        partner: "1",
        artist: "1",
        turbo: "1",
      }),
    ).toEqual([
      "broadcaster",
      "staff",
      "admin",
      "global_mod",
      "moderator",
      "vip",
      "partner",
      "artist",
      "founder",
      "subscriber",
      "turbo",
    ]);
  });

  it("keeps alert text as-is", () => {
    expect(makeAlertText("デバッグユーザーが 500 ビッツ応援")).toBe("デバッグユーザーが 500 ビッツ応援");
  });
});

describe("resolveChannel", () => {
  it("returns URL param when provided", () => {
    expect(resolveChannel("streamername", "envname")).toBe("streamername");
  });
  it("falls back to env var when URL param is null", () => {
    expect(resolveChannel(null, "envname")).toBe("envname");
  });
  it("falls back to env var when URL param is empty", () => {
    expect(resolveChannel("", "envname")).toBe("envname");
  });
  it("returns null when both are null", () => {
    expect(resolveChannel(null, null)).toBeNull();
  });
  it("normalizes the URL param", () => {
    expect(resolveChannel("  StreamerName  ", null)).toBe("streamername");
  });
  it("rejects invalid channel names from URL param and falls back", () => {
    expect(resolveChannel("ab", "envname")).toBe("envname");
  });
});
