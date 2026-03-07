import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { encodeOverlayStyleConfig } from "./lib/overlay-customization";

describe("App themed overlay", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("VITE_CHANNEL_NAME", "test_channel");
    vi.stubEnv("VITE_DEBUG_MODE", "0");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it("applies font and accent theme variables from cfg", () => {
    const packed = encodeOverlayStyleConfig({
      v: 1,
      f: "kaisei",
      c: "225588",
      a: "crescent",
    });

    window.history.pushState({}, "", `/?test=1&cfg=${packed}`);
    render(<App />);

    const overlayRoot = screen.getByTestId("overlay-root");
    expect(overlayRoot.style.getPropertyValue("--overlay-font-family")).toContain("Kaisei Decol");
    expect(overlayRoot.style.getPropertyValue("--flower-color")).toBe("#225588");
  });

  it("renders the selected avatar preset inside message rows", () => {
    const packed = encodeOverlayStyleConfig({
      v: 1,
      f: "zen",
      c: "446688",
      a: "star",
    });

    window.history.pushState({}, "", `/?test=1&cfg=${packed}`);
    const { container } = render(<App />);

    const avatarMark = container.querySelector(".avatar-mark");
    expect(avatarMark).toHaveAttribute("data-avatar-preset", "star");
  });
});
