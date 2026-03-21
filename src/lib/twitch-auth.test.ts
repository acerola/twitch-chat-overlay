import { afterEach, describe, expect, it, vi } from "vitest";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  buildAuthUrl,
  storeToken,
  getStoredToken,
  clearToken,
  isTokenExpired,
  storeVerifier,
  getStoredVerifier,
  clearVerifier,
  storeOAuthState,
  getStoredOAuthState,
  clearOAuthState,
  type TwitchToken,
} from "./twitch-auth";

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("generateCodeVerifier", () => {
  it("returns a string of length 128", () => {
    const verifier = generateCodeVerifier();
    expect(verifier).toHaveLength(128);
  });

  it("contains only URL-safe characters", () => {
    const verifier = generateCodeVerifier();
    expect(verifier).toMatch(/^[A-Za-z0-9_~.-]+$/);
  });

  it("produces different values on successive calls", () => {
    const a = generateCodeVerifier();
    const b = generateCodeVerifier();
    expect(a).not.toBe(b);
  });
});

describe("generateCodeChallenge", () => {
  it("returns a base64url-encoded string without padding", async () => {
    const challenge = await generateCodeChallenge("test_verifier_value");
    // base64url: A-Z a-z 0-9 - _ (no +, /, or =)
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("produces a consistent hash for the same input", async () => {
    const a = await generateCodeChallenge("deterministic_input");
    const b = await generateCodeChallenge("deterministic_input");
    expect(a).toBe(b);
  });

  it("produces different hashes for different inputs", async () => {
    const a = await generateCodeChallenge("input_one");
    const b = await generateCodeChallenge("input_two");
    expect(a).not.toBe(b);
  });
});

describe("buildAuthUrl", () => {
  it("builds a correct Twitch OAuth URL with all required params", () => {
    const url = buildAuthUrl({
      clientId: "test_client_id",
      redirectUri: "http://localhost:3000/callback",
      codeChallenge: "test_challenge",
      state: "random_state",
    });

    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      "https://id.twitch.tv/oauth2/authorize",
    );
    expect(parsed.searchParams.get("client_id")).toBe("test_client_id");
    expect(parsed.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/callback",
    );
    expect(parsed.searchParams.get("response_type")).toBe("code");
    expect(parsed.searchParams.get("scope")).toBe("user:read:chat");
    expect(parsed.searchParams.get("code_challenge")).toBe("test_challenge");
    expect(parsed.searchParams.get("code_challenge_method")).toBe("S256");
    expect(parsed.searchParams.get("state")).toBe("random_state");
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
      expiresAt: Date.now() + 3600_000, // 1 hour from now
      scope: [],
    };
    expect(isTokenExpired(token)).toBe(false);
  });

  it("returns true for a token that has already expired", () => {
    const token: TwitchToken = {
      accessToken: "a",
      refreshToken: "r",
      expiresAt: Date.now() - 1000, // 1 second ago
      scope: [],
    };
    expect(isTokenExpired(token)).toBe(true);
  });

  it("returns true when token is within the 5-minute buffer", () => {
    const token: TwitchToken = {
      accessToken: "a",
      refreshToken: "r",
      expiresAt: Date.now() + 4 * 60 * 1000, // 4 minutes from now (within 5-min buffer)
      scope: [],
    };
    expect(isTokenExpired(token)).toBe(true);
  });

  it("returns false when token is just outside the 5-minute buffer", () => {
    const token: TwitchToken = {
      accessToken: "a",
      refreshToken: "r",
      expiresAt: Date.now() + 6 * 60 * 1000, // 6 minutes from now
      scope: [],
    };
    expect(isTokenExpired(token)).toBe(false);
  });
});

describe("PKCE state storage (sessionStorage)", () => {
  it("stores and retrieves a verifier", () => {
    storeVerifier("verifier_abc");
    expect(getStoredVerifier()).toBe("verifier_abc");
  });

  it("returns null when no verifier is stored", () => {
    expect(getStoredVerifier()).toBeNull();
  });

  it("clears the verifier", () => {
    storeVerifier("verifier_abc");
    clearVerifier();
    expect(getStoredVerifier()).toBeNull();
  });

  it("stores and retrieves an OAuth state", () => {
    storeOAuthState("state_xyz");
    expect(getStoredOAuthState()).toBe("state_xyz");
  });

  it("returns null when no state is stored", () => {
    expect(getStoredOAuthState()).toBeNull();
  });

  it("clears the OAuth state", () => {
    storeOAuthState("state_xyz");
    clearOAuthState();
    expect(getStoredOAuthState()).toBeNull();
  });
});
