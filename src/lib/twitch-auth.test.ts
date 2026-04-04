import { afterEach, describe, expect, it, vi } from "vitest";
import {
  requestDeviceCode,
  refreshAccessToken,
  storeToken,
  getStoredToken,
  clearToken,
  isTokenExpired,
  type TwitchToken,
} from "./twitch-auth";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("requestDeviceCode", () => {
  it("posts to the device code endpoint with correct params", async () => {
    const mockResponse = {
      device_code: "dc_123",
      expires_in: 1800,
      interval: 5,
      user_code: "ABCD-1234",
      verification_uri: "https://www.twitch.tv/activate",
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    );

    const result = await requestDeviceCode("test_client_id");

    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = vi.mocked(fetch).mock.calls[0]!;
    expect(url).toBe("https://id.twitch.tv/oauth2/device");
    expect(init?.method).toBe("POST");
    const body = init?.body as URLSearchParams;
    expect(body.get("client_id")).toBe("test_client_id");
    expect(body.get("scopes")).toBe("user:read:chat");
  });

  it("throws on non-200 response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("bad request", { status: 400 }),
    );

    await expect(requestDeviceCode("bad_id")).rejects.toThrow("Device code request failed");
  });
});

describe("refreshAccessToken", () => {
  it("returns a new token on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: "new_access",
          refresh_token: "new_refresh",
          expires_in: 14400,
          scope: ["user:read:chat"],
        }),
        { status: 200 },
      ),
    );

    const result = await refreshAccessToken("client_id", "old_refresh");

    expect(result).not.toBeNull();
    expect(result!.accessToken).toBe("new_access");
    expect(result!.refreshToken).toBe("new_refresh");
  });

  it("returns null on failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("invalid", { status: 401 }),
    );

    const result = await refreshAccessToken("client_id", "bad_refresh");
    expect(result).toBeNull();
  });
});

describe("token storage", () => {
  const sampleToken: TwitchToken = {
    accessToken: "access_123",
    refreshToken: "refresh_456",
    expiresAt: Date.now() + 3600_000,
    scope: ["user:read:chat"],
  };

  it("round-trips a token through localStorage", () => {
    storeToken(sampleToken);
    const retrieved = getStoredToken();
    expect(retrieved).toEqual(sampleToken);
  });

  it("returns null when no token is stored", () => {
    expect(getStoredToken()).toBeNull();
  });

  it("returns null for corrupted localStorage data", () => {
    localStorage.setItem("twitch_overlay_token", "not-valid-json");
    expect(getStoredToken()).toBeNull();
  });

  it("clears the stored token", () => {
    storeToken(sampleToken);
    clearToken();
    expect(getStoredToken()).toBeNull();
  });
});

describe("isTokenExpired", () => {
  it("returns false for a token expiring well in the future", () => {
    const token: TwitchToken = {
      accessToken: "a",
      refreshToken: "r",
      expiresAt: Date.now() + 3600_000,
      scope: [],
    };
    expect(isTokenExpired(token)).toBe(false);
  });

  it("returns true for a token that has already expired", () => {
    const token: TwitchToken = {
      accessToken: "a",
      refreshToken: "r",
      expiresAt: Date.now() - 1000,
      scope: [],
    };
    expect(isTokenExpired(token)).toBe(true);
  });

  it("returns true when token is within the 5-minute buffer", () => {
    const token: TwitchToken = {
      accessToken: "a",
      refreshToken: "r",
      expiresAt: Date.now() + 4 * 60 * 1000,
      scope: [],
    };
    expect(isTokenExpired(token)).toBe(true);
  });

  it("returns false when token is just outside the 5-minute buffer", () => {
    const token: TwitchToken = {
      accessToken: "a",
      refreshToken: "r",
      expiresAt: Date.now() + 6 * 60 * 1000,
      scope: [],
    };
    expect(isTokenExpired(token)).toBe(false);
  });
});
