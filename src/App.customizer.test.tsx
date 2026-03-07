import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { DEFAULT_OVERLAY_STYLE_CONFIG, encodeOverlayStyleConfig } from "./lib/overlay-customization";

describe("App customizer", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("VITE_CHANNEL_NAME", "test_channel");
    vi.stubEnv("VITE_DEBUG_MODE", "0");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it("renders the customizer when customize=1 is set", () => {
    window.history.pushState({}, "", "/?customize=1");
    render(<App />);

    expect(screen.getByTestId("customizer-page")).toBeInTheDocument();
    expect(screen.queryByTestId("overlay-root")).not.toBeInTheDocument();
  });

  it("prefills the form from cfg query params", () => {
    const packed = encodeOverlayStyleConfig({
      v: 1,
      f: "kaisei",
      c: "224466",
      a: "star",
    });

    window.history.pushState({}, "", `/?customize=1&cfg=${packed}`);
    render(<App />);

    expect(screen.getByLabelText("メインカラー")).toHaveValue("#224466");
  });

  it("updates the iframe preview from draft settings without leaking customize=1", async () => {
    window.history.pushState({}, "", "/?customize=1");
    render(<App />);

    const frame = screen.getByTitle("オーバーレイプレビュー");
    const initialSrc = frame.getAttribute("src") ?? "";
    expect(initialSrc).toContain("test=1");
    expect(initialSrc).not.toContain("customize=1");

    fireEvent.click(screen.getByRole("button", { name: "Kaisei Decol 和風デコ文字" }));

    await waitFor(() => {
      expect(frame.getAttribute("src")).not.toBe(initialSrc);
    });
  });

  it("generates an OBS-ready URL without channel and debug params", () => {
    window.history.pushState({}, "", "/?customize=1");
    render(<App />);

    const generateButton = screen.getByRole("button", { name: "URL を生成" });
    const output = screen.getByLabelText("生成URL") as HTMLTextAreaElement;
    fireEvent.click(screen.getByRole("button", { name: "Star 星モチーフ" }));
    fireEvent.click(generateButton);

    const generatedUrl = output.value;
    expect(generatedUrl).toContain("cfg=");
    expect(generatedUrl).not.toContain("channel=");
    expect(generatedUrl).not.toContain("debug=");
    expect(generatedUrl).not.toContain("test=");
    expect(generatedUrl).not.toContain("customize=");
  });

  it("resets the theme draft back to the default blossom theme", () => {
    window.history.pushState({}, "", "/?customize=1");
    render(<App />);

    fireEvent.change(screen.getByLabelText("メインカラー"), {
      target: { value: "#123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Gem 宝石モチーフ" }));
    fireEvent.click(screen.getByRole("button", { name: "デフォルトへ戻す" }));

    expect(screen.getByLabelText("メインカラー")).toHaveValue(`#${DEFAULT_OVERLAY_STYLE_CONFIG.c}`);
  });
});
