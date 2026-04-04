import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockClient = {
  on: vi.fn(),
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
};

vi.mock("tmi.js", () => {
  return {
    default: {
      Client: vi.fn(() => mockClient),
    },
  };
});

import { App } from "./App";

describe("App debug menu", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("VITE_CHANNEL_NAME", "test_channel");
    vi.stubEnv("VITE_DEBUG_MODE", "1");
    mockClient.on.mockClear();
    mockClient.connect.mockClear();
    mockClient.disconnect.mockClear();
    window.history.pushState({}, "", "/overlay");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it("opens debug panel and triggers debug actions", () => {
    render(<App />);

    expect(screen.queryByTestId("debug-panel")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "デバッグを開く" }));
    expect(screen.getByTestId("debug-panel")).toBeInTheDocument();

    const beforeMessages = screen.queryAllByTestId("message-item").length;
    fireEvent.click(screen.getByRole("button", { name: "テキスト追加" }));
    const afterMessages = screen.queryAllByTestId("message-item").length;
    expect(afterMessages).toBe(beforeMessages + 1);
    expect(screen.getByText("デバッグテキスト 1：表示確認メッセージです")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "長文テキスト追加" }));
    expect(screen.getByText(/長文テキスト 1：/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "長いユーザー名" }));
    expect(screen.getByText(/長いユーザー名テスト 1：/)).toBeInTheDocument();

    const beforeAlerts = screen.queryAllByTestId("alert-item").length;
    fireEvent.click(screen.getByRole("button", { name: "ビッツ通知 (500)" }));
    const afterAlerts = screen.queryAllByTestId("alert-item").length;
    expect(afterAlerts).toBe(beforeAlerts + 1);

    const beforeRoleMessages = screen.queryAllByTestId("message-item").length;
    fireEvent.click(screen.getByRole("button", { name: "VIPロール" }));
    const afterRoleMessages = screen.queryAllByTestId("message-item").length;
    expect(afterRoleMessages).toBe(beforeRoleMessages + 1);
    expect(screen.getByText("VIP ロール表示確認")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "全消去" }));
    expect(screen.queryAllByTestId("message-item")).toHaveLength(0);
    expect(screen.queryAllByTestId("alert-item")).toHaveLength(0);
  });

  it("hides debug controls when VITE_DEBUG_MODE=0", () => {
    vi.stubEnv("VITE_DEBUG_MODE", "0");
    window.history.pushState({}, "", "/overlay?test=1");
    render(<App />);

    expect(screen.queryByRole("button", { name: "デバッグを開く" })).not.toBeInTheDocument();
  });

  it("shows setup hint when channel and debug mode are both disabled", () => {
    vi.stubEnv("VITE_CHANNEL_NAME", "");
    vi.stubEnv("VITE_DEBUG_MODE", "0");
    window.history.pushState({}, "", "/overlay");
    render(<App />);

    expect(screen.getByText("チャンネル名が未設定、または形式が不正です。")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "デバッグを開く" })).not.toBeInTheDocument();
  });

  it("shows debug controls without channel when debug mode is on", () => {
    vi.unstubAllEnvs();
    vi.stubEnv("VITE_DEBUG_MODE", "1");
    window.history.pushState({}, "", "/");

    render(<App />);

    expect(screen.getByRole("button", { name: "デバッグを開く" })).toBeInTheDocument();
    expect(screen.queryByText("チャンネル名が未設定、または形式が不正です。")).not.toBeInTheDocument();
  });

  it("supports all emote debug patterns", () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "デバッグを開く" }));
    fireEvent.click(screen.getByRole("button", { name: "1エモートのみ" }));
    fireEvent.click(screen.getByRole("button", { name: "2+エモートのみ" }));
    fireEvent.click(screen.getByRole("button", { name: "エモート+テキスト" }));

    expect(container.querySelectorAll("img.emote").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Hi/)).toBeInTheDocument();
    expect(screen.getByText(/wow/)).toBeInTheDocument();
  });

  it("supports long username debug case", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "デバッグを開く" }));
    fireEvent.click(screen.getByRole("button", { name: "長いユーザー名" }));

    expect(screen.getByText(/長いユーザー名テスト 1：/)).toBeInTheDocument();
    expect(screen.getByText(/これは非常に長いユーザー名テスト1です省略表示を確認します/)).toBeInTheDocument();
  });

  it("supports multiple role debug cases", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "デバッグを開く" }));
    fireEvent.click(screen.getByRole("button", { name: "VIPロール" }));
    fireEvent.click(screen.getByRole("button", { name: "モデロール" }));
    fireEvent.click(screen.getByRole("button", { name: "サブロール" }));
    fireEvent.click(screen.getByRole("button", { name: "配信者ロール" }));
    fireEvent.click(screen.getByRole("button", { name: "複合ロール" }));
    fireEvent.click(screen.getByRole("button", { name: "Staffロール" }));
    fireEvent.click(screen.getByRole("button", { name: "Adminロール" }));
    fireEvent.click(screen.getByRole("button", { name: "GlobalModロール" }));
    fireEvent.click(screen.getByRole("button", { name: "Partnerロール" }));
    fireEvent.click(screen.getByRole("button", { name: "Founderロール" }));
    fireEvent.click(screen.getByRole("button", { name: "Artistロール" }));
    fireEvent.click(screen.getByRole("button", { name: "Turboロール" }));

    expect(screen.getByText("VIP ロール表示確認")).toBeInTheDocument();
    expect(screen.getByText("モデレーター ロール表示確認")).toBeInTheDocument();
    expect(screen.getByText("サブスク ロール表示確認")).toBeInTheDocument();
    expect(screen.getByText("配信者 ロール表示確認")).toBeInTheDocument();
    expect(screen.getByText("複合ロール表示確認")).toBeInTheDocument();
    expect(screen.getByText("Staff ロール表示確認")).toBeInTheDocument();
    expect(screen.getByText("Admin ロール表示確認")).toBeInTheDocument();
    expect(screen.getByText("Global Mod ロール表示確認")).toBeInTheDocument();
    expect(screen.getByText("Partner ロール表示確認")).toBeInTheDocument();
    expect(screen.getByText("Founder ロール表示確認")).toBeInTheDocument();
    expect(screen.getByText("Artist ロール表示確認")).toBeInTheDocument();
    expect(screen.getByText("Turbo ロール表示確認")).toBeInTheDocument();
  });

  it("keeps role debug messages unique across repeated clicks", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "デバッグを開く" }));
    fireEvent.click(screen.getByRole("button", { name: "VIPロール" }));
    fireEvent.click(screen.getByRole("button", { name: "VIPロール" }));

    expect(screen.getByText("デバッグVIP1")).toBeInTheDocument();
    expect(screen.getByText("デバッグVIP2")).toBeInTheDocument();
  });

  it("alert buttons do not clear existing chat rows", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "デバッグを開く" }));

    fireEvent.click(screen.getByRole("button", { name: "テキスト追加" }));
    expect(screen.getByText("デバッグテキスト 1：表示確認メッセージです")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "サブ通知" }));
    fireEvent.click(screen.getByRole("button", { name: "ギフト通知" }));
    fireEvent.click(screen.getByRole("button", { name: "レイド通知" }));

    expect(screen.getByText("デバッグテキスト 1：表示確認メッセージです")).toBeInTheDocument();
    expect(screen.queryAllByTestId("alert-item").length).toBeGreaterThanOrEqual(3);
  });

  it("trims oldest rows when mixed-height feed exceeds container", async () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "デバッグを開く" }));

    fireEvent.click(screen.getByRole("button", { name: "テキスト追加" }));
    fireEvent.click(screen.getByRole("button", { name: "テキスト追加" }));
    fireEvent.click(screen.getByRole("button", { name: "テキスト追加" }));

    const stack = container.querySelector(".message-stack");
    expect(stack).toBeInstanceOf(HTMLElement);
    if (!stack) {
      return;
    }
    const stackEl = stack as HTMLElement;

    Object.defineProperty(stackEl, "clientHeight", {
      configurable: true,
      get: () => 250,
    });

    const rows = Array.from(container.querySelectorAll<HTMLElement>(".feed-entry"));
    for (const row of rows) {
      Object.defineProperty(row, "offsetHeight", {
        configurable: true,
        get: () => 108,
      });
    }

    window.dispatchEvent(new Event("resize"));

    await waitFor(() => {
      expect(screen.queryByText("デバッグテキスト 1：表示確認メッセージです")).not.toBeInTheDocument();
      expect(screen.getByText("デバッグテキスト 2：表示確認メッセージです")).toBeInTheDocument();
      expect(screen.getByText("デバッグテキスト 3：表示確認メッセージです")).toBeInTheDocument();
    });
  });

  it("compresses row gap when top blank is recoverable", async () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "デバッグを開く" }));

    fireEvent.click(screen.getByRole("button", { name: "テキスト追加" }));
    fireEvent.click(screen.getByRole("button", { name: "テキスト追加" }));
    fireEvent.click(screen.getByRole("button", { name: "テキスト追加" }));
    fireEvent.click(screen.getByRole("button", { name: "テキスト追加" }));
    fireEvent.click(screen.getByRole("button", { name: "テキスト追加" }));

    const stack = container.querySelector(".message-stack");
    expect(stack).toBeInstanceOf(HTMLElement);
    if (!stack) {
      return;
    }
    const stackEl = stack as HTMLElement;

    Object.defineProperty(stackEl, "clientHeight", {
      configurable: true,
      get: () => 250,
    });

    const rows = Array.from(container.querySelectorAll<HTMLElement>(".feed-entry"));
    for (const row of rows) {
      Object.defineProperty(row, "offsetHeight", {
        configurable: true,
        get: () => 60,
      });
    }

    window.dispatchEvent(new Event("resize"));

    await waitFor(() => {
      const rowGap = Number.parseFloat(stackEl.style.getPropertyValue("--feed-row-gap"));
      expect(rowGap).toBeLessThan(20);
      expect(rowGap).toBeGreaterThanOrEqual(2);
      expect(screen.queryByText("デバッグテキスト 1：表示確認メッセージです")).not.toBeInTheDocument();
      expect(screen.getByText("デバッグテキスト 5：表示確認メッセージです")).toBeInTheDocument();
    });
  });

  it("keeps base row gap when blank cannot be recovered by spacing", async () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "デバッグを開く" }));

    fireEvent.click(screen.getByRole("button", { name: "テキスト追加" }));
    fireEvent.click(screen.getByRole("button", { name: "テキスト追加" }));
    fireEvent.click(screen.getByRole("button", { name: "テキスト追加" }));
    fireEvent.click(screen.getByRole("button", { name: "テキスト追加" }));

    const stack = container.querySelector(".message-stack");
    expect(stack).toBeInstanceOf(HTMLElement);
    if (!stack) {
      return;
    }
    const stackEl = stack as HTMLElement;

    Object.defineProperty(stackEl, "clientHeight", {
      configurable: true,
      get: () => 250,
    });

    const rows = Array.from(container.querySelectorAll<HTMLElement>(".feed-entry"));
    for (const row of rows) {
      Object.defineProperty(row, "offsetHeight", {
        configurable: true,
        get: () => 40,
      });
    }

    window.dispatchEvent(new Event("resize"));

    await waitFor(() => {
      const rowGap = Number.parseFloat(stackEl.style.getPropertyValue("--feed-row-gap"));
      expect(rowGap).toBe(20);
      expect(screen.getByText("デバッグテキスト 1：表示確認メッセージです")).toBeInTheDocument();
      expect(screen.getByText("デバッグテキスト 4：表示確認メッセージです")).toBeInTheDocument();
    });
  });
});
