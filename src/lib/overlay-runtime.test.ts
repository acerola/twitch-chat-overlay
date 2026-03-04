import { describe, expect, it } from "vitest";
import { pruneFeedByEntries } from "./overlay-runtime";
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
