import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { getCustomizerPreviewOffset } from "./components/CustomizerPage";
import {
  DEFAULT_OVERLAY_STYLE_CONFIG,
  encodeOverlayStyleConfig,
} from "./lib/overlay-customization";

describe("App customizer", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(min-width: 721px)",
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
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
    expect(screen.getByTestId("customizer-preview-panel")).toBeInTheDocument();
    expect(screen.getByTestId("overlay-root")).toBeInTheDocument();
  });

  it("calculates a clamped preview offset from scroll position", () => {
    expect(
      getCustomizerPreviewOffset({
        containerTop: 120,
        containerHeight: 1100,
        panelHeight: 720,
      }),
    ).toBe(0);

    expect(
      getCustomizerPreviewOffset({
        containerTop: -180,
        containerHeight: 1100,
        panelHeight: 720,
      }),
    ).toBe(204);

    expect(
      getCustomizerPreviewOffset({
        containerTop: -900,
        containerHeight: 1100,
        panelHeight: 720,
      }),
    ).toBe(380);
  });

  it("prefills the form from cfg query params", () => {
    const packed = encodeOverlayStyleConfig({
      v: 1,
      f: "rocknroll",
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

    fireEvent.click(screen.getByRole("button", { name: "RocknRoll One ポップ太字" }));

    await waitFor(() => {
      expect(overlayRoot.style.getPropertyValue("--overlay-font-family")).toContain("RocknRoll One");
    });

    expect(
      screen.getByRole("button", { name: "RocknRoll One ポップ太字" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps the OBS URL in sync without channel and debug params", () => {
    window.history.pushState({}, "", "/?customize=1");
    render(<App />);

    const output = screen.getByLabelText("生成URL") as HTMLTextAreaElement;
    fireEvent.click(screen.getByRole("button", { name: "Star" }));

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

    fireEvent.change(screen.getByLabelText("ネーム文字コード"), {
      target: { value: "#221122" },
    });

    const overlayRoot = screen.getByTestId("overlay-root");
    await waitFor(() => {
      expect(overlayRoot.style.getPropertyValue("--name-color")).toBe("#221122");
    });
  });

  it("loads settings from a pasted customized url", async () => {
    const packed = encodeOverlayStyleConfig({
      v: 1,
      f: "dotgothic",
      c: "336699",
      a: "vampire",
      nt: "faf7ff",
    });

    window.history.pushState({}, "", "/?customize=1");
    render(<App />);

    fireEvent.change(screen.getByLabelText("読み込み用URL"), {
      target: { value: `https://example.com/twitch-chat-overlay/?cfg=${packed}` },
    });
    fireEvent.click(screen.getByRole("button", { name: "URL を読み込む" }));

    await waitFor(() => {
      expect(screen.getByLabelText("メインカラー")).toHaveValue("#336699");
    });

    expect(
      screen.getByRole("button", { name: "DotGothic16 レトロドット" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Vampire Wings" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText("読み込み用URL")).toHaveValue("");
    expect(screen.getByText("URL の設定を読み込みました。")).toBeInTheDocument();
  });

  it("loads settings from a pasted customize-page url", async () => {
    const packed = encodeOverlayStyleConfig({
      v: 1,
      f: "klee",
      c: "7755aa",
      a: "crescent",
      mc: "f5efff",
    });

    window.history.pushState({}, "", "/?customize=1");
    render(<App />);

    fireEvent.change(screen.getByLabelText("読み込み用URL"), {
      target: {
        value: `https://example.com/twitch-chat-overlay/?customize=1&cfg=${packed}`,
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "URL を読み込む" }));

    await waitFor(() => {
      expect(screen.getByLabelText("メインカラー")).toHaveValue("#7755aa");
    });

    expect(screen.getByRole("button", { name: "Klee One やさしい手書き" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Crescent" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("shows an import error when the pasted url has no cfg", () => {
    window.history.pushState({}, "", "/?customize=1");
    render(<App />);

    fireEvent.change(screen.getByLabelText("読み込み用URL"), {
      target: { value: "https://example.com/twitch-chat-overlay/" },
    });
    fireEvent.click(screen.getByRole("button", { name: "URL を読み込む" }));

    expect(
      screen.getByText("cfg 付きの URL を貼り付けてください。"),
    ).toBeInTheDocument();
  });

  it("shows an import error when the pasted value is not a valid url", () => {
    window.history.pushState({}, "", "/?customize=1");
    render(<App />);

    fireEvent.change(screen.getByLabelText("読み込み用URL"), {
      target: { value: "not-a-url" },
    });
    fireEvent.click(screen.getByRole("button", { name: "URL を読み込む" }));

    expect(
      screen.getByText("有効な URL を貼り付けてください。"),
    ).toBeInTheDocument();
  });

  it("shows an import error when the pasted url has an invalid cfg", () => {
    window.history.pushState({}, "", "/?customize=1");
    render(<App />);

    fireEvent.change(screen.getByLabelText("読み込み用URL"), {
      target: { value: "https://example.com/twitch-chat-overlay/?cfg=bad-data" },
    });
    fireEvent.click(screen.getByRole("button", { name: "URL を読み込む" }));

    expect(
      screen.getByText("URL の設定を読み込めませんでした。"),
    ).toBeInTheDocument();
  });

  it("resets the theme draft back to the default blossom theme", () => {
    window.history.pushState({}, "", "/?customize=1");
    render(<App />);

    fireEvent.change(screen.getByLabelText("メインカラー"), {
      target: { value: "#123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Star" }));
    fireEvent.click(screen.getByRole("button", { name: "デフォルトへ戻す" }));

    expect(screen.getByLabelText("メインカラー")).toHaveValue(`#${DEFAULT_OVERLAY_STYLE_CONFIG.c}`);
  });

  it("selects the generated url when clipboard is unavailable", async () => {
    const focusMock = vi.fn();
    const selectMock = vi.fn();

    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });

    window.history.pushState({}, "", "/?customize=1");
    render(<App />);

    const output = screen.getByLabelText("生成URL") as HTMLTextAreaElement;
    output.focus = focusMock;
    output.select = selectMock;

    fireEvent.click(screen.getByRole("button", { name: "コピー" }));

    await waitFor(() => {
      expect(focusMock).toHaveBeenCalled();
      expect(selectMock).toHaveBeenCalled();
    });
    expect(
      screen.getByText(/自動コピーできないため、URL を選択しました。Ctrl\+C でコピーしてください。/),
    ).toBeInTheDocument();
  });
});
