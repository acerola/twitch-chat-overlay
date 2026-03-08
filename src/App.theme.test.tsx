import { cleanup, render, screen, waitFor } from "@testing-library/react";
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
      mc: "f8f4ff",
      nt: "24111f",
    });

    window.history.pushState({}, "", `/?test=1&cfg=${packed}`);
    render(<App />);

    const overlayRoot = screen.getByTestId("overlay-root");
    expect(overlayRoot.style.getPropertyValue("--overlay-font-family")).toContain("Kaisei Decol");
    expect(overlayRoot.style.getPropertyValue("--flower-color")).toBe("#225588");
    expect(overlayRoot.style.getPropertyValue("--message-color")).toBe("#f8f4ff");
    expect(overlayRoot.style.getPropertyValue("--name-color")).toBe("#24111f");
  });

  it("renders the selected avatar preset inside message rows", () => {
    const packed = encodeOverlayStyleConfig({
      v: 1,
      f: "zen",
      c: "446688",
      a: "vampire",
    });

    window.history.pushState({}, "", `/?test=1&cfg=${packed}`);
    const { container } = render(<App />);

    const avatarMark = container.querySelector(".avatar-mark");
    expect(avatarMark).toHaveAttribute("data-avatar-preset", "vampire");
  });

  it("uses the standalone preview path for test mode", async () => {
    window.history.pushState({}, "", "/?test=1");
    render(<App />);

    await waitFor(() => {
      const overlayRoot = screen.getByTestId("overlay-root");
      expect(overlayRoot).toBeInTheDocument();
      expect(screen.queryByTestId("customizer-page")).not.toBeInTheDocument();
    });
  });
});
