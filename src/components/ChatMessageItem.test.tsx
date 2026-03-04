import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatMessageItem } from "./ChatMessageItem";
import type { ChatMessage } from "../types/overlay";

function createMessage(partial: Partial<ChatMessage>): ChatMessage {
  return {
    id: "message-1",
    username: "tester",
    text: "",
    color: "#ffffff",
    badges: {},
    emotes: {},
    timestamp: Date.now(),
    ...partial,
  };
}

describe("ChatMessageItem", () => {
  it("applies large emote style for emote-only messages", () => {
    const message = createMessage({
      text: "Kappa Keepo",
      emotes: {
        "25": ["0-4"],
        "1902": ["6-10"],
      },
    });

    const { container } = render(<ChatMessageItem message={message} />);
    const emotes = container.querySelectorAll("img.emote");
    const messageText = container.querySelector(".message-text");

    expect(messageText).toHaveClass("message-text-emote-only");
    expect(emotes).toHaveLength(2);
    for (const emote of emotes) {
      expect(emote).toHaveClass("emote-multi");
      expect(emote).not.toHaveClass("emote-single");
    }
  });

  it("applies single-emote style when only one emote exists", () => {
    const message = createMessage({
      text: "Kappa",
      emotes: {
        "25": ["0-4"],
      },
    });

    const { container } = render(<ChatMessageItem message={message} />);
    const emote = container.querySelector("img.emote");
    const messageText = container.querySelector(".message-text");

    expect(messageText).toHaveClass("message-text-emote-only");
    expect(emote).toBeInTheDocument();
    expect(emote).toHaveClass("emote-single");
    expect(emote).not.toHaveClass("emote-multi");
  });

  it("keeps default emote style for mixed text messages", () => {
    const message = createMessage({
      text: "Kappa hello",
      emotes: {
        "25": ["0-4"],
      },
    });

    const { container } = render(<ChatMessageItem message={message} />);
    const emote = container.querySelector("img.emote");
    const messageText = container.querySelector(".message-text");

    expect(messageText).not.toHaveClass("message-text-emote-only");
    expect(emote).toBeInTheDocument();
    expect(emote).not.toHaveClass("emote-large");
  });
});
