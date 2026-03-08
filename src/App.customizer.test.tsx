import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import {
  DEFAULT_OVERLAY_STYLE_CONFIG,
  encodeOverlayStyleConfig,
} from "./lib/overlay-customization";

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
    expect(screen.getByTestId("customizer-preview")).toBeInTheDocument();
    expect(screen.getByTestId("overlay-root")).toBeInTheDocument();
  });

  it("prefills the form from cfg query params", () => {
    const packed = encodeOverlayStyleConfig({
      v: 1,
      f: "kaisei",
      c: "224466",
      a: "star",
      nt: "faf7ff",
    });

    window.history.pushState({}, "", `/?customize=1&cfg=${packed}`);
    render(<App />);

    expect(screen.getByLabelText("メインカラー")).toHaveValue("#224466");
    expect(screen.getByLabelText("メインカラーコード")).toHaveValue("#224466");
    expect(screen.getByLabelText("ネーム文字コード")).toHaveValue("#faf7ff");
  });

  it("updates the embedded preview from draft settings", async () => {
    window.history.pushState({}, "", "/?customize=1");
    render(<App />);

    const overlayRoot = screen.getByTestId("overlay-root");

    fireEvent.click(screen.getByRole("button", { name: "Kaisei Decol 和風デコ文字" }));

    await waitFor(() => {
      expect(overlayRoot.style.getPropertyValue("--overlay-font-family")).toContain("Kaisei Decol");
    });
  });

  it("keeps the OBS URL in sync without channel and debug params", () => {
    window.history.pushState({}, "", "/?customize=1");
    render(<App />);

    const output = screen.getByLabelText("生成URL") as HTMLTextAreaElement;
    fireEvent.click(screen.getByRole("button", { name: "Star 星モチーフ" }));

    const generatedUrl = output.value;
    expect(generatedUrl).toContain("cfg=");
    expect(generatedUrl).not.toContain("channel=");
    expect(generatedUrl).not.toContain("debug=");
    expect(generatedUrl).not.toContain("test=");
    expect(generatedUrl).not.toContain("customize=");
  });

  it("accepts manual hex color input and syncs the embedded preview state", async () => {
    window.history.pushState({}, "", "/?customize=1");
    render(<App />);

    fireEvent.change(screen.getByLabelText("メインカラーコード"), {
      target: { value: "#225588" },
    });

    expect(screen.getByLabelText("メインカラー")).toHaveValue("#225588");

    const overlayRoot = screen.getByTestId("overlay-root");
    await waitFor(() => {
      expect(overlayRoot.style.getPropertyValue("--flower-color")).toBe("#225588");
    });
  });

  it("accepts individual overlay color overrides", async () => {
    window.history.pushState({}, "", "/?customize=1");
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "詳細カラーを開く" }));
    fireEvent.change(screen.getByLabelText("ネーム文字コード"), {
      target: { value: "#221122" },
    });

    const overlayRoot = screen.getByTestId("overlay-root");
    await waitFor(() => {
      expect(overlayRoot.style.getPropertyValue("--name-color")).toBe("#221122");
    });
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
